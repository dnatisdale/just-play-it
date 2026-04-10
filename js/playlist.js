async function loadSavedPlaylists() {
  try {
    savedPlaylists = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.savedPlaylists) || "{}",
    );
    if (!savedPlaylists || typeof savedPlaylists !== "object") {
      savedPlaylists = {};
    }

    try {
      const resp = await fetch("./builtin-playlists.json");
      if (resp.ok) {
        const builtins = await resp.json();
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

  renderPlaylistsView();

  const selected = localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist) || "";
  if (selected && savedPlaylists[selected]) {
    selectedPlaylistKey = selected;
  }
}

function persistSavedPlaylists() {
  localStorage.setItem(
    STORAGE_KEYS.savedPlaylists,
    JSON.stringify(savedPlaylists),
  );
  renderPlaylistsView();
}

function renderPlaylistsView() {
  const container = document.getElementById("playlistsListContainer");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.keys(savedPlaylists).sort((a, b) => {
    const aBuiltin = savedPlaylists[a].isBuiltin;
    const bBuiltin = savedPlaylists[b].isBuiltin;
    if (aBuiltin && !bBuiltin) return -1;
    if (!aBuiltin && bBuiltin) return 1;
    return a.localeCompare(b);
  });

  if (entries.length === 0) {
    container.innerHTML = `<p class="library-empty-state">No saved playlists yet.<br>Give your current queue a name and tap CREATE.</p>`;
    return;
  }

  const currentDefault = localStorage.getItem(STORAGE_KEYS.defaultPlaylist) || "";

  entries.forEach((name) => {
    const pl = savedPlaylists[name];
    const isBuiltin      = !!pl.isBuiltin;
    const isCurrentDefault = (name === currentDefault && !!savedPlaylists[name]);
    const trackCount = Array.isArray(pl.tracks) ? pl.tracks.length : 0;

    let totalSeconds = 0;
    if (Array.isArray(pl.tracks)) {
      pl.tracks.forEach(t => {
        if (t.duration && Number.isFinite(t.duration)) totalSeconds += t.duration;
      });
    }

    const timeStr = totalSeconds > 0 ? formatTime(totalSeconds) : "";
    const metaStr = `${trackCount} track${trackCount !== 1 ? "s" : ""} ${timeStr ? "• " + timeStr : ""}`;

    const card = document.createElement("div");
    card.className = "library-item " + (isBuiltin ? "builtin-item" : "");
    card.style.cursor = "pointer";

    // ── Info area (click = load playlist) ────────────────────────────────
    const info = document.createElement("div");
    info.className = "library-item-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "library-item-name";
    nameSpan.style.cssText = "font-size: 1.05rem; font-weight: 600; display: block;";
    nameSpan.textContent = name;

    const metaLine = document.createElement("span");
    metaLine.className = "library-item-size";
    metaLine.style.cssText = "display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 1px;";
    metaLine.textContent = metaStr + (isBuiltin ? " • Built-In" : "");

    if (isCurrentDefault) {
      // DEFAULT label badge
      const badge = document.createElement("span");
      badge.style.cssText = "font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #ff9c2b; background: rgba(255,156,43,0.13); padding: 1px 5px; border-radius: 3px; flex-shrink: 0;";
      badge.textContent = "Default";
      metaLine.appendChild(badge);
    }

    info.appendChild(nameSpan);
    info.appendChild(metaLine);
    info.addEventListener("click", () => {
      selectedPlaylistKey = name;
      localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
      loadNamedPlaylist();
      showToast(`Loaded: ${name}`);
      document.querySelector('.nav-item[href="#view-player"]')?.click();
    });

    card.appendChild(info);

    // ── Default radio indicator ───────────────────────────────────────
    const radioBtn = document.createElement("button");
    radioBtn.type = "button";
    radioBtn.title = isCurrentDefault ? "Default playlist — tap to clear" : "Set as default playlist";
    radioBtn.setAttribute("aria-label", isCurrentDefault ? "Default playlist — tap to clear" : "Set as default playlist");
    radioBtn.style.cssText = "width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0;";
    // Filled orange circle = default; hollow grey ring = not default
    radioBtn.innerHTML = isCurrentDefault
      ? `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#ff9c2b"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" style="color: var(--border-strong);"><circle cx="12" cy="12" r="9"/></svg>`;
    radioBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isCurrentDefault) {
        // Already the default — clicking it again is a no-op (radio behavior)
        return;
      }
      localStorage.setItem(STORAGE_KEYS.defaultPlaylist, name);
      showToast(`Default set: "${name}".`);
      renderPlaylistsView();
    });
    card.appendChild(radioBtn);

    // ── Delete button (user playlists only) ────────────────────────────
    if (!isBuiltin) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "library-delete-btn";
      deleteBtn.innerHTML = ICONS.trash;
      deleteBtn.setAttribute("aria-label", `Delete playlist ${escapeHtml(name)}`);

      let confirmTimeout = null;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (deleteBtn.classList.contains("confirming")) {
          clearTimeout(confirmTimeout);
          // If deleting the current default, clear default state too
          if (isCurrentDefault) {
            localStorage.removeItem(STORAGE_KEYS.defaultPlaylist);
          }
          selectedPlaylistKey = name;
          deleteNamedPlaylist();
        } else {
          deleteBtn.classList.add("confirming");
          deleteBtn.textContent = "Sure?";
          confirmTimeout = setTimeout(() => {
            if (deleteBtn.classList.contains("confirming")) {
              deleteBtn.classList.remove("confirming");
              deleteBtn.innerHTML = ICONS.trash;
            }
          }, 3000);
        }
      });
      card.appendChild(deleteBtn);
    }

    container.appendChild(card);
  });
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
    empty.innerHTML = `No tracks in the queue yet.<br><span style="font-size:0.8rem;">Select tracks from the Library to add them.</span>`;
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
    infoBtn.style.minWidth = "0";
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
      await loadTrack(index, true, { reason: "track-click" });
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
      loadTrack(index, true, { reason: "track-row-click" });
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
  updatePlaylistNameDisplay();
  renderPlaylist();
  savePlaylistState();
  schedulePreloadUpcomingTrack();

  if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
    updateNowPlaying(playlist[currentTrackIndex]);
  }

  setPlayerStatus(`Moved "${movedTrack.title}".`);
  showToast(`Moved "${movedTrack.title}".`);
}

function moveTrack(index, direction) {
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

function playAudioWithTimeout(timeoutMs = 8000) {
  const maybePromise = audio.play();
  if (!maybePromise || typeof maybePromise.then !== "function") {
    return Promise.resolve();
  }

  return Promise.race([
    maybePromise,
    new Promise((_, reject) => {
      const err = new Error("audio.play() timed out");
      err.name = "TimeoutError";
      setTimeout(() => reject(err), timeoutMs);
    }),
  ]);
}

async function claimPreloadedSourceForTrack(track) {
  if (track.sourceType !== "file" || preloadedTrackId !== track.id) {
    return null;
  }

  if (!preloadedTrackSource && preloadingTrackPromise) {
    try {
      await preloadingTrackPromise;
    } catch (error) {
      console.warn("Waiting for preloaded source failed:", error);
    }
  }

  if (!preloadedTrackSource) {
    return null;
  }

  currentObjectUrl = preloadedTrackSource;
  const source = preloadedTrackSource;
  preloadedTrackId = null;
  preloadedTrackSource = null;
  preloadingTrackPromise = null;
  return source;
}

async function loadTrack(index, shouldPlay = false, options = {}) {
  if (index < 0 || index >= playlist.length) return false;

  const opts = (options && typeof options === "object") ? options : {};
  const preserveTime = Number.isFinite(opts.preserveTime) && opts.preserveTime > 0
    ? opts.preserveTime
    : null;
  const canplayTimeoutMs = Number.isFinite(opts.canplayTimeoutMs)
    ? opts.canplayTimeoutMs
    : 12000;
  const playTimeoutMs = Number.isFinite(opts.playTimeoutMs)
    ? opts.playTimeoutMs
    : 8000;
  const suppressManualResumeToast = !!opts.suppressManualResumeToast;

  isTransitioning = true;
  clearPlaybackStallRecoveryTimer();
  audio.pause();
  revokeCurrentObjectUrl();

  currentTrackIndex = index;
  const track = playlist[index];
  
  if (typeof addErrorLog === "function") {
    addErrorLog(`[loadTrack] started for track "${track.title}" (index ${index})`, "PlaybackFlow");
  }

  pendingRestoreTime = preserveTime;

  if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] resolving source...`, "PlaybackFlow");
  let source = await claimPreloadedSourceForTrack(track);
  if (!source) {
    source = await resolveTrackSource(track);
  }

  if (!source) {
    if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] source resolution failed`, "PlaybackFlow");
    isTransitioning = false;
    updateNowPlaying(track);
    renderPlaylist();
    savePlaylistState();
    updatePlayPauseButton();
    schedulePreloadUpcomingTrack();
    setPlayerStatus(`Missing stored file: ${track.title}`);
    showToast(`Missing stored file: ${track.title}`);
    return false;
  }
  
  if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] source resolved. Assigning audio.src`, "PlaybackFlow");

  audio.src = source;
  audio.load();

  updateNowPlaying(track);
  renderPlaylist();
  savePlaylistState();

  if (shouldPlay) {
    try {
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

        if (audio.readyState >= 3) {
          cleanup();
          resolve();
          return;
        }

        timeoutId = setTimeout(() => {
          cleanup();
          if (typeof addErrorLog === "function") {
            addErrorLog(`[loadTrack] canplay timed out (waited ${canplayTimeoutMs}ms). Attempting play anyway.`, "AutoAdvance");
          }
          console.warn("loadTrack: canplay timed out — attempting play anyway.");
          resolve();
        }, canplayTimeoutMs);
      });

      if (
        preserveTime !== null &&
        Number.isFinite(audio.duration) &&
        audio.duration > 1 &&
        preserveTime < audio.duration - 0.25
      ) {
        audio.currentTime = preserveTime;
      }

      console.log(`[loadTrack] audio.play() attempt for: "${track.title}"`);
      if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] attempting audio.play()`, "PlaybackFlow");
      await playAudioWithTimeout(playTimeoutMs);
      if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] audio.play() succeeded`, "PlaybackFlow");
      isTransitioning = false;
      updatePlayPauseButton();
      schedulePreloadUpcomingTrack();
      setPlayerStatus(`Playing: ${track.title}`);
      return true;
    } catch (error) {
      console.warn(`[loadTrack] audio.play() failed (${error.name}): ${error.message}`);
      if (typeof addErrorLog === "function") {
        addErrorLog(`[loadTrack] audio.play() failed (${error.name}): ${error.message}`, "PlaybackFlow");
      }

      if (
        error.name === "NotAllowedError" ||
        error.name === "AbortError" ||
        error.name === "TimeoutError"
      ) {
        const isAutoAdvanceRetry = opts.suppressManualResumeToast || (opts.reason && opts.reason.includes("auto-advance"));
        const maxRetries = isAutoAdvanceRetry ? 3 : 1;
        let retryDelay = 600;

        for (let i = 1; i <= maxRetries; i++) {
          console.log(`[loadTrack] ${error.name} — retrying play() in ${retryDelay}ms... (Attempt ${i}/${maxRetries})`);
          if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] retrying play in ${retryDelay}ms due to ${error.name} (Attempt ${i}/${maxRetries})`, "PlaybackFlow");
          await new Promise(resolve => setTimeout(resolve, retryDelay));

          try {
            await playAudioWithTimeout(playTimeoutMs);
            isTransitioning = false;
            updatePlayPauseButton();
            schedulePreloadUpcomingTrack();
            setPlayerStatus(`Playing: ${track.title}`);
            console.log(`[loadTrack] Retry ${i} succeeded for: "${track.title}"`);
            if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] retry play succeeded on attempt ${i}`, "PlaybackFlow");
            return true;
          } catch (retryError) {
            console.warn(`[loadTrack] Retry ${i} failed (${retryError.name}):`, retryError.message);
            if (typeof addErrorLog === "function") addErrorLog(`[loadTrack] retry play failed on attempt ${i} (${retryError.name})`, "PlaybackFlow");
            
            if (i < maxRetries) {
              retryDelay = Math.min(retryDelay * 2, 2000);
            } else {
              isTransitioning = false;
              updatePlayPauseButton();
              schedulePreloadUpcomingTrack();
              setPlayerStatus(`Could not start: ${track.title}`);
              if (!suppressManualResumeToast && !document.hidden) {
                showToast("Tap ▶ to resume playback.");
              }
              return false;
            }
          }
        }
      }

      isTransitioning = false;
      updatePlayPauseButton();
      schedulePreloadUpcomingTrack();
      setPlayerStatus(`Could not start: ${track.title}`);
      if (!suppressManualResumeToast && !document.hidden) {
        showToast("Tap ▶ to resume playback.");
      }
      return false;
    }

  }

  isTransitioning = false;
  updatePlayPauseButton();
  schedulePreloadUpcomingTrack();
  return true;
}

async function addFileTracks(files) {
  const fileArray = Array.from(files);
  const newTracks = [];
  const skipped = [];
  const forced = [];
  
  const MAX_SAVED_AUDIO_BYTES = Math.floor(3.33 * 1024 * 1024 * 1024);
  let filesSkippedDueToLimit = 0;

  let libraryRecords = [];
  try {
    libraryRecords = await getAllTrackMetadata();
  } catch (e) {
    console.warn("Could not load library for duplicate check", e);
  }
  
  let currentBytes = libraryRecords.reduce((sum, item) => sum + (item.size || 0), 0);

  for (const file of fileArray) {
    const duplicate = libraryRecords.find(r =>
      r.title === file.name &&
      r.size === file.size &&
      (!file.lastModified || r.lastModified === file.lastModified)
    );

    if (duplicate) {
      const choice = confirm(`"${file.name}" is already in your library.\n\nImport it anyway as a new copy?`);
      if (!choice) {
        skipped.push(file.name);
        continue;
      }
      forced.push(file.name);
    }

    if (currentBytes + file.size > MAX_SAVED_AUDIO_BYTES) {
      filesSkippedDueToLimit++;
      continue;
    }

    const id = crypto.randomUUID();
    const duration = await getAudioDuration(file);

    await saveTrackBlob(id, file, duration);
    currentBytes += file.size;

    newTracks.push({
      id,
      title: cleanTrackName(file.name),
      rawFilename: file.name,
      sourceType: "file",
      duration: duration
    });
  }

  if (filesSkippedDueToLimit > 0) {
    if (newTracks.length === 0) {
      showToast("Saved-audio limit reached (3.33 GB). Remove saved music to add more.", 5000);
    } else {
      showToast(`Added ${newTracks.length} files. ${filesSkippedDueToLimit} skipped because the 3.33 GB saved-audio limit was reached.`, 5000);
    }
  } else if (skipped.length > 0) {
    showToast(`Skipped ${skipped.length} existing files.`);
  }

  if (newTracks.length === 0) return;

  playlist.push(...newTracks);
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  const wasEmpty = (playlist.length === newTracks.length);
  if (wasEmpty || currentTrackIndex === -1) {
    await loadTrack(0, true, { reason: "import-files" });
  } else {
    renderPlaylist();
    savePlaylistState();
    schedulePreloadUpcomingTrack();
  }
  await updateBadgeCounts();
  await renderSidebarLibrary();
}

function addUrlTrack(url) {
  const trimmed = url.trim();
  if (!trimmed) return;

  try {
    const parsedUrl = new URL(trimmed);
    const hostname = parsedUrl.hostname.toLowerCase();
    const lowerPath = parsedUrl.pathname.toLowerCase();

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      showToast("YouTube URLs are not direct audio files and are not supported.", 4000);
      return;
    }

    const blockExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'];
    if (blockExtensions.some(ext => lowerPath.endsWith(ext))) {
      showToast("Images and videos cannot be added to the player.", 4000);
      return;
    }

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
    loadTrack(0, true, { reason: "add-url" });
  } else {
    renderPlaylist();
    savePlaylistState();
    schedulePreloadUpcomingTrack();
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
  updatePlaylistNameDisplay();

  if (playlist.length === 0) {
    audio.pause();
    revokeCurrentObjectUrl();
    clearPreloadedTrackSource();
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
    loadTrack(currentTrackIndex, false, { reason: "remove-track" });
  }

  renderPlaylist();
  savePlaylistState();
  updateBadgeCounts();
  schedulePreloadUpcomingTrack();
  setPlayerStatus(`Removed: ${removedTrack.title}`);
  showToast(`Removed: ${removedTrack.title}`);
}

function clearPlaylist() {
  audio.pause();
  revokeCurrentObjectUrl();
  clearPreloadedTrackSource();
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
    clearPreloadedTrackSource();

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
      await loadTrack(currentTrackIndex, false, { reason: "clear-library" });
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
