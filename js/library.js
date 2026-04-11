
// ── Device Library: render per-file list in sidebar ──
async function renderSidebarLibrary() {
  if (!deviceLibraryList) return;

  if (!db) {
    deviceLibraryList.innerHTML = `<p class="library-empty-state">Library unavailable.</p>`;
    return;
  }

  let records;
  try {
    records = await getAllTrackMetadata();
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

  const wasYourTracksOpen = document.getElementById("lib-section-your-tracks")?.style.display !== "none";
  const wasBuiltinOpen = document.getElementById("lib-section-built-in")?.style.display !== "none";

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
  const sortModes = ["A–Z", "Z–A", "Newest", "Oldest"];
  let currentSort = localStorage.getItem("myTracksSort") || "A–Z";
  if (!sortModes.includes(currentSort)) currentSort = "A–Z";

  records.sort((a, b) => {
    const aName = cleanTrackName(a.title || "").toLowerCase();
    const bName = cleanTrackName(b.title || "").toLowerCase();
    const aTime = a.updatedAt || a.lastModified || 0;
    const bTime = b.updatedAt || b.lastModified || 0;

    if (currentSort === "A–Z") return aName.localeCompare(bName);
    if (currentSort === "Z–A") return bName.localeCompare(aName);
    if (currentSort === "Newest") return bTime - aTime;
    if (currentSort === "Oldest") return aTime - bTime;
    return 0;
  });

  // Collapsible header
  const yourTracksHeader = document.createElement("div");
  yourTracksHeader.className = "library-section-header";
  const myTracksCount = records.length;
  yourTracksHeader.innerHTML = `
    <span class="library-section-title-text">MY TRACKS <span id="myTracksBadge" class="counter-badge ${myTracksCount === 0 ? 'hidden' : ''}">${myTracksCount}</span></span>
    <div style="display: flex; gap: 8px; align-items: center;">
      ${myTracksCount > 0 ? `<button id="myTracksSortBtn" class="sidebar-collapse-toggle" type="button" title="Sort Order">Sort: ${currentSort}</button>` : ""}
      <button id="myTracksToggleBtn" class="sidebar-collapse-toggle" type="button" aria-expanded="${wasYourTracksOpen}">${wasYourTracksOpen ? "Hide" : "Show"}</button>
    </div>
  `;
  deviceLibraryList.appendChild(yourTracksHeader);

  // Collapsible content wrapper
  const yourTracksContent = document.createElement("div");
  yourTracksContent.className = "library-section-content";
  yourTracksContent.id = "lib-section-your-tracks";
  yourTracksContent.style.display = wasYourTracksOpen ? "" : "none";

  if (records.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "library-empty-state";
    emptyState.style.minHeight = "auto";
    emptyState.style.padding = "20px 0";
    emptyState.innerHTML = `
      <div class="empty-icon">${ICONS.record}</div>
      <p>No tracks imported yet.</p>
      <span class="empty-hint">Tap the red + button to pick audio files or a folder.</span>
    `;
    yourTracksContent.appendChild(emptyState);
  } else {
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
      
      const cleanName = cleanTrackName(record.title || "");
      const rawName = record.title || "Unknown File";
      
      info.innerHTML = `
        <span class="library-item-name" title="${escapeHtml(rawName)}">${escapeHtml(cleanName)}</span>
        <span class="library-item-size">${metaText} • ${escapeHtml(rawName)}</span>
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

      item.appendChild(createSelector(record.id));
      item.appendChild(info);
      item.appendChild(deleteBtn);
      yourTracksContent.appendChild(item);
    });
  }

  deviceLibraryList.appendChild(yourTracksContent);

  // Wire up toggle
  const yourTracksToggle = yourTracksHeader.querySelector("#myTracksToggleBtn");
  yourTracksToggle.addEventListener("click", () => {
    const isExpanded = yourTracksContent.style.display !== "none";
    yourTracksContent.style.display = isExpanded ? "none" : "";
    yourTracksToggle.textContent = isExpanded ? "Show" : "Hide";
    yourTracksToggle.setAttribute("aria-expanded", String(!isExpanded));
  });

  if (myTracksCount > 0) {
    const sortBtn = yourTracksHeader.querySelector("#myTracksSortBtn");
    sortBtn.addEventListener("click", () => {
      const nextIdx = (sortModes.indexOf(currentSort) + 1) % sortModes.length;
      localStorage.setItem("myTracksSort", sortModes[nextIdx]);
      renderSidebarLibrary();
    });
  }

  // Section 2: Tracks Built-In
  if (uniqueBuiltins.length > 0) {
    // Collapsible header
    const builtinsHeader = document.createElement("div");
    builtinsHeader.className = "library-section-header";
    const builtinsCount = uniqueBuiltins.length;
    builtinsHeader.innerHTML = `
      <span class="library-section-title-text">BUILT-IN TRACKS <span id="builtInBadge" class="counter-badge ${builtinsCount === 0 ? 'hidden' : ''}">${builtinsCount}</span></span>
      <button class="sidebar-collapse-toggle" type="button" aria-expanded="${wasBuiltinOpen}">${wasBuiltinOpen ? "Hide" : "Show"}</button>
    `;
    deviceLibraryList.appendChild(builtinsHeader);

    // Collapsible content wrapper
    const builtinsContent = document.createElement("div");
    builtinsContent.className = "library-section-content";
    builtinsContent.id = "lib-section-built-in";
    builtinsContent.style.display = wasBuiltinOpen ? "" : "none";

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
      item.appendChild(createSelector(track.id));
      item.appendChild(item.querySelector('.library-item-info'));
      builtinsContent.appendChild(item);
    });

    deviceLibraryList.appendChild(builtinsContent);

    // Wire up toggle
    const builtinsToggle = builtinsHeader.querySelector("button");
    builtinsToggle.addEventListener("click", () => {
      const isExpanded = builtinsContent.style.display !== "none";
      builtinsContent.style.display = isExpanded ? "none" : "";
      builtinsToggle.textContent = isExpanded ? "Show" : "Hide";
      builtinsToggle.setAttribute("aria-expanded", String(!isExpanded));
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
  const count = selectedLibraryTracks.size;
  const activeTab = document.querySelector(".nav-item.active")?.dataset.target;
  
  if (selectionActionBar) {
    if (count > 0 && activeTab === "view-library") {
      selectionActionBar.classList.remove("hidden");
    } else {
      selectionActionBar.classList.add("hidden");
    }
  }

  if (addLibraryToPlaylistBtn) {
    addLibraryToPlaylistBtn.textContent = count > 0
      ? `Add ${count} Track${count !== 1 ? "s" : ""} to the Queue`
      : "Add to Queue";
  }
}

// Wire up the clear selection button once
if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener("click", () => {
    selectedLibraryTracks.clear();
    // Un-select any visual checkmarks
    document.querySelectorAll(".library-selector-btn.selected").forEach(btn => {
      btn.classList.remove("selected");
    });
    updateSelectionBadge();
  });
}


async function addSelectedToPlaylist() {
  if (selectedLibraryTracks.size === 0) return;

  // Build lookup maps for personal uploads and builtins
  let records = [];
  try { 
    records = await getAllTrackMetadata(); 
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
    let recordName = "Track";
    if (recordMap.has(id)) recordName = recordMap.get(id).title;
    else if (builtinMap.has(id)) recordName = builtinMap.get(id).title;

    if (existingIds.has(id)) { 
      const choice = confirm(`This exact file is already in the current queue.\n\nAdd it again anyway?`);
      if (!choice) {
        skipped.push(id); 
        continue; 
      }
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
    showToast(`${skipped.length} track${skipped.length !== 1 ? "s" : ""} already in queue.`);
    // Still clear selection!
    selectedLibraryTracks.clear();
    updateSelectionBadge();
    document.querySelectorAll(".library-selector-btn.selected").forEach(btn => btn.classList.remove("selected"));
    return;
  }

  playlist.push(...toAdd);
  // Do NOT clear currentPlaylistName here — if a named playlist is active,
  // adding tracks from Library populates that playlist's workspace. Clearing
  // the name was legacy behavior that broke the active-playlist state sync.

  const wasEmpty = playlist.length === toAdd.length;
  if (wasEmpty || currentTrackIndex === -1) {
    await loadTrack(0, true);
  } else {
    renderPlaylist();
    savePlaylistState();
  }
  await updateBadgeCounts();
  if (typeof refreshUpdateRow === "function") refreshUpdateRow(); // keep pill badge in sync

  // Clear selection after adding
  selectedLibraryTracks.clear();
  updateSelectionBadge();
  await renderSidebarLibrary();

  const msg = toAdd.length > 0
    ? `${toAdd.length} track${toAdd.length !== 1 ? "s" : ""} added to Queue.${skipped.length > 0 ? ` (${skipped.length} already there)` : ""}`
    : `Already in queue.`;

  showToast(msg);
  setPlayerStatus(msg);

  // Navigate to Playlist tab and show the queue — only when tracks were actually added
  if (toAdd.length > 0 && typeof switchView === "function") {
    switchView("view-playlists");

    // Expand CURRENT QUEUE using the same mechanism as the nowPlaying click handler.
    // Use requestAnimationFrame to ensure switchView's DOM updates have settled first.
    requestAnimationFrame(() => {
      const queueCard = document.getElementById("currentPlaylistCard");
      const queueBtn  = document.getElementById("currentPlaylistHeaderBtn");

      if (queueCard && queueCard.classList.contains("collapsed")) {
        if (typeof toggleSection === "function") {
          toggleSection("currentPlaylistHeaderBtn", "currentPlaylistCard", "playlistCollapseText", "playlistCollapseIcon", true);
        } else {
          queueCard.classList.remove("collapsed");
        }
      }
      if (queueBtn) {
        queueBtn.textContent = "Hide";
        queueBtn.setAttribute("aria-expanded", "true");
      }

      // Scroll the queue header into view
      setTimeout(() => {
        const queueHeader = document.getElementById("sidebar-section-queue");
        if (queueHeader) {
          queueHeader.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    });
  }
}
