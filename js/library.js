
// ── Device Library: render per-file list in sidebar ──
async function renderSidebarLibrary() {
  if (!deviceLibraryList) return;

  if (!db) {
    deviceLibraryList.innerHTML = `<p class="library-empty-state">Library unavailable.</p>`;
    return;
  }

  let records;
  try {
    records = await getAllTrackBlobs();
  } catch {
    records = [];
  }

  const builtinTracks = [];
  Object.values(savedPlaylists).forEach(pl => {
    if (pl.isBuiltin) {
      builtinTracks.push(...(pl.tracks || []));
    }
  });

  const seenBuiltins = new Set();
  const uniqueBuiltins = builtinTracks.filter(t => {
    if (seenBuiltins.has(t.title)) return false;
    seenBuiltins.add(t.title);
    return true;
  });

  if (records.length === 0 && uniqueBuiltins.length === 0) {
    deviceLibraryList.innerHTML = `<p class="library-empty-state">Your library is empty.</p>`;
    return;
  }

  deviceLibraryList.innerHTML = "";

  // Helper to create a selector button
  const createSelector = (trackId) => {
    const selectorBtn = document.createElement("button");
    selectorBtn.type = "button";
    selectorBtn.className = "library-selector-btn";
    if (selectedLibraryTracks.has(trackId)) {
      selectorBtn.classList.add("selected");
    }
    selectorBtn.setAttribute("aria-label", "Toggle selection for new playlist");
    selectorBtn.addEventListener("click", () => {
      if (selectedLibraryTracks.has(trackId)) {
        selectedLibraryTracks.delete(trackId);
        selectorBtn.classList.remove("selected");
      } else {
        selectedLibraryTracks.add(trackId);
        selectorBtn.classList.add("selected");
      }
      updateSelectionBadge();
    });
    return selectorBtn;
  };

  // Section 1: Your Tracks (Personal Uploads)
  if (records.length > 0) {
    const yourTracksLabel = document.createElement("div");
    yourTracksLabel.className = "library-section-title";
    yourTracksLabel.textContent = "Your Tracks";
    deviceLibraryList.appendChild(yourTracksLabel);

    records.forEach((record) => {
      const size = formatBytes(record.size || record.blob?.size || 0);
      const name = record.title || record.id;
      const durationStr = record.duration ? formatTime(record.duration) : "";
      const metaText = durationStr ? `${durationStr} • ${size}` : size;

      const item = document.createElement("div");
      item.className = "library-item";
      item.dataset.id = record.id;

      const info = document.createElement("div");
      info.className = "library-item-info";
      info.innerHTML = `
        <span class="library-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <span class="library-item-size">${metaText}</span>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "library-delete-btn";
      deleteBtn.innerHTML = ICONS.trash;
      deleteBtn.setAttribute("aria-label", `Delete ${escapeHtml(name)}`);

      let confirmTimeout = null;
      deleteBtn.addEventListener("click", () => {
        if (deleteBtn.classList.contains("confirming")) {
          clearTimeout(confirmTimeout);
          deleteStoredTrack(record.id, name);
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

      item.appendChild(info);
      item.appendChild(deleteBtn);
      item.appendChild(createSelector(record.id));
      deviceLibraryList.appendChild(item);
    });
  }

  // Section 2: Tracks Built-In
  if (uniqueBuiltins.length > 0) {
    const builtinsLabel = document.createElement("div");
    builtinsLabel.className = "library-section-title";
    builtinsLabel.textContent = "Tracks Built-In";
    deviceLibraryList.appendChild(builtinsLabel);

    uniqueBuiltins.forEach((track) => {
      const durationStr = track.duration ? formatTime(track.duration) : "";
      const metaText = durationStr ? durationStr : "Built-in";
      const item = document.createElement("div");
      item.className = "library-item builtin-item";
      item.innerHTML = `
        <div class="library-item-info">
          <span class="library-item-name" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</span>
          <span class="library-item-size">${metaText}</span>
        </div>
      `;
      // Delete button - spacer for grid consistency
      const spacer = document.createElement("div");
      item.appendChild(spacer);
      
      item.appendChild(createSelector(track.id));
      deviceLibraryList.appendChild(item);
    });
  }

  updateSelectionBadge();
}

// ── Delete a single stored device track and clean up playlists ──
async function deleteStoredTrack(id, title) {
  try {
    await deleteTrackBlob(id);
    revokeCurrentObjectUrl();

    // If the currently playing track is the deleted one, stop playback
    const currentTrack = playlist[currentTrackIndex];
    if (currentTrack && currentTrack.id === id) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    // Remove from current playlist
    const wasCurrentIndex = currentTrackIndex;
    playlist = playlist.filter((t) => t.id !== id);

    if (playlist.length === 0) {
      currentTrackIndex = -1;
    } else if (wasCurrentIndex >= playlist.length) {
      currentTrackIndex = playlist.length - 1;
    } else if (currentTrack && currentTrack.id === id) {
      currentTrackIndex = Math.max(0, wasCurrentIndex - 1);
    }

    // Remove from all saved playlists (delete entire playlist if it becomes empty)
    Object.keys(savedPlaylists).forEach((name) => {
      const filtered = (savedPlaylists[name].tracks || []).filter(
        (t) => t.id !== id,
      );
      if (filtered.length === 0) {
        delete savedPlaylists[name];
      } else {
        savedPlaylists[name].tracks = filtered;
      }
    });

    persistSavedPlaylists();
    savePlaylistState();
    renderPlaylist();
    updateNowPlaying(playlist[currentTrackIndex] || null);
    updatePlayPauseButton();
    await updateStorageUsage();
    await updateBadgeCounts();
    await renderSidebarLibrary();

    showToast(`“${title}” removed.`);
  } catch (error) {
    console.error("Could not delete track:", error);
    showToast("Could not delete file. Try again.");
  }
}

function updateSelectionBadge() {
  const badge = document.getElementById("selectionBadge");
  const addBtn = document.getElementById("addLibraryToPlaylistBtn");
  const count = selectedLibraryTracks.size;
  
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }
  
  if (addBtn) {
    addBtn.disabled = count === 0;
    addBtn.style.opacity = count === 0 ? "0.5" : "1";
    addBtn.textContent = count > 0
      ? `Add ${count} Track${count !== 1 ? "s" : ""} to Playlist`
      : "Add to Playlist";
  }
}

async function addSelectedToPlaylist() {
  if (selectedLibraryTracks.size === 0) return;

  // Build lookup maps for personal uploads and builtins
  let records = [];
  try { 
    records = await getAllTrackBlobs(); 
  } catch (e) {
    console.error("Could not fetch library records:", e);
  }

  const recordMap = new Map(records.map(r => [r.id, r]));

  const builtinMap = new Map();
  Object.values(savedPlaylists).forEach(pl => {
    if (pl.isBuiltin) {
      (pl.tracks || []).forEach(t => builtinMap.set(t.id, t));
    }
  });

  const existingIds = new Set(playlist.map(t => t.id));
  const toAdd = [];
  const skipped = [];

  for (const id of selectedLibraryTracks) {
    if (existingIds.has(id)) { 
      skipped.push(id); 
      continue; 
    }
    
    if (recordMap.has(id)) {
      const r = recordMap.get(id);
      toAdd.push({ 
        id: r.id, 
        title: r.title, 
        sourceType: "file", 
        duration: r.duration 
      });
    } else if (builtinMap.has(id)) {
      const t = builtinMap.get(id);
      toAdd.push({ ...t }); // builtins already have sourceType:"url"
    }
  }

  if (toAdd.length === 0 && skipped.length > 0) {
    showToast(`${skipped.length} track${skipped.length !== 1 ? "s" : ""} already in playlist.`);
    return;
  }

  playlist.push(...toAdd);
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  const wasEmpty = playlist.length === toAdd.length;
  if (wasEmpty || currentTrackIndex === -1) {
    await loadTrack(0, true);
  } else {
    renderPlaylist();
    savePlaylistState();
  }
  await updateBadgeCounts();

  // Clear selection after adding
  selectedLibraryTracks.clear();
  updateSelectionBadge();
  await renderSidebarLibrary();

  const msg = toAdd.length > 0
    ? `${toAdd.length} track${toAdd.length !== 1 ? "s" : ""} added.${skipped.length > 0 ? ` (${skipped.length} already in playlist)` : ""}`
    : `Already in playlist.`;
    
  showToast(msg);
  setPlayerStatus(msg);
}
