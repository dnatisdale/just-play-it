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

let autoAdvanceInProgress = false;
let preloadedTrackId = null;
let preloadedTrackSource = null;
let preloadingTrackPromise = null;
let playbackStallRecoveryTimer = null;

const AUTO_ADVANCE_CANPLAY_TIMEOUT_MS = 15000;
const AUTO_ADVANCE_PLAY_TIMEOUT_MS = 5000;
const STALL_RECOVERY_DELAY_MS = 3000;

function clearPreloadedTrackSource() {
  if (preloadedTrackSource) {
    try {
      URL.revokeObjectURL(preloadedTrackSource);
    } catch (error) {
      console.warn("Could not revoke preloaded track source:", error);
    }
  }

  preloadedTrackId = null;
  preloadedTrackSource = null;
  preloadingTrackPromise = null;
}

function clearPlaybackStallRecoveryTimer() {
  if (playbackStallRecoveryTimer) {
    clearTimeout(playbackStallRecoveryTimer);
    playbackStallRecoveryTimer = null;
  }
}

function getSequentialNextEnabledIndex(fromIndex, wrap = true) {
  if (!Array.isArray(playlist) || playlist.length === 0) return -1;

  const enabledCount = playlist.filter(track => !track.disabled).length;
  if (enabledCount === 0) return -1;

  if (enabledCount === 1 && playlist[fromIndex] && !playlist[fromIndex].disabled) {
    return fromIndex;
  }

  let candidate = fromIndex;
  for (let step = 0; step < playlist.length; step++) {
    candidate += 1;

    if (candidate >= playlist.length) {
      if (!wrap) return -1;
      candidate = 0;
    }

    if (!playlist[candidate].disabled) {
      return candidate;
    }
  }

  return -1;
}

function getSequentialPrevEnabledIndex(fromIndex, wrap = true) {
  if (!Array.isArray(playlist) || playlist.length === 0) return -1;

  const enabledCount = playlist.filter(track => !track.disabled).length;
  if (enabledCount === 0) return -1;

  if (enabledCount === 1 && playlist[fromIndex] && !playlist[fromIndex].disabled) {
    return fromIndex;
  }

  let candidate = fromIndex;
  for (let step = 0; step < playlist.length; step++) {
    candidate -= 1;

    if (candidate < 0) {
      if (!wrap) return -1;
      candidate = playlist.length - 1;
    }

    if (!playlist[candidate].disabled) {
      return candidate;
    }
  }

  return -1;
}

function getAutoAdvanceCandidateIndices() {
  const enabledIndices = playlist
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => !track.disabled)
    .map(({ index }) => index);

  if (enabledIndices.length === 0) return [];

  if (shuffleEnabled) {
    const shuffled = enabledIndices.filter(index => index !== currentTrackIndex);

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (shuffled.length === 0 && enabledIndices.includes(currentTrackIndex)) {
      shuffled.push(currentTrackIndex);
    }

    return shuffled;
  }

  const wrap = repeatMode === "all";
  const ordered = [];
  let candidate = currentTrackIndex;

  for (let step = 0; step < playlist.length; step++) {
    candidate = getSequentialNextEnabledIndex(candidate, wrap);
    if (candidate === -1) break;
    if (ordered.includes(candidate)) break;
    ordered.push(candidate);
    if (!wrap && candidate === playlist.length - 1) break;
  }

  return ordered;
}

function getUpcomingTrackIndexForPreload() {
  if (!Array.isArray(playlist) || playlist.length === 0) return -1;
  if (shuffleEnabled) return -1;

  const wrap = repeatMode === "all";
  const nextIndex = getSequentialNextEnabledIndex(currentTrackIndex, wrap);
  if (nextIndex === currentTrackIndex && playlist.length > 1) return -1;
  return nextIndex;
}

async function preloadTrackSourceByIndex(index) {
  if (index < 0 || index >= playlist.length) {
    clearPreloadedTrackSource();
    return;
  }

  const track = playlist[index];
  if (!track || track.sourceType !== "file") {
    clearPreloadedTrackSource();
    return;
  }

  if (preloadedTrackId === track.id && (preloadedTrackSource || preloadingTrackPromise)) {
    return preloadingTrackPromise;
  }

  clearPreloadedTrackSource();
  preloadedTrackId = track.id;

  preloadingTrackPromise = (async () => {
    const stored = await getTrackBlob(track.id);
    if (!stored || !stored.blob) {
      clearPreloadedTrackSource();
      return;
    }

    preloadedTrackSource = URL.createObjectURL(stored.blob);
  })().catch((error) => {
    console.warn(`Preload failed for "${track.title}":`, error);
    clearPreloadedTrackSource();
  });

  return preloadingTrackPromise;
}

function schedulePreloadUpcomingTrack() {
  if (!Array.isArray(playlist) || playlist.length === 0) {
    clearPreloadedTrackSource();
    return;
  }

  const nextIndex = getUpcomingTrackIndexForPreload();
  if (nextIndex === -1 || nextIndex === currentTrackIndex) {
    clearPreloadedTrackSource();
    return;
  }

  setTimeout(() => {
    preloadTrackSourceByIndex(nextIndex).catch((error) => {
      console.warn("Could not preload upcoming track:", error);
    });
  }, 0);
}

async function recoverFromPlaybackStall(reason = "stall") {
  clearPlaybackStallRecoveryTimer();
  
  if (typeof addErrorLog === "function") {
      addErrorLog(`[Recovery] running stall recovery. reason: ${reason}, hidden: ${document.hidden}`, "Recovery");
  }

  if (
    userPaused ||
    !audio.src ||
    audio.ended ||
    currentTrackIndex < 0 ||
    !playlist[currentTrackIndex]
  ) {
    if (typeof addErrorLog === "function") addErrorLog(`[Recovery] aborted because invalid state or userPaused`, "Recovery");
    return false;
  }

  const restoreTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  setPlayerStatus("Playback stalled. Recovering...");

  const recovered = await loadTrack(currentTrackIndex, true, {
    reason: `${reason}-recover-current`,
    preserveTime: restoreTime,
    canplayTimeoutMs: AUTO_ADVANCE_CANPLAY_TIMEOUT_MS,
    playTimeoutMs: AUTO_ADVANCE_PLAY_TIMEOUT_MS,
    suppressManualResumeToast: true,
  });

  if (recovered) {
    if (typeof addErrorLog === "function") addErrorLog(`[Recovery] successfully recovered current track`, "Recovery");
    return true;
  }

  const canAdvance = shuffleEnabled || repeatMode === "all" || currentTrackIndex < playlist.length - 1;
  if (canAdvance) {
    if (typeof addErrorLog === "function") addErrorLog(`[Recovery] failed to recover current track. Skipping ahead.`, "Recovery");
    setPlayerStatus("Current track stalled. Skipping ahead...");
    return playNext({ reason: `${reason}-skip` });
  }

  userPaused = true;
  updatePlayPauseButton();
  setPlayerStatus("Playback stalled. Tap ▶ to continue.");
  showToast("Playback stalled. Tap ▶ to continue.");
  return false;
}

function armPlaybackStallRecovery(reason = "stall") {
  if (typeof addErrorLog === "function") {
      addErrorLog(`[Recovery] requested to arm. reason: ${reason}, hidden: ${document.hidden}`, "Recovery");
  }
  
  if (
    playbackStallRecoveryTimer ||
    userPaused ||
    audio.paused ||
    audio.ended ||
    isTransitioning ||
    !audio.src
  ) {
    if (typeof addErrorLog === "function") addErrorLog(`[Recovery] ignored arm request. State prevents recovery.`, "Recovery");
    return;
  }

  if (typeof addErrorLog === "function") addErrorLog(`[Recovery] armed for ${STALL_RECOVERY_DELAY_MS}ms`, "Recovery");

  playbackStallRecoveryTimer = setTimeout(() => {
    playbackStallRecoveryTimer = null;
    recoverFromPlaybackStall(reason).catch((error) => {
      console.error("Playback stall recovery failed:", error);
      if (typeof addErrorLog === "function") addErrorLog(`[Recovery] failed entirely: ${error.message}`, "Recovery");
      setPlayerStatus("Playback stalled. Tap ▶ to continue.");
    });
  }, STALL_RECOVERY_DELAY_MS);
}

async function playCurrent() {
  if (playlist.length === 0) return;
  userPaused = false;
  resumeRetries = 0;

  if (currentTrackIndex === -1) {
    await loadTrack(0, true, { reason: "manual-play" });
    return;
  }

  if (!audio.src) {
    await loadTrack(currentTrackIndex, true, { reason: "manual-play" });
    return;
  }

  if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.1)) {
    audio.currentTime = 0;
  }

  try {
    await audio.play();
    updatePlayPauseButton();
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
    schedulePreloadUpcomingTrack();
  } catch (error) {
    console.warn("audio.play() failed in playCurrent, attempting full reload:", error.name, error.message);
    try {
      await loadTrack(currentTrackIndex, true, { reason: "manual-reload" });
    } catch (reloadError) {
      console.error("Playback reload also failed:", reloadError);
      setPlayerStatus("Playback could not start.");
      showToast("Playback could not start. Try tapping again.");
    }
  }
}

function pauseCurrent() {
  userPaused = true;
  clearPlaybackStallRecoveryTimer();
  audio.pause();
  updatePlayPauseButton();
  setPlayerStatus("Playback paused.");
}

function getRandomTrackIndex(excludeIndex) {
  const enabledIndices = playlist
    .map((t, i) => i)
    .filter((i) => !playlist[i].disabled && i !== excludeIndex);

  if (enabledIndices.length === 0) {
    if (playlist[excludeIndex] && !playlist[excludeIndex].disabled) {
      return excludeIndex;
    }
    const allEnabled = playlist.map((t, i) => i).filter(i => !playlist[i].disabled);
    if (allEnabled.length > 0) return allEnabled[Math.floor(Math.random() * allEnabled.length)];
    return excludeIndex;
  }

  return enabledIndices[Math.floor(Math.random() * enabledIndices.length)];
}

async function playNext(options = {}) {
  if (playlist.length === 0) return false;

  const enabledCount = playlist.filter(t => !t.disabled).length;
  if (enabledCount === 0) {
    showToast("All songs are 'Red Lighted'. Enable some to play.");
    return false;
  }

  const opts = (options && typeof options === "object") ? options : {};
  const reason = opts.reason || "manual-next";
  const isAutoAdvance = reason !== "manual-next";

  if (isAutoAdvance && autoAdvanceInProgress) {
    return false;
  }

  if (!isAutoAdvance) {
    let nextIndex;

    if (shuffleEnabled) {
      nextIndex = getRandomTrackIndex(currentTrackIndex);
    } else {
      nextIndex = getSequentialNextEnabledIndex(currentTrackIndex, true);
    }

    if (nextIndex === -1) return false;

    console.log(
      `[playNext] from: ${currentTrackIndex} → to: ${nextIndex} | ` +
      `repeatMode: ${repeatMode}, shuffle: ${shuffleEnabled}, reason: ${reason}`
    );
    if (typeof addErrorLog === "function") addErrorLog(`[playNext] manual advance to index ${nextIndex}`, "PlaybackFlow");

    userPaused = false;
    resumeRetries = 0;
    pendingRestoreTime = null;

    return loadTrack(nextIndex, true, { reason });
  }

  autoAdvanceInProgress = true;
  if (typeof addErrorLog === "function") addErrorLog(`[playNext:auto] starting auto-advance evaluation`, "AutoAdvance");

  try {
    const candidates = getAutoAdvanceCandidateIndices();
    if (candidates.length === 0) {
      userPaused = true;
      updatePlayPauseButton();
      setPlayerStatus("Reached the end of the playlist.");
      if (typeof addErrorLog === "function") addErrorLog(`[playNext:auto] no candidates found`, "AutoAdvance");
      return false;
    }

    for (const nextIndex of candidates) {
      console.log(
        `[playNext:auto] trying ${nextIndex} from ${currentTrackIndex} | ` +
        `repeatMode: ${repeatMode}, shuffle: ${shuffleEnabled}, reason: ${reason}`
      );
      if (typeof addErrorLog === "function") addErrorLog(`[playNext:auto] trying candidate index: ${nextIndex}`, "AutoAdvance");

      userPaused = false;
      resumeRetries = 0;
      pendingRestoreTime = null;

      const started = await loadTrack(nextIndex, true, {
        reason,
        canplayTimeoutMs: AUTO_ADVANCE_CANPLAY_TIMEOUT_MS,
        playTimeoutMs: AUTO_ADVANCE_PLAY_TIMEOUT_MS,
        suppressManualResumeToast: true,
      });

      if (started) {
        if (window.recoveryState) {
          window.recoveryState.incompleteAutoAdvance = false;
          // Record a successful hidden auto-advance so the wake-side detector
          // can identify Android's silent-pause pattern (track paused near zero
          // on wake with no pause event having fired while backgrounded).
          if (document.hidden) {
            window.recoveryState.hiddenAutoAdvance = {
              trackIndex: nextIndex,
              startedAt: Date.now(),
              playSucceeded: true,
            };
            if (typeof addErrorLog === "function") {
              addErrorLog(
                `[AutoAdvance] hidden auto-advance succeeded for track index ${nextIndex} at ${new Date().toISOString()}`,
                "AutoAdvance"
              );
            }
          } else {
            // Clear any stale record from a previous hidden advance
            window.recoveryState.hiddenAutoAdvance = null;
          }
        }
        return true;
      }

      console.warn(`[playNext:auto] handoff failed for index ${nextIndex}; trying the next enabled track.`);
      
      if (document.hidden && reason === "auto-advance") {
         if (typeof addErrorLog === "function") {
             addErrorLog(`[playNext:auto] candidate failed while document is hidden. Setting recovery flag to defer.`, "AutoAdvance");
         }
         if (window.recoveryState) {
             window.recoveryState.incompleteAutoAdvance = true;
         }
         return false; // Break loop early, wait for visibilitychange
      }
    }

    userPaused = true;
    updatePlayPauseButton();
    setPlayerStatus("Repeat All stalled after trying the queue. Tap ▶ to continue.");
    showToast("Repeat All stalled after trying the queue.");
    return false;
  } finally {
    autoAdvanceInProgress = false;
  }
}

async function playPrev() {
  if (playlist.length === 0) return false;

  const enabledCount = playlist.filter(t => !t.disabled).length;
  if (enabledCount === 0) {
    showToast("All songs are 'Red Lighted'. Enable some to play.");
    return false;
  }

  let prevIndex;

  if (shuffleEnabled) {
    prevIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    prevIndex = getSequentialPrevEnabledIndex(currentTrackIndex, true);
  }

  if (prevIndex === -1) return false;

  pendingRestoreTime = null;
  return loadTrack(prevIndex, true, { reason: "manual-prev" });
}

function toggleTrackEnabled(index) {
    if (index < 0 || index >= playlist.length) return;
    playlist[index].disabled = !playlist[index].disabled;

    renderPlaylist();
    savePlaylistState();
    schedulePreloadUpcomingTrack();

    const status = playlist[index].disabled ? "Red Light (Skipping)" : "Green Light (Enabled)";
    showToast(`"${playlist[index].title}" set to ${status}.`);
}

function toggleShuffle() {
  shuffleEnabled = !shuffleEnabled;
  saveModes();
  updateModeButtons();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  schedulePreloadUpcomingTrack();
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
  schedulePreloadUpcomingTrack();
  showToast(`Repeat ${repeatMode}.`);
}

function skipSeconds(seconds) {
  if (!audio.src) {
    showToast("No track loaded.");
    return;
  }
  if (!Number.isFinite(audio.duration)) {
    setPlayerStatus("Track still loading, try again in a moment.");
    return;
  }
  audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  showToast(`${seconds > 0 ? "+" : ""}${seconds}s`);
}

function saveNamedPlaylist() {
  const name = playlistNameInput.value.trim();
  console.log(`[Action] saveNamedPlaylist (create empty) for: "${name}"`);

  if (!name) {
    showToast("Enter a playlist name first.");
    return;
  }

  savedPlaylists[name] = {
    name,
    tracks: [],
    savedAt: new Date().toISOString(),
  };

  console.log(`[State] Created empty playlist "${name}".`);

  currentPlaylistName = name;
  selectedPlaylistKey = name;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);

  playlist = [];
  currentTrackIndex = -1;
  audio.pause();
  revokeCurrentObjectUrl();
  clearPreloadedTrackSource();
  audio.removeAttribute("src");
  audio.load();
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  updatePlaylistNameDisplay();
  persistSavedPlaylists();
  savePlaylistState();
  renderPlaylist();
  updateNowPlaying(null);
  updatePlayPauseButton();
  updateBadgeCounts();

  if (savedPlaylistBox) savedPlaylistBox.title = `Active playlist: ${name}`;
  playlistNameInput.value = "";

  setPlayerStatus(`Created "${name}". Add tracks via the Library or Pick Folder.`);
  showToast(`Created empty playlist "${name}".`);
  refreshUpdateRow();
}

function refreshUpdateRow() {
  if (!updatePlaylistRow) return;

  const name   = currentPlaylistName;
  const pl     = name ? savedPlaylists[name] : null;
  const isUser = pl && !pl.isBuiltin;

  if (isUser) {
    updatePlaylistRow.classList.remove("hidden");
    if (activePlaylistPillName)  activePlaylistPillName.textContent  = name;
    if (activePlaylistPillBadge) activePlaylistPillBadge.textContent = (playlist || []).length;
  } else {
    updatePlaylistRow.classList.add("hidden");
  }

  if (typeof refreshQueuePill === "function") refreshQueuePill();
}

function updateActivePlaylist() {
  const name = currentPlaylistName;

  if (!name) {
    showToast("No active playlist to update. Use CREATE first.");
    return;
  }

  if (!savedPlaylists[name]) {
    showToast(`Playlist "${name}" not found.`);
    return;
  }

  if (savedPlaylists[name].isBuiltin) {
    showToast("Built-in playlists are read-only.");
    return;
  }

  const normalizedTracks = (playlist || [])
    .map(t => normalizeTrack(t))
    .filter(Boolean);

  savedPlaylists[name].tracks   = normalizedTracks;
  savedPlaylists[name].savedAt  = new Date().toISOString();

  persistSavedPlaylists();
  updateBadgeCounts();
  refreshUpdateRow();

  console.log(`[updateActivePlaylist] Saved ${normalizedTracks.length} tracks into "${name}".`);
  setPlayerStatus(`Saved ${normalizedTracks.length} tracks to "${name}".`);
  showToast(`"${name}" updated with ${normalizedTracks.length} track${normalizedTracks.length !== 1 ? "s" : ""}.`);
}

async function loadNamedPlaylist() {
  const name = selectedPlaylistKey;
  console.log(`[Action] loadNamedPlaylist: "${name}"`);

  if (!name || !savedPlaylists[name]) {
    console.warn("[State] loadNamedPlaylist failed: invalid or missing key", name);
    showToast("Select a playlist first.");
    return;
  }

  const saved = savedPlaylists[name];

  playlist = (saved.tracks || [])
    .map((track) => normalizeTrack(track))
    .filter(Boolean);

  currentTrackIndex = playlist.length > 0 ? 0 : -1;
  currentPlaylistName = name;

  console.log(`[State] Hydrated workspace with ${playlist.length} tracks from "${name}"`);

  updatePlaylistNameDisplay();
  savePlaylistState();
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);

  if (savedPlaylistBox) savedPlaylistBox.title = `Loaded playlist: ${name}`;

  if (currentTrackIndex >= 0) {
    pendingRestoreTime = null;
    await loadTrack(0, false, { reason: "load-named-playlist" });
  } else {
    clearPreloadedTrackSource();
    renderPlaylist();
    updatePlayPauseButton();
    updateNowPlaying(null);
  }

  setPlayerStatus(`Loaded playlist: ${name}`);
  await updateBadgeCounts();
  showToast(`Loaded "${name}".`);
  refreshUpdateRow();
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
