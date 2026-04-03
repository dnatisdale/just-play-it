
async function loadSavedPlaylists() {
  try {
    // 1. Load user playlists from storage
    savedPlaylists = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.savedPlaylists) || "{}",
    );
    if (!savedPlaylists || typeof savedPlaylists !== "object") {
      savedPlaylists = {};
    }

    // 2. Load builtin playlists from fetch
    try {
      const resp = await fetch("./builtin-playlists.json");
      if (resp.ok) {
        const builtins = await resp.json();
        // Merge builtins into savedPlaylists, tagging them as builtin
        Object.keys(builtins).forEach(name => {
          savedPlaylists[name] = {
            ...builtins[name],
            isBuiltin: true
          };
        });
      }
    } catch (e) {
      console.warn("Could not load builtin-playlists.json", e);
    }
  } catch {
    savedPlaylists = {};
  }

  refreshSavedPlaylistsSelect();

  const selected =
    localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist) || "";
  if (selected && savedPlaylists[selected]) {
    savedPlaylistsSelect.value = selected;
    savedPlaylistStatus.textContent = `Selected${savedPlaylists[selected].isBuiltin ? " builtin" : " saved"} playlist: ${selected}`;
  }
  if (typeof updatePlaylistActionUI === "function") {
    updatePlaylistActionUI();
  }
}

function persistSavedPlaylists() {
  localStorage.setItem(
    STORAGE_KEYS.savedPlaylists,
    JSON.stringify(savedPlaylists),
  );
  refreshSavedPlaylistsSelect();
}

function refreshSavedPlaylistsSelect() {
  const previousValue = savedPlaylistsSelect.value;
  savedPlaylistsSelect.innerHTML = `<option value="" disabled selected hidden>— Select a playlist from list —</option>`;

  Object.keys(savedPlaylists)
    .sort((a, b) => {
      // Put builtins at the top
      const aBuiltin = savedPlaylists[a].isBuiltin;
      const bBuiltin = savedPlaylists[b].isBuiltin;
      if (aBuiltin && !bBuiltin) return -1;
      if (!aBuiltin && bBuiltin) return 1;
      return a.localeCompare(b);
    })
    .forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      savedPlaylistsSelect.appendChild(option);
    });

  if (previousValue && savedPlaylists[previousValue]) {
    savedPlaylistsSelect.value = previousValue;
  }
  
  if (savedPlaylistsSelect) {
    savedPlaylistsSelect.classList.toggle("has-selection", !!savedPlaylistsSelect.value);
  }
}

function loadPlaylistFromStorage() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.playlist) || "[]",
    );
    if (!Array.isArray(saved)) {
      playlist = [];
      return;
    }

    playlist = saved.map((track) => normalizeTrack(track)).filter(Boolean);

    currentPlaylistName =
      localStorage.getItem(STORAGE_KEYS.currentPlaylistName) || "";
    updatePlaylistNameDisplay();

    const savedIndex = Number(
      localStorage.getItem(STORAGE_KEYS.currentTrackIndex),
    );
    const savedTime = Number(localStorage.getItem(STORAGE_KEYS.currentTime));

    if (
      Number.isInteger(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < playlist.length
    ) {
      currentTrackIndex = savedIndex;
      pendingRestoreTime =
        Number.isFinite(savedTime) && savedTime > 0 ? savedTime : null;
    } else {
      currentTrackIndex = playlist.length > 0 ? 0 : -1;
      pendingRestoreTime = null;
    }
  } catch (error) {
    console.error("Could not load playlist:", error);
    playlist = [];
    currentTrackIndex = -1;
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  const entries = playlist.map((track, index) => ({ track, index }));

  if (playlist.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Your playlist is empty.";
    playlistEl.appendChild(empty);
    updateNowPlaying(null);
    return;
  }

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No tracks match your search.";
    playlistEl.appendChild(empty);
    return;
  }

  entries.forEach(({ track, index }) => {
    const li = document.createElement("li");
    li.className = "playlist-item";
    li.draggable = true;
    li.dataset.index = String(index);

    if (index === currentTrackIndex) {
      li.classList.add("active");
    }
    if (track.disabled) {
      li.classList.add("disabled");
    }

    li.addEventListener("dragstart", () => {
      draggedTrackIndex = index;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      draggedTrackIndex = null;
      li.classList.remove("dragging");
      playlistEl.querySelectorAll(".playlist-item").forEach((item) => {
        item.classList.remove("drag-over");
      });
    });

    li.addEventListener("dragover", (event) => {
      event.preventDefault();
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (event) => {
      event.preventDefault();
      li.classList.remove("drag-over");
      const targetIndex = Number(li.dataset.index);
      if (!Number.isInteger(targetIndex) || draggedTrackIndex === null) return;
      if (draggedTrackIndex === targetIndex) return;
      reorderTrack(draggedTrackIndex, targetIndex);
    });

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "track-info-btn";
    infoBtn.style.flex = "1";
    infoBtn.style.minWidth = "0"; // Essential for ellipsis to work
    const label = getTrackSourceLabel(track);
    const duration = track.duration ? formatTime(track.duration) : "";

    infoBtn.innerHTML = `
      <div class="track-info-row">
        <span class="track-name" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</span>
        <span class="track-duration">${duration}</span>
      </div>
      ${label ? `<span class="track-source">${label}</span>` : ""}
    `;
    infoBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await loadTrack(index, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "small-btn drag-handle";
    dragHandle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>`;
    dragHandle.title = "Drag to reorder";
    // We don't need a click listener as the parent li is draggable=true

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small-btn remove";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove from playlist";
    removeBtn.addEventListener("click", (e) => { e.stopPropagation(); removeTrack(index); });

    if (isEditMode) {
      actions.appendChild(dragHandle);
      actions.appendChild(removeBtn);
    }

    const statusBtn = document.createElement("button");
    statusBtn.type = "button";
    statusBtn.className = `track-status-btn${track.disabled ? " disabled" : ""}`;
    statusBtn.title = track.disabled ? "Click to enable song (Green Light)" : "Click to skip song (Red Light)";
    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTrackEnabled(index);
    });

    li.appendChild(statusBtn);
    li.appendChild(infoBtn);
    li.appendChild(actions);

    li.addEventListener("click", () => {
      loadTrack(index, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    playlistEl.appendChild(li);
  });
}

function updateCurrentTrackIndexAfterMove(fromIndex, toIndex) {
  if (currentTrackIndex === fromIndex) {
    currentTrackIndex = toIndex;
    return;
  }

  if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
    currentTrackIndex -= 1;
    return;
  }

  if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
    currentTrackIndex += 1;
  }
}

function reorderTrack(fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= playlist.length ||
    toIndex >= playlist.length
  ) {
    return;
  }

  const [movedTrack] = playlist.splice(fromIndex, 1);
  playlist.splice(toIndex, 0, movedTrack);

  updateCurrentTrackIndexAfterMove(fromIndex, toIndex);
  // currentPlaylistName = "";  // Keep name on reorder as requested
  updatePlaylistNameDisplay();
  renderPlaylist();
  savePlaylistState();

  if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
    updateNowPlaying(playlist[currentTrackIndex]);
  }

  setPlayerStatus(`Moved "${movedTrack.title}".`);
  showToast(`Moved "${movedTrack.title}".`);
}

function moveTrack(index, direction) {
  // Function logic removed as manual arrow sorting is retired for drag & drop
}

async function resolveTrackSource(track) {
  revokeCurrentObjectUrl();

  if (track.sourceType === "url") {
    return track.src;
  }

  if (track.sourceType === "file") {
    const stored = await getTrackBlob(track.id);
    if (!stored || !stored.blob) {
      return null;
    }

    currentObjectUrl = URL.createObjectURL(stored.blob);
    return currentObjectUrl;
  }

  return null;
}

async function loadTrack(index, shouldPlay = false) {
  if (index < 0 || index >= playlist.length) return;

  // Signal to the auto-resume handler that we are intentionally changing tracks
  isTransitioning = true;
  audio.pause();
  revokeCurrentObjectUrl();

  currentTrackIndex = index;
  const track = playlist[index];
  const source = await resolveTrackSource(track);

  if (!source) {
    isTransitioning = false;
    updateNowPlaying(track);
    renderPlaylist();
    savePlaylistState();
    updatePlayPauseButton();
    setPlayerStatus(`Missing stored file: ${track.title}`);
    showToast(`Missing stored file: ${track.title}`);
    return;
  }

  audio.src = source;
  // Explicitly tell the browser to start fetching the new source.
  // Without this, some mobile browsers (especially iOS Safari) may not begin
  // loading when audio.src is set on a paused element.
  audio.load();

  updateNowPlaying(track);
  renderPlaylist();
  savePlaylistState();

  if (shouldPlay) {
    try {
      // Wait until the new source is ready enough to start playing.
      // IMPORTANT: we add a timeout here so this Promise cannot hang forever.
      // On mobile (iOS especially), after an audio session interruption or
      // phone-lock, 'canplay' may never fire even though the data exists.
      // After 12s we resolve optimistically and let audio.play() decide.
      await new Promise((resolve, reject) => {
        let timeoutId;

        const onCanPlay = () => {
          clearTimeout(timeoutId);
          cleanup();
          resolve();
        };

        const onError = () => {
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error("Audio source failed while loading."));
        };

        const cleanup = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        audio.addEventListener("canplay", onCanPlay, { once: true });
        audio.addEventListener("error", onError, { once: true });

        // If already ready enough, resolve immediately
        if (audio.readyState >= 3) {
          cleanup();
          resolve();
          return;
        }

        // Safety valve: if canplay never fires (iOS suspension, network stall,
        // background tab throttling), don't hang forever. Resolve after 12s
        // and let audio.play() make the final call.
        timeoutId = setTimeout(() => {
          cleanup();
          console.warn("loadTrack: canplay timed out — attempting play anyway.");
          resolve();
        }, 12000);
      });

      await audio.play();
      isTransitioning = false;
      updatePlayPauseButton();
      setPlayerStatus(`Playing: ${track.title}`);
    } catch (error) {
      isTransitioning = false;
      console.warn("loadTrack: audio.play() failed:", error.name, error.message);
      updatePlayPauseButton();
      // Show a recoverable message — the source IS set, pressing play will retry
      setPlayerStatus("Tap \u25B6 to resume.");
      if (!document.hidden) {
        showToast("Tap \u25B6 to resume playback.");
      }
    }
  } else {
    isTransitioning = false;
    updatePlayPauseButton();
  }
}


async function addFileTracks(files) {
  const fileArray = Array.from(files);
  const newTracks = [];
  const skipped = [];

  // Build a set of existing titles to prevent duplicates
  const existingTitles = new Set(playlist.map((t) => t.title));

  for (const file of fileArray) {
    if (existingTitles.has(file.name)) {
      skipped.push(file.name);
      continue; // Skip already-added file
    }

    const id = crypto.randomUUID();
    const duration = await getAudioDuration(file);
    await saveTrackBlob(id, file, duration);

    newTracks.push({
      id,
      title: file.name,
      sourceType: "file",
      duration: duration
    });

    existingTitles.add(file.name); // Prevent duplicates within the same batch
  }

  if (skipped.length > 0) {
    showToast(`Skipped ${skipped.length} duplicate${skipped.length === 1 ? "" : "s"}.`);
  }

  if (newTracks.length === 0) return;

  playlist.push(...newTracks);
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  const wasEmpty = (playlist.length === newTracks.length);
  if (wasEmpty || currentTrackIndex === -1) {
    await loadTrack(0, true);
  } else {
    renderPlaylist();
    savePlaylistState();
    // After adding tracks to an existing playlist, we should still update badge counts
    updateBadgeCounts();
  }

  await updateStorageUsage();
  await renderSidebarLibrary();
  await updateBadgeCounts();

  setPlayerStatus(
    `${newTracks.length} file${newTracks.length === 1 ? "" : "s"} added and stored.`,
  );
  showToast(
    `Loaded ${newTracks.length} file${newTracks.length === 1 ? "" : "s"}.`,
  );
}

function addUrlTrack(url) {
  const trimmed = url.trim();
  if (!trimmed) return;

  try {
    const parsedUrl = new URL(trimmed);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check for YouTube links
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      showToast("YouTube URLs are not direct audio files and are not supported.", 4000);
      return;
    }

    // Block common image and video formats from being added
    const blockExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'];
    if (blockExtensions.some(ext => lowerPath.endsWith(ext))) {
      showToast("Images and videos cannot be added to the player.", 4000);
      return;
    }

    // Check against known audio extensions or stream-like paths
    const validExtensions = ['.mp3', '.m4a', '.aac', '.ogg', '.oga', '.wav', '.flac', '.opus', '.weba', '.webm', '.caf', '.m3u8'];
    
    let seemsLikeAudio = false;
    if (lowerPath.endsWith("/stream") || lowerPath.includes("/stream/") || lowerPath.endsWith("/listen")) {
      seemsLikeAudio = true;
    } else {
      for (const ext of validExtensions) {
        if (lowerPath.endsWith(ext)) {
          seemsLikeAudio = true;
          break;
        }
      }
    }

    if (!seemsLikeAudio) {
      const allowedText = validExtensions.join(", ");
      const isSure = confirm(`Allowable audio extensions are: ${allowedText}.\n\nIt might be a webpage instead of an audio file. Are you sure this is a direct audio stream? Add anyway?`);
      if (!isSure) {
        return;
      }
    }

  } catch {
    showToast("That does not look like a valid URL.");
    return;
  }

  const track = {
    id: crypto.randomUUID(),
    title: getFileNameFromUrl(trimmed),
    sourceType: "url",
    src: trimmed,
  };

  playlist.push(track);
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  if (currentTrackIndex === -1) {
    currentTrackIndex = 0;
    loadTrack(0, true);
  } else {
    renderPlaylist();
    savePlaylistState();
  }

  updateBadgeCounts();
  urlInput.value = "";
  setPlayerStatus(`Added URL track: ${track.title}`);
  showToast(`Added URL track: ${track.title}`);
}

function removeTrack(index) {
  if (index < 0 || index >= playlist.length) return;

  const removedTrack = playlist[index];
  const wasCurrent = index === currentTrackIndex;
  playlist.splice(index, 1);
  // currentPlaylistName = ""; // Keep name on track removal as requested
  updatePlaylistNameDisplay();

  if (playlist.length === 0) {
    audio.pause();
    revokeCurrentObjectUrl();
    audio.removeAttribute("src");
    audio.load();
    currentTrackIndex = -1;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    seekBar.value = 0;
    localStorage.removeItem(STORAGE_KEYS.currentTime);
    savePlaylistState();
    renderPlaylist();
    updatePlayPauseButton();
    setPlayerStatus(`Removed: ${removedTrack.title}`);
    showToast(`Removed: ${removedTrack.title}`);
    return;
  }

  if (index < currentTrackIndex) {
    currentTrackIndex -= 1;
  } else if (wasCurrent) {
    if (currentTrackIndex >= playlist.length) {
      currentTrackIndex = playlist.length - 1;
    }
    loadTrack(currentTrackIndex, false);
  }

  renderPlaylist();
  savePlaylistState();
  updateBadgeCounts();
  setPlayerStatus(`Removed: ${removedTrack.title}`);
  showToast(`Removed: ${removedTrack.title}`);
}

function clearPlaylist() {
  audio.pause();
  revokeCurrentObjectUrl();
  audio.removeAttribute("src");
  audio.load();

  playlist = [];
  currentTrackIndex = -1;
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  seekBar.value = 0;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  localStorage.removeItem(STORAGE_KEYS.playlist);
  localStorage.removeItem(STORAGE_KEYS.currentTrackIndex);
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  renderPlaylist();
  updatePlayPauseButton();
  updateBadgeCounts();
  setPlayerStatus("Playlist cleared.");
  showToast("Playlist cleared.");
}

async function clearDeviceLibrary() {
  const confirmed = confirm(
    "Clear all stored device files from this device?\n\nAny playlist entries that depend on those files will stop working.",
  );
  if (!confirmed) return;

  try {
    await clearAllTrackBlobs();
    revokeCurrentObjectUrl();

    playlist = playlist.filter((track) => track.sourceType !== "file");
    currentTrackIndex =
      playlist.length > 0
        ? Math.min(currentTrackIndex, playlist.length - 1)
        : -1;
    currentPlaylistName = "";
    updatePlaylistNameDisplay();

    Object.keys(savedPlaylists).forEach((name) => {
      const filteredTracks = (savedPlaylists[name].tracks || []).filter(
        (track) => track.sourceType !== "file",
      );

      if (filteredTracks.length === 0) {
        delete savedPlaylists[name];
      } else {
        savedPlaylists[name].tracks = filteredTracks;
      }
    });

    persistSavedPlaylists();
    savePlaylistState();
    await updateStorageUsage();
    await renderSidebarLibrary();

    if (currentTrackIndex >= 0) {
      await loadTrack(currentTrackIndex, false);
    } else {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      renderPlaylist();
      updatePlayPauseButton();
    }

    updateBadgeCounts();

    savedPlaylistStatus.textContent = "Stored device library cleared.";
    setPlayerStatus("Stored device library cleared.");
    showToast("Stored device library cleared.");
  } catch (error) {
    console.error("Could not clear device library:", error);
    savedPlaylistStatus.textContent = "Could not clear stored device library.";
    showToast("Could not clear stored device library.");
  }
}

function exportPlaylists() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "JUST PLAY IT.",
    version: 1,
    savedPlaylists,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const exportUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = exportUrl;
  link.download = "just-play-it-playlists.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(exportUrl);

  showToast("Playlists exported.");
}

async function importPlaylistsFromFile(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.savedPlaylists ||
      typeof parsed.savedPlaylists !== "object"
    ) {
      throw new Error("Invalid file format");
    }

    savedPlaylists = {
      ...savedPlaylists,
      ...parsed.savedPlaylists,
    };

    persistSavedPlaylists();
    savedPlaylistStatus.textContent = "Playlists imported.";
    showToast("Playlists imported.");
  } catch (error) {
    console.error("Import failed:", error);
    savedPlaylistStatus.textContent = "Could not import playlists.";
    showToast("Could not import playlists.");
  }
}
