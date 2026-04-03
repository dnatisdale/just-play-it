
function updatePlayPauseButton() {
  const isPaused = audio.paused;
  const playIcon = playPauseBtn.querySelector(".play-icon");
  const pauseIcon = playPauseBtn.querySelector(".pause-icon");

  if (playIcon && pauseIcon) {
    playIcon.classList.toggle("hidden", !isPaused);
    pauseIcon.classList.toggle("hidden", isPaused);
  }

  updateSpinning();
}


async function playCurrent() {
  if (playlist.length === 0) return;
  userPaused = false; // User explicitly wants to play
  resumeRetries = 0;  // Clear any stale retry counter

  if (currentTrackIndex === -1) {
    await loadTrack(0, true);
    return;
  }

  if (!audio.src) {
    await loadTrack(currentTrackIndex, true);
    return;
  }

  // Mobile fix: if the audio element has fully ended (currentTime === duration),
  // browsers (especially iOS Safari) reject audio.play() with AbortError/NotAllowedError.
  // Reset to the beginning first so play() works reliably.
  if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.1)) {
    audio.currentTime = 0;
  }

  try {
    await audio.play();
    updatePlayPauseButton();
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  } catch (error) {
    // NotAllowedError means autoplay policy or audio context suspended.
    // NotSupportedError / AbortError can happen if src changed mid-play.
    // In all cases, fall back to a full reload of the track.
    console.warn("audio.play() failed in playCurrent, attempting full reload:", error.name, error.message);
    try {
      await loadTrack(currentTrackIndex, true);
    } catch (reloadError) {
      console.error("Playback reload also failed:", reloadError);
      setPlayerStatus("Playback could not start.");
      showToast("Playback could not start. Try tapping again.");
    }
  }
}

function pauseCurrent() {
  userPaused = true; // User explicitly clicked pause
  audio.pause();
  updatePlayPauseButton();
  setPlayerStatus("Playback paused.");
}

function getRandomTrackIndex(excludeIndex) {
  const enabledIndices = playlist
    .map((t, i) => i)
    .filter((i) => !playlist[i].disabled && i !== excludeIndex);

  if (enabledIndices.length === 0) {
    // If no other enabled tracks, check if CURRENT is enabled
    if (playlist[excludeIndex] && !playlist[excludeIndex].disabled) {
      return excludeIndex;
    }
    // If even current is disabled, find ANY enabled
    const allEnabled = playlist.map((t, i) => i).filter(i => !playlist[i].disabled);
    if (allEnabled.length > 0) return allEnabled[Math.floor(Math.random() * allEnabled.length)];
    return excludeIndex;
  }

  return enabledIndices[Math.floor(Math.random() * enabledIndices.length)];
}

async function playNext() {
  if (playlist.length === 0) return;

  const enabledCount = playlist.filter(t => !t.disabled).length;
  if (enabledCount === 0) {
    showToast("All songs are 'Red Lighted'. Enable some to play.");
    return;
  }

  let nextIndex;

  if (shuffleEnabled) {
    nextIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    let candidate = (currentTrackIndex >= playlist.length - 1) ? 0 : currentTrackIndex + 1;
    let found = false;
    // Walk forward up to one full loop to find an enabled one
    for (let i = 0; i < playlist.length; i++) {
        if (!playlist[candidate].disabled) {
            found = true;
            break;
        }
        candidate = (candidate >= playlist.length - 1) ? 0 : candidate + 1;
    }
    nextIndex = found ? candidate : currentTrackIndex;
  }

  pendingRestoreTime = null;
  await loadTrack(nextIndex, true);
}

async function playPrev() {
  if (playlist.length === 0) return;

  const enabledCount = playlist.filter(t => !t.disabled).length;
  if (enabledCount === 0) {
    showToast("All songs are 'Red Lighted'. Enable some to play.");
    return;
  }

  let prevIndex;

  if (shuffleEnabled) {
    prevIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    let candidate = (currentTrackIndex <= 0) ? playlist.length - 1 : currentTrackIndex - 1;
    let found = false;
    for (let i = 0; i < playlist.length; i++) {
        if (!playlist[candidate].disabled) {
            found = true;
            break;
        }
        candidate = (candidate <= 0) ? playlist.length - 1 : candidate - 1;
    }
    prevIndex = found ? candidate : currentTrackIndex;
  }

  pendingRestoreTime = null;
  await loadTrack(prevIndex, true);
}

function toggleTrackEnabled(index) {
    if (index < 0 || index >= playlist.length) return;
    playlist[index].disabled = !playlist[index].disabled;
    
    // If the track we just disabled was the current one, and we are playing, maybe skip?
    // User probably just wants to disable it for future passes. 
    // But if they red-light the NOW PLAYING track, it's a bit ambiguous.
    // For now, let's just update the UI.

    renderPlaylist();
    savePlaylistState();
    
    const status = playlist[index].disabled ? "Red Light (Skipping)" : "Green Light (Enabled)";
    showToast(`"${playlist[index].title}" set to ${status}.`);
}

function toggleShuffle() {
  shuffleEnabled = !shuffleEnabled;
  saveModes();
  updateModeButtons();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  showToast(`Shuffle ${shuffleEnabled ? "on" : "off"}.`);
}

function cycleRepeatMode() {
  if (repeatMode === "off") {
    repeatMode = "all";
  } else if (repeatMode === "all") {
    repeatMode = "one";
  } else {
    repeatMode = "off";
  }

  saveModes();
  updateModeButtons();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  showToast(`Repeat ${repeatMode}.`);
}

function skipSeconds(seconds) {
  if (!audio.src) {
    showToast("No track loaded.");
    return;
  }
  if (!Number.isFinite(audio.duration)) {
    // Audio metadata not yet loaded — try to seek anyway; it will clamp once loaded
    setPlayerStatus("Track still loading, try again in a moment.");
    return;
  }
  audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  showToast(`${seconds > 0 ? "+" : ""}${seconds}s`);
}

function saveNamedPlaylist() {
  const name = playlistNameInput.value.trim();

  if (!name) {
    showToast("Enter a playlist name first.");
    return;
  }

  // ALLOW empty playlists if user is "Creating" a new one from the Playlists Tab.
  // If we are on the Player Tab, it will save whatever is in the queue.
  const normalizedTracks = playlist
    .map((track) => normalizeTrack(track))
    .filter(Boolean);

  savedPlaylists[name] = {
    name,
    tracks: normalizedTracks,
    savedAt: new Date().toISOString(),
  };

  currentPlaylistName = name;
  updatePlaylistNameDisplay();
  persistSavedPlaylists();
  
  // Clear input for better UX (Bug C)
  playlistNameInput.value = "";
  
  // Sync selected key for later use (e.g. rename/delete)
  selectedPlaylistKey = name;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
  
  if (savedPlaylistBox) savedPlaylistBox.title = `Recently saved: ${name}`;
  
  // ENSURE badges update so UX feels responsive
  updateBadgeCounts();

  setPlayerStatus(`Created playlist "${name}".`);
  showToast(`Created playlist "${name}".`);
}

async function loadNamedPlaylist() {
  const name = selectedPlaylistKey;

  if (!name || !savedPlaylists[name]) {
    showToast("Select a playlist first.");
    return;
  }

  const saved = savedPlaylists[name];
  playlist = (saved.tracks || [])
    .map((track) => normalizeTrack(track))
    .filter(Boolean);

  currentTrackIndex = playlist.length > 0 ? 0 : -1;
  currentPlaylistName = name;
  updatePlaylistNameDisplay();

  savePlaylistState();
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
  if (savedPlaylistBox) savedPlaylistBox.title = `Loaded playlist: ${name}`;

  if (currentTrackIndex >= 0) {
    pendingRestoreTime = null;
    await loadTrack(0, false);
  } else {
    renderPlaylist();
    updatePlayPauseButton();
  }

  setPlayerStatus(`Loaded saved playlist: ${name}`);
  await updateBadgeCounts();
  showToast(`Loaded "${name}".`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renameNamedPlaylist() {
  const oldName = selectedPlaylistKey;

  if (!oldName || !savedPlaylists[oldName]) {
    savedPlaylistStatus.textContent = "Select a playlist to rename.";
    showToast("Select a playlist to rename.");
    return;
  }

  if (savedPlaylists[oldName].isBuiltin) {
    showToast("Built-in playlists cannot be renamed.");
    return;
  }

  const newName = prompt("Rename playlist:", oldName);
  if (newName === null) return;

  const cleanName = newName.trim();
  if (!cleanName) {
    savedPlaylistStatus.textContent = "Playlist name cannot be empty.";
    showToast("Playlist name cannot be empty.");
    return;
  }

  if (cleanName !== oldName && savedPlaylists[cleanName]) {
    savedPlaylistStatus.textContent = "That playlist name already exists.";
    showToast("That playlist name already exists.");
    return;
  }

  savedPlaylists[cleanName] = {
    ...savedPlaylists[oldName],
    name: cleanName,
  };

  if (cleanName !== oldName) {
    delete savedPlaylists[oldName];
  }

  persistSavedPlaylists();
  selectedPlaylistKey = cleanName;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, cleanName);

  // Sync the action button state
  if (typeof updatePlaylistActionUI === "function") {
    updatePlaylistActionUI();
  }

  if (currentPlaylistName === oldName) {
    currentPlaylistName = cleanName;
    updatePlaylistNameDisplay();
  }

  if (savedPlaylistBox) savedPlaylistBox.title = `Renamed playlist to: ${cleanName}`;
  updateBadgeCounts();
  setPlayerStatus(`Renamed playlist to "${cleanName}".`);
  showToast(`Renamed to "${cleanName}".`);
}

function deleteNamedPlaylist() {
  const name = selectedPlaylistKey;

  if (!name || !savedPlaylists[name]) {
    savedPlaylistStatus.textContent = "Select a playlist to delete.";
    showToast("Select a playlist to delete.");
    return;
  }

  if (savedPlaylists[name].isBuiltin) {
    showToast("Built-in playlists cannot be deleted.");
    return;
  }

  const confirmed = confirm(`Delete saved playlist "${name}"?`);
  if (!confirmed) return;

  delete savedPlaylists[name];
  persistSavedPlaylists();
  selectedPlaylistKey = "";
  savedPlaylistsSelect.value = "";
  localStorage.removeItem(STORAGE_KEYS.selectedSavedPlaylist);

  // Sync the action button state
  if (typeof updatePlaylistActionUI === "function") {
    updatePlaylistActionUI();
  }

  if (currentPlaylistName === name) {
    currentPlaylistName = "";
    updatePlaylistNameDisplay();
  }

  if (savedPlaylistBox) savedPlaylistBox.title = `Deleted playlist: ${name}`;
  updateBadgeCounts();
  setPlayerStatus(`Deleted playlist "${name}".`);
  showToast(`Deleted "${name}".`);
}

function setSleepTimer(minutes) {
  clearSleepTimer();
  sleepTimerMinutes = minutes || 0;

  if (!minutes || minutes <= 0) {
    if (sleepTimerStatus) sleepTimerStatus.textContent = "No sleep timer set.";
    localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
    if (sleepTimerBtn) {
      sleepTimerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sleep: Off`;
    }
    showToast("Sleep timer off.");
    return;
  }

  const endTime = Date.now() + minutes * 60 * 1000;
  localStorage.setItem(STORAGE_KEYS.sleepTimerEnd, String(endTime));
  
  if (sleepTimerBtn) {
    sleepTimerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sleep: ${minutes} min`;
  }

  sleepTimerTimeout = window.setTimeout(
    () => {
      audio.pause();
      updatePlayPauseButton();
      clearSleepTimer();
      sleepTimerStatus.textContent = "Sleep timer finished. Playback paused.";
      setPlayerStatus("Sleep timer finished.");
      showToast("Sleep timer finished.");
    },
    minutes * 60 * 1000,
  );

  sleepTimerInterval = window.setInterval(updateSleepTimerStatus, 1000);
  updateSleepTimerStatus();
  showToast(`Sleep timer set for ${minutes} min.`);
}

function clearSleepTimer() {
  if (sleepTimerTimeout) {
    clearTimeout(sleepTimerTimeout);
    sleepTimerTimeout = null;
  }

  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval);
    sleepTimerInterval = null;
  }

  localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
}

function updateSleepTimerStatus() {
  const savedEnd = Number(localStorage.getItem(STORAGE_KEYS.sleepTimerEnd));

  if (!Number.isFinite(savedEnd) || savedEnd <= Date.now()) {
    if (sleepTimerInterval) clearInterval(sleepTimerInterval);
    if (sleepTimerTimeout) clearTimeout(sleepTimerTimeout);
    sleepTimerInterval = null;
    sleepTimerTimeout = null;
    localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
    if (sleepRow) sleepRow.title = "No sleep timer set.";
    if (sleepTimerStatus) {
      sleepTimerStatus.textContent = "";
      sleepTimerStatus.classList.add("hidden");
    }
    sleepTimerMinutes = 0;
    if (sleepTimerBtn) {
      sleepTimerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sleep: Off`;
    }
    return;
  }

  const remainingMs = savedEnd - Date.now();
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const statusText = `Playback will pause in ${mins}:${secs.toString().padStart(2, "0")}.`;
  if (sleepRow) sleepRow.title = statusText;
  if (sleepTimerStatus) {
    sleepTimerStatus.textContent = statusText;
    sleepTimerStatus.classList.remove("hidden");
  }
}

function restoreSleepTimer() {
  const savedEnd = Number(localStorage.getItem(STORAGE_KEYS.sleepTimerEnd));
  if (!Number.isFinite(savedEnd) || savedEnd <= Date.now()) {
    localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
    if (sleepTimerStatus) sleepTimerStatus.textContent = "No sleep timer set.";
    return;
  }

  const remainingMs = savedEnd - Date.now();
  const approxMinutes = Math.max(1, Math.round(remainingMs / 60000));

  sleepTimerTimeout = window.setTimeout(() => {
    audio.pause();
    updatePlayPauseButton();
    clearSleepTimer();
    if (sleepTimerStatus) sleepTimerStatus.textContent = "Sleep timer finished. Playback paused.";
    setPlayerStatus("Sleep timer finished.");
    showToast("Sleep timer finished.");
  }, remainingMs);

  sleepTimerInterval = window.setInterval(updateSleepTimerStatus, 1000);
  sleepTimerMinutes = approxMinutes;
  if (sleepTimerBtn) {
    sleepTimerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sleep: ${approxMinutes} min`;
  }
  updateSleepTimerStatus();
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;

  const currentTrack = playlist[currentTrackIndex];

  if (!currentTrack) {
    navigator.mediaSession.metadata = null;
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentTrack.title,
    artist:
      currentTrack.sourceType === "file" ? "Stored Music" : "URL stream",
    album: currentPlaylistName || "JPi. Player",
    artwork: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  // Tell the system the state so the "Play/Pause" buttons on the car stay in sync
  navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
}

function setupMediaSessionActions() {
  if (!("mediaSession" in navigator)) return;

  try {
    navigator.mediaSession.setActionHandler("play", () => playCurrent());
  } catch {}
  try {
    navigator.mediaSession.setActionHandler("pause", () => pauseCurrent());
  } catch {}
  try {
    navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
  } catch {}
  try {
    navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
  } catch {}
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.classList.remove("hidden");
}

async function handleInstallClick() {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  try {
    await deferredInstallPrompt.userChoice;
  } catch (error) {
    console.error("Install prompt error:", error);
  }

  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
}

function jumpToCurrentTrack() {
  if (currentTrackIndex < 0) {
    showToast("No current track.");
    return;
  }

  const activeItem = playlistEl.querySelector(".playlist-item.active");
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Jumped to current track.");
  }
}

