
// ── Canonical public app URL (used for sharing and QR generation) ─────────────
const APP_URL = "https://just-play-it.pages.dev/";

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


// URL input removed in Phase 1

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
  const shareUrl = APP_URL;
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


// ── Bottom Navigation & View Switching ────────────────────────
// Flag: set to true before calling switchView() when the caller wants
// the Current Queue to stay expanded (e.g. Now Playing header click).
let expandQueueForJumpNavigation = false;

function switchView(targetViewId) {
  // Close import sheet when switching views (Bug 5)
  const sheet = document.getElementById("importBottomSheet");
  if (sheet && sheet.classList.contains("is-open")) {
    closeImportSheet();
  }

  // Update view sections
  document.querySelectorAll(".view-section").forEach(view => {
    if (view.id === targetViewId) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // FAB visibility: Only show in Library tab
  const importFab = document.getElementById("importFab");
  if (importFab) {
    if (targetViewId === "view-library") {
      importFab.classList.remove("hidden");
    } else {
      importFab.classList.add("hidden");
    }
  }

  // Selection Action Bar management (Contextual Bar visibility)
  const cab = document.getElementById("selectionActionBar");
  if (cab) {
    if (targetViewId === "view-library" && selectedLibraryTracks.size > 0) {
      cab.classList.remove("hidden");
    } else {
      cab.classList.add("hidden");
    }
  }

  // Auto-collapse Current Queue when navigating to the Playlist tab normally.
  // Skip if the caller set expandQueueForJumpNavigation (e.g. Now Playing header click).
  if (targetViewId === "view-playlists") {
    if (!expandQueueForJumpNavigation) {
      const queueCard = document.getElementById("currentPlaylistCard");
      const queueBtn  = document.getElementById("currentPlaylistHeaderBtn");
      if (queueCard && !queueCard.classList.contains("collapsed")) {
        queueCard.classList.remove("expanded");
        queueCard.classList.add("collapsed");
      }
      if (queueBtn) {
        queueBtn.setAttribute("aria-expanded", "false");
        queueBtn.textContent = "Show";
      }
    }
    // Always reset the flag after use
    expandQueueForJumpNavigation = false;
  }

  // Generalize expansion of any subset collapsible panels in the library view (Bug 6)
  if (targetViewId === "view-library") {
    // Reset all library collapsible content wrappers
    document.querySelectorAll(".library-section-content").forEach(el => {
      el.style.display = ""; // clears inline 'none'
    });
    // Reset all library specific toggle buttons to indicate 'Hide' mode now that the contents are visible
    document.querySelectorAll(".library-section-header .sidebar-collapse-toggle").forEach(btn => {
      btn.textContent = "Hide";
      btn.setAttribute("aria-expanded", "true");
    });
  }

  // Update nav buttons
  document.querySelectorAll(".nav-item").forEach(btn => {
    if (btn.dataset.target === targetViewId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    switchView(btn.dataset.target);
  });
});

// ── FAB & Bottom Sheet (Import Audio) ────────────────────────
const importFab = document.getElementById("importFab");
const importBottomSheet = document.getElementById("importBottomSheet");
const fabOverlay = document.getElementById("fabOverlay");
const fabCancel = document.getElementById("fabCancel");
const fabPickFiles = document.getElementById("fabPickFiles");
// input file handling is still attached from original variables

function openImportSheet() {
  importBottomSheet.classList.remove("hidden");
  fabOverlay.classList.remove("hidden");
  // slight delay for transition
  requestAnimationFrame(() => {
    importBottomSheet.classList.add("is-open");
    fabOverlay.classList.add("is-active");
  });
}

function closeImportSheet() {
  importBottomSheet.classList.remove("is-open");
  fabOverlay.classList.remove("is-active");
  setTimeout(() => {
    importBottomSheet.classList.add("hidden");
    fabOverlay.classList.add("hidden");
  }, 300);
}

if (importFab) {
  importFab.addEventListener("click", openImportSheet);
}
if (fabOverlay) {
  fabOverlay.addEventListener("click", closeImportSheet);
}
if (fabCancel) {
  fabCancel.addEventListener("click", closeImportSheet);
}
if (fabPickFiles) {
  fabPickFiles.addEventListener("click", () => {
    closeImportSheet();
    fileInput.click();
  });
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
    closeImportSheet();
    folderInput.value = "";
  });
}



savePlaylistBtn.addEventListener("click", saveNamedPlaylist);

// Playlist Action cycling and dropdown selection removed for Phase 2 card-based design
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

if (exportPlaylistsBtn) {
  exportPlaylistsBtn.addEventListener("click", exportPlaylists);
}

if (importPlaylistsInput) {
  importPlaylistsInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    await importPlaylistsFromFile(file);
    importPlaylistsInput.value = "";
  });
}

jumpToCurrentBtn.addEventListener("click", jumpToCurrentTrack);
if (clearPlaylistBtn) {
  clearPlaylistBtn.addEventListener("click", () => {
    if (confirm("Clear your current playlist workspace? (This will not delete your files from the device).")) {
      clearPlaylist();
      showToast("Playlist cleared.");
    }
  });
}

if (toggleEditBtn) {
  toggleEditBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    toggleEditBtn.classList.toggle("active", isEditMode);
    toggleEditBtn.textContent = isEditMode ? "Done" : "Edit";
    renderPlaylist();
    showToast(isEditMode ? "Edit mode on. You can reorder or remove tracks." : "Edit mode off.");
  });
}



// savedPlaylistsSelect dropdown handling removed in Phase 2

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
    // Sequence: Off -> 15 -> 30 -> 60 -> Off
    let current = sleepTimerMinutes || 0;
    let next = 0;
    if (current === 0)  next = 15;
    else if (current === 15) next = 30;
    else if (current === 30) next = 60;
    else next = 0;

    setSleepTimer(next);
  });
}

// pickFilesBtn removed in favor of fabPickFiles

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

  // Mobile: Auto-resume logic for notifications/interruptions.
  // Skip entirely if we are intentionally transitioning to a new track —
  // the loadTrack function manages play() for transitions itself.
  if (isTransitioning) {
    resumeRetries = 0;
    return;
  }

  const isNearEnd = audio.duration > 0 && (audio.duration - audio.currentTime < 1.0);

  if (!userPaused && !audio.ended && !isNearEnd && resumeRetries < 3) {
    resumeRetries++;
    setPlayerStatus(`Playback interrupted. Resuming... (Retry ${resumeRetries}/3)`);

    setTimeout(async () => {
      // Re-check everything after the delay — state may have changed
      if (
        !userPaused &&
        !audio.ended &&
        !isTransitioning &&
        audio.src &&
        playlist[currentTrackIndex]
      ) {
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
  } else if (audio.currentTime > 0 && !audio.ended && !isTransitioning) {
    setPlayerStatus("Playback paused.");
    resumeRetries = 0;
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
    // Playlist finished naturally — mark as user-paused so the subsequent
    // 'pause' event (which always fires after 'ended') does NOT trigger
    // the auto-resume loop.
    userPaused = true;
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

// ── Service Worker Registration & Update Detection ─────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      // Check for updates every hour (avoids hammering the server on every page load)
      setInterval(() => reg.update(), 60 * 60 * 1000);

      // A new SW has been found and finished installing — it is now WAITING.
      // Do NOT activate it yet; instead show the update banner and let the user decide.
      function onUpdateFound() {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // There is a new version waiting — show the non-intrusive banner.
            showUpdateBanner(reg);
          }
        });
      }

      reg.addEventListener("updatefound", onUpdateFound);

      // If a new worker is already waiting when the page loads (e.g. user returned
      // to a tab that had been open during a deployment), show the banner immediately.
      if (reg.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner(reg);
      }
    }).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });

  // After the user clicks "Update Now" the new SW calls skipWaiting(), which
  // triggers controllerchange. At that point we do a clean page reload.
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

/**
 * Show an in-app "New version available" banner.
 * Only one instance can exist at a time.
 * @param {ServiceWorkerRegistration} reg
 */
function showUpdateBanner(reg) {
  // Don't create a second banner if one already exists
  if (document.getElementById("updateBanner")) return;

  const banner = document.createElement("div");
  banner.id = "updateBanner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `
    <div class="update-banner-inner">
      <span class="update-banner-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </span>
      <span class="update-banner-text">A new version is available.</span>
      <button id="updateNowBtn" class="update-banner-btn primary" type="button">Update now</button>
      <button id="updateLaterBtn" class="update-banner-btn secondary" type="button">Later</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Animate in after next frame
  requestAnimationFrame(() => banner.classList.add("is-visible"));

  document.getElementById("updateNowBtn").addEventListener("click", () => {
    banner.classList.remove("is-visible");
    // Tell the waiting service worker to skip waiting and take control.
    // The controllerchange listener above will then reload the page cleanly.
    const waitingWorker = reg.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  });

  document.getElementById("updateLaterBtn").addEventListener("click", () => {
    banner.classList.remove("is-visible");
    setTimeout(() => banner.remove(), 400);
  });
}

function updateQrCode() {
  const qrImage = document.getElementById("qrImage");
  const qrImageFull = document.getElementById("qrImageFull");
  const settingsQrImage = document.getElementById("settingsQrImage");

  // Use the canonical public URL, not window.location (avoids localhost in QR during dev)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(APP_URL)}`;
  
  if (qrImage) qrImage.src = qrUrl;
  if (qrImageFull) qrImageFull.src = qrUrl;
  if (settingsQrImage) settingsQrImage.src = qrUrl;
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

// ── Shared QR composition helper ─────────────────────────────────────────────
/**
 * Draws a composed QR image on a canvas:
 *   • white rounded-rect frame (padding around QR)
 *   • the QR code
 *   • the app logo centred over the QR quiet zone
 * Returns a Promise<Blob> (PNG).
 */
async function buildQrComposedCanvas(qrSrc) {
  const SIZE      = 400;   // output canvas size (px)
  const PADDING   = 24;    // white border around QR (px)
  const RADIUS    = 20;    // frame corner radius
  const LOGO_FRAC = 0.22;  // logo diameter as fraction of QR area

  // Load QR image
  const qrImg = await loadImage(qrSrc);

  // Load logo (same icon used in the overlay)
  const logoImg = await loadImage("icons/icon-512.png");

  const canvas  = document.createElement("canvas");
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx     = canvas.getContext("2d");

  // 1. White rounded frame
  const frameX = 0, frameY = 0, frameW = SIZE, frameH = SIZE;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(frameX, frameY, frameW, frameH, RADIUS);
  ctx.fill();

  // 2. QR code (inside the padding)
  const qrX = PADDING, qrY = PADDING;
  const qrW = SIZE - PADDING * 2, qrH = SIZE - PADDING * 2;
  ctx.drawImage(qrImg, qrX, qrY, qrW, qrH);

  // 3. Logo centred (white circle behind it first for contrast)
  const logoSize = qrW * LOGO_FRAC;
  const logoCX   = SIZE / 2;
  const logoCY   = SIZE / 2;
  const logoR    = logoSize / 2 + 4;   // slight white halo radius

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(
    logoImg,
    logoCX - logoSize / 2,
    logoCY - logoSize / 2,
    logoSize,
    logoSize
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("canvas toBlob failed")), "image/png")
  );
}

/** Load an image URL into an HTMLImageElement, resolves when loaded. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** Returns a local-time timestamp string for filenames: YYYY-MM-DD-HHMM */
function qrTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/** Copy composed QR canvas PNG to clipboard; falls back to copying the URL. */
async function handleQrCopy(qrImageEl) {
  try {
    const blob = await buildQrComposedCanvas(qrImageEl.src);
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    showToast("QR code image copied.");
  } catch (err) {
    console.error("QR image copy failed:", err);
    try {
      await navigator.clipboard.writeText(APP_URL);
      showToast("Could not copy image. App URL copied instead.");
    } catch (clipErr) {
      showToast("Could not copy QR code.");
    }
  }
}

/** Download composed QR canvas PNG with a timestamped filename. */
async function handleQrDownload(qrImageEl) {
  try {
    const blob    = await buildQrComposedCanvas(qrImageEl.src);
    const blobUrl = URL.createObjectURL(blob);
    const link    = document.createElement("a");
    link.href     = blobUrl;
    link.download = `just-play-it-qr-${qrTimestamp()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    showToast("QR code downloading...");
  } catch (err) {
    console.error("QR download failed:", err);
    showToast("Could not download QR code.");
  }
}

// ── Sidebar QR copy / download ────────────────────────────────────────────────
if (copyQrBtn) {
  copyQrBtn.addEventListener("click", () => {
    const img = document.getElementById("qrImage");
    handleQrCopy(img);
  });
}

if (downloadQrBtn) {
  downloadQrBtn.addEventListener("click", () => {
    const img = document.getElementById("qrImage");
    handleQrDownload(img);
  });
}

// ── Settings Share section wiring ─────────────────────────────────────────────
const settingsShareAppBtn = document.getElementById("settingsShareAppBtn");
if (settingsShareAppBtn) settingsShareAppBtn.addEventListener("click", handleShare);

const settingsQrWrapper = document.getElementById("settingsQrWrapper");
if (settingsQrWrapper && qrFullscreen) {
  settingsQrWrapper.addEventListener("click", () => {
    qrFullscreen.classList.add("is-open");
    qrFullscreen.setAttribute("aria-hidden", "false");
  });
}

const settingsCopyQrBtn = document.getElementById("settingsCopyQrBtn");
if (settingsCopyQrBtn) {
  settingsCopyQrBtn.addEventListener("click", () => {
    const img = document.getElementById("settingsQrImage");
    handleQrCopy(img);
  });
}

const settingsDownloadQrBtn = document.getElementById("settingsDownloadQrBtn");
if (settingsDownloadQrBtn) {
  settingsDownloadQrBtn.addEventListener("click", () => {
    const img = document.getElementById("settingsQrImage");
    handleQrDownload(img);
  });
}

function updateBuildInfo() {
  // BUILD_LABEL is defined in js/version.js — the single source of truth.
  const label = typeof BUILD_LABEL !== "undefined" ? BUILD_LABEL : "—";
  const mainInfo = document.getElementById("mainBuildInfo");
  if (mainInfo) mainInfo.innerHTML = label;
}

async function initApp() {
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
  
  // ── Handle Shared Files from Android share_target ──
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("shared") && urlParams.get("shared") === "true") {
    try {
      const cache = await caches.open("shared-files-temp");
      const requests = await cache.keys();
      const files = [];

      for (const req of requests) {
        // Use endsWith locally to check for our temporary file prefix
        if (req.url.includes("shared-temp/")) {
          const resp = await cache.match(req);
          if (resp) {
            const blob = await resp.blob();
            const fileName = decodeURIComponent(resp.headers.get("X-File-Name") || "shared-audio");
            const file = new File([blob], fileName, { type: resp.headers.get("X-File-Type") || "audio/*" });
            files.push(file);
            await cache.delete(req);
          }
        }
      }

      if (files.length > 0) {
        await addFileTracks(files);
        showToast(`Imported ${files.length} shared file${files.length !== 1 ? "s" : ""}.`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error("Failed to retrieve shared files from cache:", err);
    }
  }

  // Restore previously selected playlist key
  const restoredKey = localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist);
  if (restoredKey && savedPlaylists[restoredKey]) {
    selectedPlaylistKey = restoredKey;
  }
  
  loadPlaylistFromStorage();
  restoreSleepTimer();
  renderPlaylist();
  updatePlayPauseButton();
  
  // Initial check: determine if we are already hydrated or need to seed
  console.log(`[Init] Startup state - Workspace size: ${playlist.length}, Index: ${currentTrackIndex}`);
  
  updateNowPlaying(playlist[currentTrackIndex] || null);
  setupMediaSessionActions();
  await renderSidebarLibrary();

  // ── Unified Toggle Function ──
  window.toggleSection = (headerId, containerId, textId, iconId, forceExpand = false) => {
    const header = typeof headerId === 'string' ? document.getElementById(headerId) : headerId;
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    const textEl = document.getElementById(textId);
    const iconEl = document.getElementById(iconId);

    if (!header || !container) {
      console.warn("Toggle failed: missing header or container", { headerId, containerId });
      return;
    }

    let targetVisible;
    if (forceExpand) {
      targetVisible = true;
      container.classList.remove("collapsed");
    } else {
      const isVisible = !container.classList.contains("collapsed");
      targetVisible = !isVisible;
      container.classList.toggle("collapsed");
    }

    header.setAttribute("aria-expanded", targetVisible);
    
    if (textEl) {
      textEl.textContent = targetVisible ? "Hide" : "Show";
    } else if (header.tagName === "BUTTON") {
      header.textContent = targetVisible ? "Hide" : "Show";
    }

    if (iconEl) iconEl.style.transform = targetVisible ? "rotate(180deg)" : "";
  };

  // ── Unified Toggle Handling ──
  const wireUpToggle = (headerId, containerId, textId, iconId) => {
    const hdr = document.getElementById(headerId);
    if (!hdr) return;
    hdr.addEventListener("click", () => toggleSection(headerId, containerId, textId, iconId));
    hdr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        hdr.click();
      }
    });
  };

  wireUpToggle("currentPlaylistHeaderBtn", "currentPlaylistCard", "playlistCollapseText", "playlistCollapseIcon");
  wireUpToggle("libraryHeader", "libraryContainer", "libraryCollapseText", "libraryCollapseIcon");
  wireUpToggle("settingsSupportHeaderBtn", "settingsSupportContainer", null, null);
  wireUpToggle("settingsShareHeaderBtn", "settingsShareContainer", null, null);

  const addLibraryBtn = document.getElementById("addLibraryToPlaylistBtn");
  if (addLibraryBtn) {
    addLibraryBtn.addEventListener("click", addSelectedToPlaylist);
  }

  // ── Populate Default Playlist Select ──
  const defSelect = document.getElementById("defaultPlaylistSelect");
  if (defSelect) {
    const sortedNames = Object.keys(savedPlaylists).sort();
    sortedNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      defSelect.appendChild(opt);
    });
    
    const savedDefault = localStorage.getItem(STORAGE_KEYS.defaultPlaylist);
    if (savedDefault) defSelect.value = savedDefault;

    defSelect.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEYS.defaultPlaylist, defSelect.value);
      showToast(defSelect.value ? `Default: ${defSelect.value}` : "Auto-load disabled.");
    });
  }

  // Final count update before view switches
  await updateBadgeCounts();
  updateQrCode();
  updateBuildInfo();

  if (currentTrackIndex >= 0 && playlist.length > 0) {
    console.log("[Init] Restoring active track:", currentTrackIndex);
    await loadTrack(currentTrackIndex, false);
  } else if (playlist.length === 0) {
    // Priority for startup:
    // 1. User's saved Default Playlist
    // 2. "Remember the Lord" (App default)
    // 3. All Library files (fallback)
    
    const userDefault = localStorage.getItem(STORAGE_KEYS.defaultPlaylist);
    const starterName = (userDefault && savedPlaylists[userDefault]) ? userDefault : "Remember the Lord";

    console.log(`[Init] Workspace empty. Attempting to seed with "${starterName}"`);

    if (savedPlaylists[starterName]) {
      selectedPlaylistKey = starterName;
      await loadNamedPlaylist(); // This will call updateBadgeCounts and updateNowPlaying correctly
    } else {
      console.log("[Init] No starter playlist found. Checking device library as fallback.");
      const records = db ? await getAllTrackMetadata() : [];
      if (records.length > 0) {
        playlist = records.map(r => ({
          id: r.id,
          title: r.title,
          sourceType: "file"
        }));
        currentTrackIndex = 0;
        await loadTrack(0, false);
        renderPlaylist();
      } else {
        console.log("[Init] System truly empty. Landing page will remain in 'Nothing loaded yet' state.");
      }
    }
  }

  // ── Set Initial View ──
  // Do this after startup logic but before UI jumps
  switchView("view-player");

  // Header text/badge jumps
  const nowPlayingPlaylistInfo = document.getElementById("nowPlayingPlaylistInfo");
  
  if (nowPlayingPlaylistInfo) {
    nowPlayingPlaylistInfo.addEventListener("click", (e) => {
      e.stopPropagation();

      // Signal switchView to NOT auto-collapse the queue on this navigation
      expandQueueForJumpNavigation = true;

      // 1. Switch to the Playlist tab
      switchView("view-playlists");

      // 2. Expand Current Queue if it is collapsed
      const queueCard = document.getElementById("currentPlaylistCard");
      const queueBtn  = document.getElementById("currentPlaylistHeaderBtn");
      if (queueCard && queueCard.classList.contains("collapsed")) {
        toggleSection("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon", true);
      }
      if (queueBtn) {
        queueBtn.setAttribute("aria-expanded", "true");
        queueBtn.textContent = "Hide";
      }

      // 3. Reuse the same scroll logic as "Jump to Current" button
      setTimeout(jumpToCurrentTrack, 120);
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
      toggleSection("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon", true);

      if (currentPlaylistHeaderBtn) {
        // Bring the Current Playlist label to the very top
        currentPlaylistHeaderBtn.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (playlistEl) {
        playlistEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

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

  // Playback watchdog — detects ghost play state
  let _lastWatchTime = null;
  let _watchStallCount = 0;

  setInterval(() => {
    if (audio.paused || audio.ended || userPaused || isTransitioning) {
      _lastWatchTime = null;
      _watchStallCount = 0;
      return;
    }
    if (_lastWatchTime === null) {
      _lastWatchTime = audio.currentTime;
      return;
    }
    if (audio.currentTime === _lastWatchTime) {
      _watchStallCount++;
      if (_watchStallCount >= 2) {
        // Audio says playing but hasn't moved for ~4s — force UI reset
        console.warn("Playback watchdog: stall detected, resetting UI");
        updatePlayPauseButton(); // forces re-read of audio.paused, spinning syncs to state
        if (_watchStallCount >= 4) {
          // After ~8s stall, attempt full recovery
          setPlayerStatus("Playback stalled. Attempting recovery...");
          loadTrack(currentTrackIndex, true).catch(() => {
            setPlayerStatus("Playback stalled. Press Play to retry.");
          });
          _watchStallCount = 0;
        }
      }
    } else {
      _lastWatchTime = audio.currentTime;
      _watchStallCount = 0;
    }
  }, 2000);
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

// ── Entry Point & Crash Protection ─────────────────────────
// Immediate 5-second safety valve: if ANYTHING hangs, clear splash anyway
setTimeout(() => {
  const splash = document.getElementById("splashScreen");
  if (splash && !splash.classList.contains("fade-out")) {
    console.warn("Safety valve: clearing splash screen after 5s hang.");
    splash.classList.add("fade-out");
  }
}, 5000);

initApp().then(() => {
  console.log("Application initialized successfully.");
  
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
}).catch((error) => {
  console.error("CRITICAL: Application failed to start:", error);
  const splash = document.getElementById("splashScreen");
  if (splash) splash.classList.add("fade-out");
  addErrorLog(`Critical Start Fail: ${error.stack || error.message || error}`, "System");
});
