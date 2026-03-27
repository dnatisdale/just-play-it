
fileInput.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  await addFileTracks(files);
  fileInput.value = "";
});

// Cover art click → open file picker (only when in "load" state)
coverArtEl.addEventListener("click", () => {
  if (coverArtEl.classList.contains("cover-art-load")) {
    fileInput.click();
  }
});


addUrlBtn.addEventListener("click", () => addUrlTrack(urlInput.value));

urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addUrlTrack(urlInput.value);
  }
});

playPauseBtn.addEventListener("click", async () => {
  if (!audio.src) return playCurrent();
  if (audio.paused) {
    await playCurrent();
  } else {
    pauseCurrent();
  }
});

nextBtn.addEventListener("click", async () => playNext());
prevBtn.addEventListener("click", async () => playPrev());
skipBackBtn.addEventListener("click", () => skipSeconds(-30));
skipForwardBtn.addEventListener("click", () => skipSeconds(30));

shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeatMode);
installBtn.addEventListener("click", handleInstallClick);
if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
if (viewErrorLogBtn) viewErrorLogBtn.addEventListener("click", showErrorLog);

async function handleShare() {
  const shareUrl = window.location.origin + window.location.pathname;
  const shareText = `JUST PLAY IT.
A simple audio player for all your tracks.
Click on the record to download and start!

Check it out here: ${shareUrl}`;

  const shareData = {
    title: "JUST PLAY IT.",
    text: shareText,
    url: shareUrl,
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      showToast("Sharing options opened.");
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("App link and message copied.");
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share failed:", err);
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("App link and message copied.");
      } catch (copyErr) {
        showToast("Could not share or copy link.");
      }
    }
  }
}

if (shareAppBtn) shareAppBtn.addEventListener("click", handleShare);

// ── Sidebar ──────────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add("is-open");
  sidebar.setAttribute("aria-hidden", "false");
  sidebarOverlay.classList.add("is-open");
  menuBtn.classList.add("is-open");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  // Refresh both storage text and per-file list every time the sidebar opens
  updateStorageUsage();
  renderSidebarLibrary();
}

function closeSidebar() {
  sidebar.classList.remove("is-open");
  sidebar.setAttribute("aria-hidden", "true");
  sidebarOverlay.classList.remove("is-open");
  menuBtn.classList.remove("is-open");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

menuBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Close sidebar on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
    closeSidebar();
  }
});

// ── Drag & drop ──────────────────────────────────────────────
const AUDIO_EXTS = /\.(mp3|m4a|aac|ogg|oga|wav|flac|opus|weba|webm|caf)$/i;

function isAudioFile(file) {
  return file.type.startsWith("audio/") || AUDIO_EXTS.test(file.name);
}

let dragDepth = 0;

function isFileDrag(event) {
  return (
    event.dataTransfer &&
    Array.from(event.dataTransfer.types).includes("Files")
  );
}

document.addEventListener("dragenter", (event) => {
  if (!isFileDrag(event)) return;
  dragDepth++;
  if (dragDepth === 1) {
    dragOverlay.classList.add("active");
    dragOverlay.setAttribute("aria-hidden", "false");
  }
});

document.addEventListener("dragleave", (event) => {
  if (!isFileDrag(event) && dragDepth <= 0) return;
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    dragOverlay.classList.remove("active");
    dragOverlay.setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("dragover", (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});

document.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDepth = 0;
  dragOverlay.classList.remove("active");
  dragOverlay.setAttribute("aria-hidden", "true");
  if (dropZone) dropZone.classList.remove("drag-hover");

  const files = Array.from(event.dataTransfer.files).filter(isAudioFile);
  if (files.length === 0) {
    showToast("No audio files found in the drop.");
    return;
  }
  await addFileTracks(files);
});

// Drop zone interactive behaviours
if (dropZone) {
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-hover");
  });
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("drag-hover"),
  );
  dropZone.addEventListener("drop", () =>
    dropZone.classList.remove("drag-hover"),
  );
}

// ── Folder picker ────────────────────────────────────────
if (folderInput) {
  folderInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files).filter(isAudioFile);
    if (files.length === 0) {
      showToast("No audio files found in that folder.");
    } else {
      await addFileTracks(files);
    }
    folderInput.value = "";
  });
}



savePlaylistBtn.addEventListener("click", saveNamedPlaylist);

// Enable Action dropdown once a playlist is selected; reset it after each use

// Playlist Action cycling
let currentAction = "load"; // default
if (playlistActionBtn) {
  playlistActionBtn.addEventListener("click", () => {
    if (currentAction === "load") currentAction = "rename";
    else if (currentAction === "rename") currentAction = "delete";
    else currentAction = "load";
    
    playlistActionBtn.textContent = `— Action: ${currentAction.charAt(0).toUpperCase() + currentAction.slice(1)} —`;
  });
}

if (runActionBtn) {
  runActionBtn.addEventListener("click", async () => {
    const selected = selectedPlaylistKey;
    if (!selected) {
      showToast("Select a playlist first.");
      return;
    }
    const isBuiltin = savedPlaylists[selected] && savedPlaylists[selected].isBuiltin;
    if (isBuiltin && currentAction !== "load") {
      showToast(`Cannot ${currentAction} a built-in playlist.`);
      return;
    }

    if (currentAction === "load") await loadNamedPlaylist();
    else if (currentAction === "rename") renameNamedPlaylist();
    else if (currentAction === "delete") deleteNamedPlaylist();
  });
}

function updatePlaylistActionUI() {
  if (!playlistActionBtn || !runActionBtn) return;
  const hasSelection = !!selectedPlaylistKey;
  playlistActionBtn.disabled = !hasSelection;
  runActionBtn.disabled = !hasSelection;
  
  if (!hasSelection) {
    playlistActionBtn.style.opacity = "0.5";
    runActionBtn.style.opacity = "0.5";
  } else {
    playlistActionBtn.style.opacity = "1";
    runActionBtn.style.opacity = "1";
  }
}
let clearConfirmTimeout = null;
clearDeviceLibraryBtn.addEventListener("click", async () => {
  if (clearDeviceLibraryBtn.classList.contains("confirming")) {
    clearTimeout(clearConfirmTimeout);
    clearDeviceLibraryBtn.classList.remove("confirming");
    clearDeviceLibraryBtn.innerHTML = `<span class="sidebar-row-icon">${ICONS.trash}</span> <span class="sidebar-row-text">Remove All Saved Music</span>`;
    await clearDeviceLibrary();
  } else {
    clearDeviceLibraryBtn.classList.add("confirming");
    clearDeviceLibraryBtn.innerHTML = `<span class="sidebar-row-text" style="color:#fff; font-weight:bold;">Sure? Delete all stored tracks?</span>`;
    clearConfirmTimeout = setTimeout(() => {
      clearDeviceLibraryBtn.classList.remove("confirming");
      clearDeviceLibraryBtn.innerHTML = `<span class="sidebar-row-icon">${ICONS.trash}</span> <span class="sidebar-row-text">Remove All Saved Music</span>`;
    }, 4000);
  }
});

exportPlaylistsBtn.addEventListener("click", exportPlaylists);

importPlaylistsInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  await importPlaylistsFromFile(file);
  importPlaylistsInput.value = "";
});

jumpToCurrentBtn.addEventListener("click", jumpToCurrentTrack);

if (toggleEditBtn) {
  toggleEditBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    toggleEditBtn.classList.toggle("active", isEditMode);
    toggleEditBtn.textContent = isEditMode ? "Done" : "Edit";
    renderPlaylist();
    showToast(isEditMode ? "Edit mode on. You can reorder or remove tracks." : "Edit mode off.");
  });
}

if (currentPlaylistHeaderBtn) {
  currentPlaylistHeaderBtn.addEventListener("click", () => {
    const isExpanded = currentPlaylistHeaderBtn.getAttribute("aria-expanded") === "true";
    currentPlaylistHeaderBtn.setAttribute("aria-expanded", String(!isExpanded));
    if (playlistContainer) playlistContainer.classList.toggle("collapsed", isExpanded);
    
    const collapseText = document.getElementById("playlistCollapseText");
    if (collapseText) {
      collapseText.textContent = isExpanded ? "Show" : "Hide";
    }
    const collapseIcon = document.getElementById("playlistCollapseIcon");
    if (collapseIcon) {
      collapseIcon.style.transform = isExpanded ? "" : "rotate(180deg)";
    }
  });
  currentPlaylistHeaderBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      currentPlaylistHeaderBtn.click();
    }
  });
}

savedPlaylistsSelect.addEventListener("change", () => {
  const selected = savedPlaylistsSelect.value;
  selectedPlaylistKey = selected;
  // Always reset visible value so placeholder heading shows
  savedPlaylistsSelect.value = "";

  if (selected) {
    localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, selected);
    if (savedPlaylistBox) savedPlaylistBox.title = `Selected: ${selected}`;
    showToast(`Selected: ${selected}`);
  } else {
    localStorage.removeItem(STORAGE_KEYS.selectedSavedPlaylist);
    if (savedPlaylistBox) savedPlaylistBox.title = "No saved playlist selected.";
  }

  updatePlaylistActionUI();
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);

  // Auto-capture duration into playlist if missing
  if (playlist[currentTrackIndex] && !playlist[currentTrackIndex].duration) {
    playlist[currentTrackIndex].duration = audio.duration;
    renderPlaylist();
    savePlaylistState();
  }

  if (
    pendingRestoreTime !== null &&
    Number.isFinite(audio.duration) &&
    pendingRestoreTime < audio.duration
  ) {
    audio.currentTime = pendingRestoreTime;
  }
});

audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  } else {
    seekBar.value = 0;
  }

  savePlaybackState();
});

seekBar.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const seekTo = (Number(seekBar.value) / 100) * audio.duration;
  audio.currentTime = seekTo;
});

if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    audio.volume = Number(volumeSlider.value);
    saveVolume();
  });
}

// Automatic sleep timer on cycling
if (sleepTimerBtn) {
  sleepTimerBtn.addEventListener("click", () => {
    // Sequence: 0 -> 10 -> 30 -> 60 -> 0
    let current = sleepTimerMinutes || 0;
    let next = 0;
    if (current === 0) next = 10;
    else if (current === 10) next = 30;
    else if (current === 30) next = 60;
    else next = 0;

    setSleepTimer(next);
    sleepTimerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sleep: ${next === 0 ? "Off" : next + " min"}`;
  });
}

if (pickFilesBtn) {
  pickFilesBtn.addEventListener("click", () => fileInput.click());
}

audio.addEventListener("play", () => {
  updatePlayPauseButton();
  updateMediaSession();

  if (playlist[currentTrackIndex]) {
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  }
});

audio.addEventListener("pause", () => {
  updatePlayPauseButton();
  updateMediaSession();

  // Mobile: Auto-resume logic for notifications/interruptions
  // Avoid auto-resuming if the user intentionally paused, if the track ended, 
  // or if we are at the very end (to avoid fighting with the 'ended' event).
  const isNearEnd = audio.duration > 0 && (audio.duration - audio.currentTime < 1.0);
  
  if (!userPaused && !audio.ended && !isNearEnd && resumeRetries < 3) {
    resumeRetries++;
    setPlayerStatus(`Playback interrupted. Resuming... (Retry ${resumeRetries}/3)`);
    
    setTimeout(async () => {
      // Do NOT auto-resume if we are in the middle of loading a new track.
      // This prevents the race condition that causes "Playback could not start."
      if (!userPaused && !audio.ended && !isTransitioning) {
        try {
          await audio.play();
          resumeRetries = 0; // Successfully resumed
        } catch (err) {
          console.warn(`Auto-resume retry ${resumeRetries} blocked:`, err);
          if (resumeRetries >= 3) {
            setPlayerStatus("Playback stalled. Please press Play manually.");
          }
        }
      }
    }, 2000);
  } else if (!userPaused && audio.ended) {
    // Already handled by 'ended' listener, do nothing here
  } else if (audio.currentTime > 0 && !audio.ended) {
    setPlayerStatus("Playback paused.");
    resumeRetries = 0; // Reset if it was a legitimate manual pause
  }
});

// Audio Error Handling
audio.addEventListener("error", (e) => {
  const err = audio.error;
  let msg = "Playback error occurred.";
  let technical = "Unknown audio error";
  if (err) {
    technical = `Code: ${err.code}, Message: ${err.message || "N/A"}`;
    switch (err.code) {
      case 1: msg = "Playback aborted."; break;
      case 2: msg = "Network error while loading audio."; break;
      case 3: msg = "Audio decoding failed."; break;
      case 4: msg = "Audio format not supported or file missing."; break;
    }
  }
  addErrorLog(`Audio Error: ${msg} (${technical}) Source: ${audio.src ? audio.src.substring(0, 100) : "none"}`, "Audio");
  console.error("Audio element error:", err);
  setPlayerStatus(msg);
  showToast(msg);
  resumeRetries = 0; // Stop auto-resume loop on actual errors
});

audio.addEventListener("stalled", () => {
  if (!audio.paused && !audio.ended) {
    addErrorLog(`Playback stalled/buffering at ${audio.currentTime.toFixed(2)}s`, "AudioStatus");
    setPlayerStatus("Buffering/Stalled...");
  }
});

audio.addEventListener("ended", async () => {
  resumeRetries = 0; // Reset retries on successful completion
  pendingRestoreTime = null;
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play().catch((error) => console.error("Replay failed:", error));
    return;
  }

  if (
    !shuffleEnabled &&
    repeatMode === "off" &&
    currentTrackIndex === playlist.length - 1
  ) {
    updatePlayPauseButton();
    setPlayerStatus("Reached the end of the playlist.");
    return;
  }

  if (
    shuffleEnabled ||
    repeatMode === "all" ||
    currentTrackIndex < playlist.length - 1
  ) {
    await playNext();
  }
});

function handleBeforeInstallPrompt(e) {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
}

async function handleInstallClick() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === "accepted") {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.classList.add("hidden");
  }
}

window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
  setPlayerStatus("App installed.");
  showToast("App installed.");
});

window.addEventListener("beforeunload", () => {
  savePlaylistState();
  savePlaybackState();
  saveVolume();
  saveModes();
  revokeCurrentObjectUrl();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      // Check for updates periodically (every hour) instead of every load
      setInterval(() => reg.update(), 60 * 60 * 1000);
    }).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });

  // Notify the user when an update is available instead of silent reloading
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      showToast("App updated in background. Refresh to use latest version.", 6000);
      // Optional: Add a real UI button for refreshing if we want to be more explicit
    }
  });
}

function updateQrCode() {
  const qrImage = document.getElementById("qrImage");
  const qrImageFull = document.getElementById("qrImageFull");
  if (!qrImage || !qrImageFull) return;

  const currentUrl = window.location.origin + window.location.pathname;
  // Use a high-quality QR API (qrserver.com is fast and reliable)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;
  
  qrImage.src = qrUrl;
  qrImageFull.src = qrUrl;
}

const qrWrapper = document.getElementById("qrWrapper");
const qrFullscreen = document.getElementById("qrFullscreen");
const closeQrBtn = document.getElementById("closeQrBtn");

if (qrWrapper && qrFullscreen) {
  qrWrapper.addEventListener("click", () => {
    qrFullscreen.classList.add("is-open");
    qrFullscreen.setAttribute("aria-hidden", "false");
  });
}

if (closeQrBtn && qrFullscreen) {
  closeQrBtn.addEventListener("click", () => {
    qrFullscreen.classList.remove("is-open");
    qrFullscreen.setAttribute("aria-hidden", "true");
  });

  qrFullscreen.addEventListener("click", (e) => {
    if (e.target === qrFullscreen) {
      qrFullscreen.classList.remove("is-open");
      qrFullscreen.setAttribute("aria-hidden", "true");
    }
  });
}

if (copyQrBtn) {
  copyQrBtn.addEventListener("click", async () => {
    try {
      const qrImage = document.getElementById("qrImage");
      // Use fetch to get the image as a blob
      const response = await fetch(qrImage.src);
      const blob = await response.blob();
      
      // Some browsers require ClipboardItem to be used with write()
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      
      showToast("QR code image copied.");
    } catch (err) {
      console.error("QR image copy failed:", err);
      // Fallback: copy the URL text
      const currentUrl = window.location.origin + window.location.pathname;
      try {
        await navigator.clipboard.writeText(currentUrl);
        showToast("Could not copy image. App URL copied instead.");
      } catch (clipErr) {
        showToast("Could not copy QR code.");
      }
    }
  });
}

if (downloadQrBtn) {
  downloadQrBtn.addEventListener("click", async () => {
    try {
      const qrImage = document.getElementById("qrImage");
      const response = await fetch(qrImage.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "just-play-it-qr.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the object URL later
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      showToast("QR code downloading...");
    } catch (err) {
      console.error("QR download failed:", err);
      showToast("Could not download QR code.");
    }
  });
}

function updateBuildInfo() {
  const sidebarInfo = document.getElementById("sidebarBuildInfo");
  const mainInfo = document.getElementById("mainBuildInfo");
  const buildText = BUILD_TIME;
  if (sidebarInfo) sidebarInfo.innerHTML = buildText;
  if (mainInfo) mainInfo.innerHTML = buildText;
}

async function initApp() {
  // Restore sidebar layout order before anything else
  initSidebarOrder();

  // Apply saved/system theme immediately (before any paint)
  initTheme();

  try {
    db = await openDatabase();
  } catch (error) {
    console.error("IndexedDB failed:", error);
    showToast("IndexedDB could not start.");
  }

  loadVolume();
  loadModes();
  await loadSavedPlaylists();
  // Restore previously selected playlist key (without showing it in the select UI)
  const restoredKey = localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist);
  if (restoredKey && savedPlaylists[restoredKey]) {
    selectedPlaylistKey = restoredKey;
  }
  // Always show placeholder in select; enable Action if key is restored
  savedPlaylistsSelect.value = "";
  savedPlaylistsSelect.classList.add("has-selection"); // Always orange
  updatePlaylistActionUI();
  loadPlaylistFromStorage();
  restoreSleepTimer();
  renderPlaylist();
  updatePlayPauseButton();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  setupMediaSessionActions();
  await updateStorageUsage();
  // ── Section Toggles (Playlist & Library) ──
  const setupToggle = (headerId, containerId, textId, iconId) => {
    const header = document.getElementById(headerId);
    const container = document.getElementById(containerId);
    const textEl = document.getElementById(textId);
    const iconEl = document.getElementById(iconId);

    if (!header || !container) return;

    header.addEventListener("click", () => {
      const isVisible = !container.classList.contains("collapsed");
      container.classList.toggle("collapsed");
      header.setAttribute("aria-expanded", !isVisible);
      
      if (textEl) textEl.textContent = isVisible ? "Show" : "Hide";
      if (iconEl) iconEl.style.transform = isVisible ? "" : "rotate(180deg)";
    });
  };

  setupToggle("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon");
  setupToggle("libraryHeader", "libraryContainer", "libraryCollapseText", "libraryCollapseIcon");

  const addLibraryBtn = document.getElementById("addLibraryToPlaylistBtn");
  if (addLibraryBtn) {
    addLibraryBtn.addEventListener("click", addSelectedToPlaylist);
  }

  // Initialize sidebar reordering logic
  initSidebarRearrangeMode();

  // Final count update
  await updateBadgeCounts();
  updateQrCode();
  updateBuildInfo();

  if (currentTrackIndex >= 0) {
    await loadTrack(currentTrackIndex, false);
  } else if (playlist.length === 0) {
    // If playlist is empty, try to auto-load library files
    const records = db ? await getAllTrackBlobs() : [];
    if (records.length > 0) {
      playlist = records.map(r => ({
        id: r.id,
        title: r.title,
        sourceType: "file"
      }));
      currentTrackIndex = 0;
      await loadTrack(0, false);
      renderPlaylist();
      updateBadgeCounts();
    } else {
      // If library is also empty, load "Remember the Lord" as a sample starter
      const starterName = "Remember the Lord";
      if (savedPlaylists[starterName]) {
        selectedPlaylistKey = starterName;
        localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, starterName);
        await loadNamedPlaylist();
      }
    }
  }

  // Header text/badge jumps
  const nowPlayingPlaylistInfo = document.getElementById("nowPlayingPlaylistInfo");
  
  if (nowPlayingPlaylistInfo) {
    nowPlayingPlaylistInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      const plistHeader = document.querySelector(".playlist-header");
      
      // Auto expand if collapsed
      if (currentPlaylistHeaderBtn && currentPlaylistHeaderBtn.getAttribute("aria-expanded") === "false") {
        currentPlaylistHeaderBtn.setAttribute("aria-expanded", "true");
        if (playlistContainer) playlistContainer.classList.remove("collapsed");
        
        const collapseText = document.getElementById("playlistCollapseText");
        if (collapseText) collapseText.textContent = "Hide";
      }

      if (plistHeader) {
        plistHeader.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (playlistEl) {
        playlistEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
  if (savedPlaylistsBadge) {
    savedPlaylistsBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      jumpToSavedPlaylists();
    });
  }
  if (playlistBadge) {
    playlistBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Auto expand if collapsed
      if (currentPlaylistHeaderBtn && currentPlaylistHeaderBtn.getAttribute("aria-expanded") === "false") {
        currentPlaylistHeaderBtn.setAttribute("aria-expanded", "true");
        if (playlistContainer) playlistContainer.classList.remove("collapsed");
        
        const collapseText = document.getElementById("playlistCollapseText");
        if (collapseText) collapseText.textContent = "Hide";
      }

      if (currentPlaylistHeaderBtn) {
        // Bring the Current Playlist label to the very top
        currentPlaylistHeaderBtn.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (playlistEl) {
        playlistEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ── Splash screen failure protection ──
  try {
    const splash = document.getElementById("splashScreen");
    if (splash) {
      // Delay to let the fancy bouncy animation finish
      setTimeout(() => {
        splash.classList.add("fade-out");
      }, 4000);
    }
  } catch (err) {
    console.warn("Splash screen fade failed:", err);
  }
}

function jumpToSavedPlaylists() {
  if (savedPlaylistsSelect) {
    savedPlaylistsSelect.scrollIntoView({ behavior: "smooth", block: "center" });
    savedPlaylistsSelect.classList.add("highlight");
    setTimeout(() => savedPlaylistsSelect.classList.remove("highlight"), 1200);
    
    // Attempt to open the dropdown menu natively
    try {
      if (typeof savedPlaylistsSelect.showPicker === "function") {
        savedPlaylistsSelect.showPicker();
      } else {
        savedPlaylistsSelect.focus();
      }
    } catch (e) {
      savedPlaylistsSelect.focus();
    }
  }
}

// ── Scroll to Top Logic ─────────────────────────────────────────────
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

try {
  initApp();

  // ── File Handling API (Launch Queue) ─────────────────────────
  if ('launchQueue' in window) {
    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || !launchParams.files.length) return;
      try {
        const filePromises = launchParams.files.map(handle => handle.getFile());
        const files = await Promise.all(filePromises);
        const audioFiles = files.filter(isAudioFile);
        if (audioFiles.length > 0) await addFileTracks(audioFiles);
        else showToast("No valid audio files found.");
      } catch (error) {
        console.error("Error opening file from Android menu:", error);
        showToast("Could not open the file.");
      }
    });
  }

  // ── Service Worker Error Reporting ─────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_ERROR') {
        addErrorLog(`ServiceWorker: ${event.data.message}`, "ServiceWorker");
      }
    });
  }
} catch (error) {
  console.error("CRITICAL: Application failed to start:", error);
  // Emergency splash clear so user isn't stuck
  const splash = document.getElementById("splashScreen");
  if (splash) splash.classList.add("fade-out");
  addErrorLog(`Critical Start Fail: ${error.message}`, "System");
}
