// ── Canonical public app URL (used for sharing and QR generation) ─────────────
const APP_URL = "https://just-play-it.pages.dev/";

// State for Android sleep/lock recovery
window.recoveryState = {
  incompleteAutoAdvance: false,
  hiddenEarlyPause: false,
  // Tracks the most recent hidden auto-advance that successfully called audio.play().
  // Used on wake to detect Android's silent-pause pattern without relying on the
  // pause event firing (which Android Chrome can suppress while backgrounded).
  hiddenAutoAdvance: null,
  // { trackIndex, startedAt (ms), playSucceeded }
};

document.addEventListener("visibilitychange", () => {
  const dur = Number.isFinite(audio.duration) ? audio.duration.toFixed(2) : "N/A";
  const ct  = audio.currentTime.toFixed(2);

  if (typeof addErrorLog === "function") {
    addErrorLog(
      `[Visibility] state: ${document.hidden ? "hidden" : "visible"} | ` +
      `currentTime: ${ct} | duration: ${dur} | ` +
      `paused: ${audio.paused} | ended: ${audio.ended} | ` +
      `index: ${currentTrackIndex} | repeat: ${repeatMode} | shuffle: ${shuffleEnabled}`,
      "Visibility"
    );
  }

  if (!document.hidden) {
    // ── Wake-side diagnosis ──────────────────────────────────────────────────
    // Priority 1: Incomplete auto-advance (handoff failed while hidden)
    if (window.recoveryState.incompleteAutoAdvance) {
      if (typeof addErrorLog === "function") {
        addErrorLog("[Visibility] resuming flagged incomplete auto-advance on wake", "Recovery");
      }
      window.recoveryState.incompleteAutoAdvance = false;
      if (audio.paused && (shuffleEnabled || repeatMode === "all" || currentTrackIndex < playlist.length - 1)) {
        playNext({ reason: "visibility-resume" }).catch(e => console.error(e));
      }
      return;
    }

    // Priority 2: Android silent-pause detection.
    // Android Chrome can pause a newly started hidden track without reliably
    // firing the pause event — so hiddenEarlyPause may never have been set.
    // We detect this pattern directly on wake using the hiddenAutoAdvance record.
    const haa = window.recoveryState.hiddenAutoAdvance;
    if (
      haa &&
      haa.playSucceeded &&
      haa.trackIndex === currentTrackIndex &&
      audio.paused &&
      !audio.ended &&
      !userPaused &&
      audio.currentTime < 5
    ) {
      const elapsedSec = (Date.now() - haa.startedAt) / 1000;
      if (typeof addErrorLog === "function") {
        addErrorLog(
          `[BackgroundPause] wake found hidden-started track paused near start. ` +
          `index: ${haa.trackIndex} | currentTime: ${ct} | ` +
          `elapsedSincStart: ${elapsedSec.toFixed(1)}s | ` +
          `duration: ${dur} | userPaused: ${userPaused}`,
          "BackgroundPause"
        );
      }
      // Clear the record regardless so we don't retry on next wake
      window.recoveryState.hiddenAutoAdvance = null;
      window.recoveryState.hiddenEarlyPause  = false;

      if (typeof addErrorLog === "function") {
        addErrorLog("[Recovery] guarded wake resume attempted (android silent-pause)", "Recovery");
      }
      audio.play().then(() => {
        if (typeof addErrorLog === "function") {
          addErrorLog("[Recovery] guarded wake resume succeeded", "Recovery");
        }
      }).catch(e => {
        console.warn("[Recovery] guarded wake resume failed:", e);
        if (typeof addErrorLog === "function") {
          addErrorLog(
            `[Recovery] guarded wake resume failed (${e.name}: ${e.message}) → fallback recovery`,
            "Recovery"
          );
        }
        if (typeof recoverFromPlaybackStall === "function") {
          recoverFromPlaybackStall("wake-android-silent-pause");
        }
      });
      return;
    }

    // Priority 3: hiddenEarlyPause flag — set by the pause event handler when
    // Android DID fire the pause event while hidden.
    if (window.recoveryState.hiddenEarlyPause) {
      if (typeof addErrorLog === "function") {
        addErrorLog("[Visibility] wake detected a hidden early-pause flag. Evaluating recovery.", "Recovery");
      }
      window.recoveryState.hiddenEarlyPause  = false;
      window.recoveryState.hiddenAutoAdvance = null;
      if (audio.paused && audio.currentTime >= 0 && audio.currentTime < 15 && !userPaused) {
        if (typeof addErrorLog === "function") {
          addErrorLog("[Recovery] attempting guarded resume of stranded early-paused track.", "Recovery");
        }
        audio.play().catch(e => {
          console.warn("Wake resume of early pause failed:", e);
          if (typeof addErrorLog === "function") {
            addErrorLog(
              `[Recovery] wake resume of early pause natively failed: ${e.message}. Launching full load-resume.`,
              "Recovery"
            );
          }
          if (typeof recoverFromPlaybackStall === "function") {
            recoverFromPlaybackStall("wake-early-pause-recovery");
          }
        });
      } else {
        if (typeof addErrorLog === "function") {
          addErrorLog("[Recovery] dismissing hidden early-pause flag (audio advanced or user paused).", "Recovery");
        }
      }
      return;
    }

    // Priority 4: Stranded at track end (ended / near-end while hidden)
    if (
      audio.paused &&
      (audio.ended ||
        (Number.isFinite(audio.duration) && audio.duration > 0 &&
          Math.abs(audio.duration - audio.currentTime) < 0.5))
    ) {
      const canAdvance =
        shuffleEnabled || repeatMode === "all" || currentTrackIndex < playlist.length - 1;
      if (canAdvance) {
        if (typeof addErrorLog === "function") {
          addErrorLog("[Visibility] detected stranded playback at track end. Executing wake-recovery.", "Recovery");
        }
        playNext({ reason: "visibility-resume" }).catch(e => console.error(e));
        return;
      } else if (repeatMode === "one") {
        if (typeof addErrorLog === "function") {
          addErrorLog("[Visibility] detected stranded playback for repeat-one. Replaying.", "Recovery");
        }
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Wake repeat-one replay failed", e));
        return;
      }
    }

    // No recovery needed — clear the hidden auto-advance record on clean wake
    if (window.recoveryState.hiddenAutoAdvance) {
      if (typeof addErrorLog === "function") {
        addErrorLog(
          `[Visibility] clean wake — cleared hiddenAutoAdvance record (track was playing fine)`,
          "Visibility"
        );
      }
      window.recoveryState.hiddenAutoAdvance = null;
    }
  }
});

fileInput.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  await addFileTracks(files);
  fileInput.value = "";
});

coverArtEl.addEventListener("click", () => {
  if (coverArtEl.classList.contains("cover-art-load")) {
    fileInput.click();
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
skipBackBtn.addEventListener("click", () => skipSeconds(-15));
skipForwardBtn.addEventListener("click", () => skipSeconds(15));

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

let expandQueueForJumpNavigation = false;

function switchView(targetViewId) {
  const sheet = document.getElementById("importBottomSheet");
  if (sheet && sheet.classList.contains("is-open")) {
    closeImportSheet();
  }

  document.querySelectorAll(".view-section").forEach(view => {
    if (view.id === targetViewId) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  const importFab = document.getElementById("importFab");
  if (importFab) {
    if (targetViewId === "view-library") {
      importFab.classList.remove("hidden");
    } else {
      importFab.classList.add("hidden");
    }
  }

  const cab = document.getElementById("selectionActionBar");
  if (cab) {
    if (targetViewId === "view-library" && selectedLibraryTracks.size > 0) {
      cab.classList.remove("hidden");
    } else {
      cab.classList.add("hidden");
    }
  }

  if (targetViewId === "view-playlists") {
    expandQueueForJumpNavigation = false;
  }

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

const brandWrap = document.querySelector(".brand-wrap");
if (brandWrap) {
  brandWrap.style.cursor = "pointer";
  brandWrap.addEventListener("click", () => {
    switchView("view-player");
  });
}

const importFab = document.getElementById("importFab");
const importBottomSheet = document.getElementById("importBottomSheet");
const fabOverlay = document.getElementById("fabOverlay");
const fabCancel = document.getElementById("fabCancel");
const fabPickFiles = document.getElementById("fabPickFiles");

function openImportSheet() {
  importBottomSheet.classList.remove("hidden");
  fabOverlay.classList.remove("hidden");
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

if (folderInput) {
  folderInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files).filter(isAudioFile);
    if (files.length === 0) {
      showToast("No audio files found in that folder.");
    } else {
      await addFileTracks(files);

      if (currentPlaylistName && savedPlaylists[currentPlaylistName] && !savedPlaylists[currentPlaylistName].isBuiltin) {
        console.log(`[FolderImport] Auto-saving to active playlist: "${currentPlaylistName}"`);
        updateActivePlaylist();
      }
    }
    closeImportSheet();
    folderInput.value = "";
  });
}

savePlaylistBtn.addEventListener("click", saveNamedPlaylist);
if (updatePlaylistBtn) updatePlaylistBtn.addEventListener("click", updateActivePlaylist);

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

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);

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

// ── Scrubbing state ────────────────────────────────────────────────────────
// isScrubbing = true while the user is actively pressing/dragging the seek
// handle. When true, the timeupdate handler must NOT overwrite seekBar.value,
// otherwise it snaps the thumb back to the actual playback position.
let isScrubbing = false;

audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);

  // Only update the bar position from audio when the user is NOT dragging it.
  if (!isScrubbing) {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seekBar.value = (audio.currentTime / audio.duration) * 100;
    } else {
      seekBar.value = 0;
    }
  }

  clearPlaybackStallRecoveryTimer();
  savePlaybackState();
});

// ── Seek bar scrubbing ──────────────────────────────────────────────────────
// Strategy: let the NATIVE range element handle all thumb tracking (it does
// this correctly for mouse and touch). We only need to:
//   1. Set isScrubbing = true on pointerdown so timeupdate stops fighting us.
//   2. Update the currentTime display label live during the drag (input event).
//   3. Commit audio.currentTime on pointerup / pointercancel.
//
// Critical: do NOT call seekBar.setPointerCapture() — that breaks the
// browser's internal range-thumb drag machinery and freezes the thumb.

function onSeekBarPointerDown() {
  isScrubbing = true;
}

function onSeekBarInput() {
  // Fires continuously as the thumb moves (native range behaviour).
  // Update the displayed time label in real-time while dragging.
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    currentTimeEl.textContent = formatTime((Number(seekBar.value) / 100) * audio.duration);
  }
  // Also seek immediately for click-on-bar (single tap, no drag).
  // When isScrubbing is true from a drag this is a preview; the
  // pointerup handler will also fire and commits the same value — harmless.
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const seekTo = (Number(seekBar.value) / 100) * audio.duration;
  audio.currentTime = seekTo;
}

function onSeekBarPointerUp() {
  if (!isScrubbing) return;
  isScrubbing = false;
  // Commit any final drag position that input may not have caught.
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const seekTo = (Number(seekBar.value) / 100) * audio.duration;
  audio.currentTime = seekTo;
}

seekBar.addEventListener("pointerdown",  onSeekBarPointerDown);
seekBar.addEventListener("input",        onSeekBarInput);
seekBar.addEventListener("pointerup",    onSeekBarPointerUp);
seekBar.addEventListener("pointercancel", onSeekBarPointerUp); // finger lifted abruptly

if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    audio.volume = Number(volumeSlider.value);
    saveVolume();
  });
}

if (sleepTimerBtn) {
  sleepTimerBtn.addEventListener("click", () => {
    let current = sleepTimerMinutes || 0;
    let next = 0;
    if (current === 0)  next = 15;
    else if (current === 15) next = 30;
    else if (current === 30) next = 60;
    else next = 0;

    setSleepTimer(next);
  });
}

audio.addEventListener("play", () => {
  clearPlaybackStallRecoveryTimer();
  updatePlayPauseButton();
  updateMediaSession();

  if (document.hidden) {
    if (typeof addErrorLog === "function") {
      addErrorLog(
        `[PlaybackFlow] audio.play() succeeded while hidden | ` +
        `index: ${currentTrackIndex} | currentTime: ${audio.currentTime.toFixed(2)}`,
        "BackgroundPause"
      );
    }
    // Reset early-pause flag; the hiddenAutoAdvance record is written by
    // playNext (after loadTrack returns true) — not here — so we don't
    // overwrite it from a mid-track resume.
    if (window.recoveryState) window.recoveryState.hiddenEarlyPause = false;
  }

  if (playlist[currentTrackIndex]) {
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  }
});

audio.addEventListener("playing", () => {
  clearPlaybackStallRecoveryTimer();
  schedulePreloadUpcomingTrack();
});

audio.addEventListener("pause", () => {
  clearPlaybackStallRecoveryTimer();
  updatePlayPauseButton();
  updateMediaSession();

  if (isTransitioning) {
    resumeRetries = 0;
    return;
  }

  if (document.hidden && !userPaused && Number.isFinite(audio.currentTime) && audio.currentTime >= 0 && audio.currentTime < 15) {
    if (typeof addErrorLog === "function") {
      addErrorLog(
        `[BackgroundPause] pause event fired while hidden, early in track. ` +
        `currentTime: ${audio.currentTime.toFixed(2)}s — flagging for wake-recovery.`,
        "BackgroundPause"
      );
    }
    if (window.recoveryState) window.recoveryState.hiddenEarlyPause = true;

    const haa = window.recoveryState ? window.recoveryState.hiddenAutoAdvance : null;
    if (
      haa &&
      haa.playSucceeded &&
      haa.trackIndex === currentTrackIndex &&
      audio.currentTime < 2.0 &&
      !audio.ended &&
      audio.src &&
      !haa.hiddenResumeAttempted
    ) {
      haa.hiddenResumeAttempted = true;
      
      if (typeof addErrorLog === "function") {
        addErrorLog(`[Recovery] hidden early-pause detected. hidden guarded resume attempted`, "Recovery");
      }

      audio.play().then(() => {
        if (typeof addErrorLog === "function") {
          addErrorLog(`[Recovery] hidden guarded resume succeeded`, "Recovery");
        }
        if (window.recoveryState) window.recoveryState.hiddenEarlyPause = false;
      }).catch(e => {
        console.warn("Hidden guarded resume failed:", e);
        if (typeof addErrorLog === "function") {
          addErrorLog(`[Recovery] hidden guarded resume failed: ${e.name} - ${e.message}`, "Recovery");
        }
      });
      return;
    }

    // Do not run the 3-retry watchdog — this is an OS background throttle.
    // Wake-side logic will handle recovery.
    return;
  }

  const isNearEnd = audio.duration > 0 && (audio.duration - audio.currentTime < 1.0);

  if (!userPaused && !audio.ended && !isNearEnd && resumeRetries < 3) {
    resumeRetries++;
    setPlayerStatus(`Playback interrupted. Resuming... (Retry ${resumeRetries}/3)`);

    setTimeout(async () => {
      if (
        !userPaused &&
        !audio.ended &&
        !isTransitioning &&
        audio.src &&
        playlist[currentTrackIndex]
      ) {
        try {
          await audio.play();
          resumeRetries = 0;
        } catch (err) {
          console.warn(`Auto-resume retry ${resumeRetries} blocked:`, err);
          if (resumeRetries >= 3) {
            armPlaybackStallRecovery("pause-resume");
            setPlayerStatus("Playback stalled. Attempting recovery...");
          }
        }
      }
    }, 2000);
  } else if (!userPaused && audio.ended) {
  } else if (audio.currentTime > 0 && !audio.ended && !isTransitioning) {
    setPlayerStatus("Playback paused.");
    resumeRetries = 0;
  }
});

audio.addEventListener("error", (e) => {
  clearPlaybackStallRecoveryTimer();
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
  resumeRetries = 0;

  const canAdvance = !userPaused && (shuffleEnabled || repeatMode === "all" || currentTrackIndex < playlist.length - 1);
  if (canAdvance) {
    setTimeout(() => {
      playNext({ reason: "audio-error" }).catch((error) => {
        console.error("Could not skip after audio error:", error);
      });
    }, 250);
  }
});

audio.addEventListener("stalled", () => {
  if (!audio.paused && !audio.ended) {
    if (typeof addErrorLog === "function") {
        addErrorLog(`[PlaybackFlow] stalled/buffering at ${audio.currentTime.toFixed(2)}s (hidden: ${document.hidden})`, "AudioStatus");
    }
    if (document.hidden && audio.currentTime < 15) {
        if (typeof addErrorLog === "function") addErrorLog(`[BackgroundPause] stalled shortly after hidden start.`, "BackgroundPause");
    }
    setPlayerStatus("Buffering/Stalled...");
    armPlaybackStallRecovery("stalled");
  }
});

audio.addEventListener("waiting", () => {
  if (!audio.paused && !audio.ended) {
    if (typeof addErrorLog === "function") {
        addErrorLog(`[PlaybackFlow] waiting at ${audio.currentTime.toFixed(2)}s (hidden: ${document.hidden})`, "AudioStatus");
    }
    if (document.hidden && audio.currentTime < 15) {
        if (typeof addErrorLog === "function") addErrorLog(`[BackgroundPause] waiting shortly after hidden start.`, "BackgroundPause");
    }
    setPlayerStatus("Waiting for audio...");
    armPlaybackStallRecovery("waiting");
  }
});

audio.addEventListener("ended", async () => {
  addErrorLog(`[PlaybackFlow] ended event fired. hidden: ${document.hidden}`, "PlaybackFlow");
  clearPlaybackStallRecoveryTimer();
  resumeRetries = 0;
  pendingRestoreTime = null;
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  if (repeatMode === "one") {
    audio.currentTime = 0;
    addErrorLog(`[PlaybackFlow] Replaying due to repeatMode: one`, "PlaybackFlow");
    audio.play().catch((error) => console.error("Replay failed:", error));
    return;
  }

  if (
    !shuffleEnabled &&
    repeatMode === "off" &&
    currentTrackIndex === playlist.length - 1
  ) {
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
    console.log(
      `[ended] Auto-advance — repeatMode: ${repeatMode}, ` +
      `shuffle: ${shuffleEnabled}, index: ${currentTrackIndex}/${playlist.length - 1}`
    );
    try {
      addErrorLog(`[PlaybackFlow] triggering playNext reason: auto-advance`, "PlaybackFlow");
      const advanced = await playNext({ reason: "auto-advance" });
      if (!advanced) {
        if (window.recoveryState && window.recoveryState.incompleteAutoAdvance) {
            addErrorLog("[AutoAdvance] paused candidate evaluation due to sleep/background. Will resume on wake.", "AutoAdvance");
        } else {
            addErrorLog("Auto-advance exhausted the queue without starting playback.", "AutoAdvance");
            setPlayerStatus("Auto-advance stalled. Tap ▶ to continue.");
        }
      }
    } catch (error) {
      const msg = `Auto-advance failed: ${error?.name} — ${error?.message}`;
      console.error("[ended]", msg, error);
      addErrorLog(msg, "AutoAdvance");
      if (!window.recoveryState || !window.recoveryState.incompleteAutoAdvance) {
         setPlayerStatus("Auto-advance failed. Tap ▶ to continue.");
      }
    }
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
  clearPreloadedTrackSource();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      setInterval(() => reg.update(), 60 * 60 * 1000);

      function onUpdateFound() {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      }

      reg.addEventListener("updatefound", onUpdateFound);

      if (reg.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner(reg);
      }
    }).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

function showUpdateBanner(reg) {
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

  requestAnimationFrame(() => banner.classList.add("is-visible"));

  document.getElementById("updateNowBtn").addEventListener("click", () => {
    banner.classList.remove("is-visible");
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

async function buildQrComposedCanvas(qrSrc) {
  const SIZE      = 400;
  const PADDING   = 24;
  const RADIUS    = 20;
  const LOGO_FRAC = 0.22;

  const qrImg = await loadImage(qrSrc);
  const logoImg = await loadImage("icons/icon-512.png");

  const canvas  = document.createElement("canvas");
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx     = canvas.getContext("2d");

  const frameX = 0, frameY = 0, frameW = SIZE, frameH = SIZE;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(frameX, frameY, frameW, frameH, RADIUS);
  ctx.fill();

  const qrX = PADDING, qrY = PADDING;
  const qrW = SIZE - PADDING * 2, qrH = SIZE - PADDING * 2;
  ctx.drawImage(qrImg, qrX, qrY, qrW, qrH);

  const logoSize = qrW * LOGO_FRAC;
  const logoCX   = SIZE / 2;
  const logoCY   = SIZE / 2;
  const logoR    = logoSize / 2 + 4;

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function qrTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

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
  const label = typeof BUILD_LABEL !== "undefined" ? BUILD_LABEL : "—";
  const mainInfo = document.getElementById("mainBuildInfo");
  if (mainInfo) mainInfo.innerHTML = label;
}

async function initApp() {
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

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("shared") && urlParams.get("shared") === "true") {
    try {
      const cache = await caches.open("shared-files-temp");
      const requests = await cache.keys();
      const files = [];

      for (const req of requests) {
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
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error("Failed to retrieve shared files from cache:", err);
    }
  }

  const restoredKey = localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist);
  if (restoredKey && savedPlaylists[restoredKey]) {
    selectedPlaylistKey = restoredKey;
  }

  // ── Startup precedence ───────────────────────────────────────────────────
  // Priority order:
  //   1. Explicit valid default  → load it immediately into the Player.
  //   2. No default (or stale)   → set "Na's Songs Plus" as default if it
  //                                exists, then load it.
  //   3. No valid playlist at all → fall back to workspace restore or empty.

  const FALLBACK_DEFAULT = "Na's Songs Plus";

  let defaultPlaylistName = localStorage.getItem(STORAGE_KEYS.defaultPlaylist);
  let defaultIsValid      = !!(defaultPlaylistName && savedPlaylists[defaultPlaylistName]);

  if (defaultPlaylistName && !defaultIsValid) {
    // Saved default points to a missing playlist — clear it and log
    console.warn(`[Init] Default playlist "${defaultPlaylistName}" not found. Recovering.`);
    localStorage.removeItem(STORAGE_KEYS.defaultPlaylist);
    defaultPlaylistName = null;
  }

  if (!defaultPlaylistName) {
    // No valid default set — try to auto-set the fallback
    if (savedPlaylists[FALLBACK_DEFAULT]) {
      defaultPlaylistName = FALLBACK_DEFAULT;
      localStorage.setItem(STORAGE_KEYS.defaultPlaylist, FALLBACK_DEFAULT);
      defaultIsValid = true;
      console.log(`[Init] No default set. Auto-selected fallback default: "${FALLBACK_DEFAULT}".`);
    }
  }

  if (defaultIsValid && defaultPlaylistName) {
    // ── Path A: Load the chosen default ────────────────────────────────────
    console.log(`[Init] Loading default playlist on startup: "${defaultPlaylistName}".`);
    selectedPlaylistKey = defaultPlaylistName;
    await loadNamedPlaylist();

    restoreSleepTimer();
    setupMediaSessionActions();
    await renderSidebarLibrary();
  } else {
    // ── Path B: No default available — normal workspace restore ─────────────
    loadPlaylistFromStorage();
    renderPlaylist();
    updatePlayPauseButton();
    refreshUpdateRow();

    console.log(`[Init] Startup state — Workspace: ${playlist.length} tracks, Index: ${currentTrackIndex}`);
    updateNowPlaying(playlist[currentTrackIndex] || null);
    restoreSleepTimer();
    setupMediaSessionActions();
    await renderSidebarLibrary();

    if (currentTrackIndex >= 0 && playlist.length > 0) {
      console.log("[Init] Restoring active track:", currentTrackIndex);
      await loadTrack(currentTrackIndex, false, { reason: "init-restore" });
    } else if (playlist.length === 0) {
      // Try device library as last resort
      console.log("[Init] Workspace empty. Checking device library as fallback.");
      const records = db ? await getAllTrackMetadata() : [];
      if (records.length > 0) {
        playlist = records.map(r => ({ id: r.id, title: r.title, sourceType: "file" }));
        currentTrackIndex = 0;
        await loadTrack(0, false, { reason: "init-fallback" });
        renderPlaylist();
      } else {
        console.log("[Init] System empty. No playlist available.");
      }
    }
  }

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

  await updateBadgeCounts();
  updateQrCode();
  updateBuildInfo();


  switchView("view-player");

  const nowPlayingPlaylistInfo = document.getElementById("nowPlayingPlaylistInfo");

  if (nowPlayingPlaylistInfo) {
    nowPlayingPlaylistInfo.addEventListener("click", (e) => {
      e.stopPropagation();

      expandQueueForJumpNavigation = true;
      switchView("view-playlists");

      const queueCard = document.getElementById("currentPlaylistCard");
      const queueBtn  = document.getElementById("currentPlaylistHeaderBtn");
      if (queueCard && queueCard.classList.contains("collapsed")) {
        toggleSection("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon", true);
      }
      if (queueBtn) {
        queueBtn.setAttribute("aria-expanded", "true");
        queueBtn.textContent = "Hide";
      }

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
      toggleSection("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon", true);

      if (currentPlaylistHeaderBtn) {
        currentPlaylistHeaderBtn.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (playlistEl) {
        playlistEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ── Wire the GO TO QUEUE NOW button in the unsaved queue modal ─────────────
  const goToQueueBtn = document.getElementById("unsavedWarningGoToQueueBtn");
  if (goToQueueBtn) {
    goToQueueBtn.addEventListener("click", () => {
      // Dismiss the modal
      const modal = document.getElementById("unsavedQueueWarning");
      const scrim = document.getElementById("unsavedQueueScrim");
      if (modal) modal.classList.add("hidden");
      if (scrim) scrim.classList.add("hidden");

      // Switch to playlist tab
      switchView("view-playlists");

      // Expand CURRENT QUEUE
      const queueCard = document.getElementById("currentPlaylistCard");
      const queueBtn2 = document.getElementById("currentPlaylistHeaderBtn");
      if (queueCard && queueCard.classList.contains("collapsed")) {
        toggleSection("currentPlaylistHeaderBtn", "playlistContainer", "playlistCollapseText", "playlistCollapseIcon", true);
      }
      if (queueBtn2) {
        queueBtn2.setAttribute("aria-expanded", "true");
        queueBtn2.textContent = "Hide";
      }

      // Scroll to queue header
      setTimeout(() => {
        const queueHeader = document.getElementById("sidebar-section-queue");
        if (queueHeader) queueHeader.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  }

  try {
    const splash = document.getElementById("splashScreen");
    if (splash) {
      setTimeout(() => {
        splash.classList.add("fade-out");
      }, 4000);
    }
  } catch (err) {
    console.warn("Splash screen fade failed:", err);
  }

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
        console.warn("Playback watchdog: stall detected, resetting UI");
        updatePlayPauseButton();
        armPlaybackStallRecovery("watchdog");
        if (_watchStallCount >= 4) {
          setPlayerStatus("Playback stalled. Attempting recovery...");
          recoverFromPlaybackStall("watchdog-hard").catch(() => {
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

setTimeout(() => {
  const splash = document.getElementById("splashScreen");
  if (splash && !splash.classList.contains("fade-out")) {
    console.warn("Safety valve: clearing splash screen after 5s hang.");
    splash.classList.add("fade-out");
  }
}, 5000);

initApp().then(() => {
  console.log("Application initialized successfully.");

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
