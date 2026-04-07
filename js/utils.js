// ── Error Logging ─────────────────────────────────────
function addErrorLog(message, type = "General") {
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.errorLogs) || "[]");
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      version: typeof APP_VERSION !== "undefined" ? APP_VERSION : "unknown",
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    logs.unshift(entry); // Newest first
    if (logs.length > 50) logs.pop(); // Keep last 50
    localStorage.setItem(STORAGE_KEYS.errorLogs, JSON.stringify(logs));
    console.log(`[ErrorLog] [${type}] ${message}`);
  } catch (e) {
    console.warn("Failed to save error log", e);
  }
}

function showErrorLog() {
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.errorLogs) || "[]");
  if (logs.length === 0) {
    showToast("No errors logged yet.");
    return;
  }
  
  let content = "--- JUST PLAY IT. ERROR LOG ---\n\n";
  logs.forEach(log => {
    content += `[${log.timestamp}] [${log.type}]\n${log.message}\n\n`;
  });
  
  // Use a simple prompt/alert to show the log for now, 
  // or a more sophisticated modal later.
  console.log(content);
  
  // Create a temporary overlay to show logs
  const overlay = document.createElement("div");
  overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; padding:20px; overflow-y:auto; color:#fff; font-family:monospace; font-size:12px; white-space:pre-wrap;";
  overlay.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
      <h2 style="margin:0;">Technical Error Log</h2>
      <button onclick="this.parentElement.parentElement.remove()" style="background:#cc3300; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">Close</button>
    </div>
    <button id="copyLogBtn" style="background:#3182ce; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer; margin-bottom:20px;">Copy to Clipboard</button>
    <div>${content}</div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById("copyLogBtn").onclick = () => {
    navigator.clipboard.writeText(content).then(() => showToast("Log copied to clipboard"));
  };
}

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  addErrorLog(`${message} at ${source}:${lineno}:${colno}`, "GlobalError");
};

window.onunhandledrejection = (event) => {
  addErrorLog(`Promise rejected: ${event.reason}`, "UnhandledPromise");
};

// ── Theme ──────────────────────────────────────────────
function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.getElementById("themeColorMeta");
  if (meta) {
    meta.content = theme === "light" ? "#f6f4f1" : "#0b0d12";
  }
  if (themeIcon) themeIcon.innerHTML = theme === "light" ? ICONS.sun : ICONS.moon;
  if (themeLabel) themeLabel.textContent = theme === "light" ? "Light mode" : "Dark mode";
}

function initTheme() {
  // Always default to dark mode unless the user explicitly saved 'light'
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const theme = saved === "light" ? "light" : "dark";
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getSystemTheme();
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEYS.theme, next);
}

// ── Cover art helpers ──────────────────────────────────
function setCoverArtLoaded(track) {
  // Replace folder-icon content with the vinyl record image
  coverArtEl.innerHTML = `<img src="icons/icon-512.png" alt="">`;
  coverArtEl.classList.remove("cover-art-load");
  coverArtEl.setAttribute("aria-label", track ? track.title : "Now playing");
  coverArtEl.title = "";
  coverArtEl.style.cursor = "default";
}

function setCoverArtEmpty() {
  coverArtEl.innerHTML = `<span class="cover-art-hint">Load</span>`;
  coverArtEl.classList.add("cover-art-load");
  coverArtEl.classList.remove("spinning");
  coverArtEl.setAttribute("aria-label", "Load audio files");
  coverArtEl.title = "Click to load audio files";
  coverArtEl.style.cursor = "pointer";
}

function updateSpinning() {
  const isPlaying = !audio.paused && playlist.length > 0 && currentTrackIndex >= 0;
  coverArtEl.classList.toggle("spinning", isPlaying);
  // Brand logo in topbar does NOT spin with playback — it only does one startup spin via CSS
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const decimals = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

function getFileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.split("/").filter(Boolean);
    const lastPart = path[path.length - 1] || "Stream";
    return decodeURIComponent(lastPart);
  } catch {
    return "URL Audio";
  }
}

function getTrackEmoji(track) {
  return "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Phase 3: Clean up ugly filenames for display.
 * Strips extensions and replaces separators with spaces.
 */
function cleanTrackName(filename) {
  if (!filename) return "Unknown Track";
  // Strip extension
  let name = filename.replace(/\.(mp3|wav|ogg|m4a|mp4|aac|flac)$/i, "");
  // Strip common numeric prefixes like "01", "01_", "01 - ", "1. "
  name = name.replace(/^\d+[\s._-]*[-.]?[\s._-]*/, "");
  // Replace underscores and dashes with spaces
  name = name.replace(/[_-]/g, " ");
  // Clean up multiple spaces
  name = name.replace(/\s+/g, " ").trim();
  // Capitalize first letter of each word
  return name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function getTrackSourceLabel(track) {
  if (!track) return "";
  if (track.sourceType === "file") return "Stored on device";
  if (track.id && String(track.id).startsWith("builtin-")) return ""; // Hidden as requested
  return "Audio from URL";
}

function setPlayerStatus(text) {
  if (playerCard) playerCard.title = text;
}


function showToast(message, duration = 2400) {
  toastEl.textContent = message;
  toastEl.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove("show");
  }, duration);
}

async function updateBadgeCounts() {
  const listCount = Array.isArray(playlist) ? playlist.length : 0;
  
  // Dev Log: Trace sync between workspace and metadata
  console.log(`[StateSync] updateBadgeCounts - Workspace Count: ${listCount}, Selected: ${currentPlaylistName || "Unsaved"}`);

  // 1. Sidebar Queue count
  if (playlistBadge) {
    playlistBadge.textContent = listCount;
    playlistBadge.classList.toggle("hidden", listCount === 0);
  }

  // 2. Landing Page Pill count
  if (nowPlayingPlaylistBadge) {
    nowPlayingPlaylistBadge.textContent = listCount;
    nowPlayingPlaylistBadge.classList.toggle("hidden", listCount === 0);
  }
  if (nowPlayingPlaylistInfo) {
    nowPlayingPlaylistInfo.classList.toggle("hidden", listCount === 0);
  }

  // 3. Saved playlists (Library Tab) count
  if (savedPlaylistsBadge) {
    const savedCount = Object.keys(savedPlaylists || {}).length;
    savedPlaylistsBadge.textContent = savedCount;
    savedPlaylistsBadge.classList.toggle("hidden", savedCount === 0);
  }

  // 4. Global Hardware Library badge (Stored + Built-in)
  if (libraryBadge) {
    try {
      // Use short timeout or parallel fetch to avoid blocking UI
      const records = db ? await getAllTrackMetadata() : [];
      let builtinTracksCount = 0;
      Object.values(savedPlaylists).forEach(pl => {
        if (pl.isBuiltin) builtinTracksCount += (pl.tracks || []).length;
      });
      const totalCount = records.length + builtinTracksCount;
      libraryBadge.textContent = totalCount;
      libraryBadge.classList.toggle("hidden", totalCount === 0);
    } catch (err) {
      console.warn("Library badge update error:", err);
      libraryBadge.classList.add("hidden");
    }
  }
}

function updateSelectionBadge() {
  const selectionBadge = document.getElementById("selectionBadge");
  if (!selectionBadge) return;
  const count = selectedLibraryTracks.size;
  selectionBadge.textContent = count;
  selectionBadge.classList.toggle("hidden", count === 0);
}

function revokeCurrentObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function updatePlaylistNameDisplay() {
  const name = currentPlaylistName || "Unsaved"; // Default back to consistent "Unsaved" state
  
  if (nowPlayingPlaylistName) {
    nowPlayingPlaylistName.textContent = name;
  }
  
  if (nowPlayingPlaylistInfo) {
    nowPlayingPlaylistInfo.classList.toggle("has-playlist", !!currentPlaylistName);
  }

  // Sync selectedPlaylistKey if it matches a real playlist (Phase 2 legacy guard)
  if (typeof savedPlaylistsSelect !== 'undefined' && savedPlaylistsSelect) {
    savedPlaylistsSelect.value = ""; // Always show placeholder heading
  }

  localStorage.setItem(STORAGE_KEYS.currentPlaylistName, currentPlaylistName || "");

  // Keep the CURRENT QUEUE pill in sync whenever the name changes
  refreshQueuePill();

  // Keep the unsaved queue warning in sync
  refreshUnsavedWarning();
}

/**
 * refreshUnsavedWarning — shows/hides the unsaved queue modal.
 *
 * Dismiss is keyed to a QUEUE FINGERPRINT (joined track IDs).
 *   • Switching tabs does not change the fingerprint → modal stays dismissed.
 *   • Adding or removing a track changes the fingerprint → modal re-shows.
 *   • Saving the playlist (currentPlaylistName set) → modal hides + resets.
 *   • Clearing the queue → modal hides + resets.
 *   • Page reload: fingerprint match is in-memory only → modal shows again
 *     on reload if queue is still Unsaved (appropriate reminder on fresh load).
 */
let _uqDismissedFingerprint = null; // fingerprint string at time of dismiss
let _uqBtnWired = false;            // wire dismiss button exactly once

function _uqFingerprint() {
  // Stable string that changes when tracks are added/removed/reordered
  if (!Array.isArray(playlist) || playlist.length === 0) return "";
  return playlist.map(t => t.id).join(",");
}

function _uqSetVisible(show) {
  const modal = document.getElementById("unsavedQueueWarning");
  const scrim = document.getElementById("unsavedQueueScrim");
  if (!modal) return;
  if (show) {
    modal.classList.remove("hidden");
    if (scrim) scrim.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
    if (scrim) scrim.classList.add("hidden");
  }
}

function refreshUnsavedWarning() {
  const modal = document.getElementById("unsavedQueueWarning");
  if (!modal) return;

  const hasQueue  = Array.isArray(playlist) && playlist.length > 0;
  const isUnsaved = !currentPlaylistName;

  // Wire the dismiss button exactly once
  if (!_uqBtnWired) {
    const btn = document.getElementById("unsavedWarningDismissBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        _uqDismissedFingerprint = _uqFingerprint();
        _uqSetVisible(false);
      });
      _uqBtnWired = true;
    }
  }

  // Case 1: Condition gone (saved or empty) — hide and fully reset
  if (!hasQueue || !isUnsaved) {
    _uqDismissedFingerprint = null;
    _uqSetVisible(false);
    return;
  }

  // Case 2: Should show — but only if fingerprint differs from last dismiss
  const fp = _uqFingerprint();
  if (fp === _uqDismissedFingerprint) {
    // Same queue state as when user dismissed — respect dismiss, stay hidden
    return;
  }

  // Case 3: New or changed unsaved queue state — show the modal
  _uqSetVisible(true);
}

/**
 * refreshQueuePill — syncs the compact playlist pill in the CURRENT QUEUE toolbar.
 * Shows when any playlist name is set (user or builtin); hides when queue is empty
 * and no playlist is active.
 */
function refreshQueuePill() {
  const pillEl    = typeof queuePlaylistPill    !== 'undefined' ? queuePlaylistPill    : document.getElementById('queuePlaylistPill');
  const nameEl    = typeof queuePlaylistPillName  !== 'undefined' ? queuePlaylistPillName  : document.getElementById('queuePlaylistPillName');
  const badgeEl   = typeof queuePlaylistPillBadge !== 'undefined' ? queuePlaylistPillBadge : document.getElementById('queuePlaylistPillBadge');

  if (!pillEl) return;

  const name  = currentPlaylistName || "";
  const count = (playlist || []).length;

  if (name || count > 0) {
    pillEl.classList.remove("hidden");
    if (nameEl)  nameEl.textContent  = name || "Unsaved";
    if (badgeEl) badgeEl.textContent = count;
  } else {
    // Nothing active and queue is empty — hide pill
    pillEl.classList.add("hidden");
  }
}


function normalizeTrack(track) {
  if (!track || !track.sourceType || !track.id || !track.title) return null;

  const normalized = {
    id: track.id,
    title: track.title,
    sourceType: track.sourceType,
    disabled: !!track.disabled,
    duration: track.duration,
  };

  if (track.sourceType === "url") {
    // REPAIR BRIDGE: If this is a builtin track, sync its 'src' with the latest 
    // metadata from builtin-playlists.json. This fixes stale/broken URLs in localStorage.
    if (track.id.startsWith("builtin-") && typeof savedPlaylists === "object") {
      for (const playlistName in savedPlaylists) {
        const pl = savedPlaylists[playlistName];
        if (pl.isBuiltin && Array.isArray(pl.tracks)) {
          const found = pl.tracks.find(t => t.id === track.id);
          if (found && found.src) {
            normalized.src = found.src;
            break;
          }
        }
      }
    }

    // Fallback if not repaired or search yielded nothing
    if (!normalized.src) {
      if (!track.src) return null;
      normalized.src = track.src;
    }
  }

  return normalized;
}

function updateNowPlaying(track) {
  if (!track) {
    trackTitleEl.textContent = "Nothing loaded yet";
    trackMetaEl.textContent = "Tap the record icon or add a file below";
    setCoverArtEmpty();
    setPlayerStatus("Ready when you are.");
    updateMediaSession();
    console.log("[UI] updateNowPlaying: Empty state set.");
    return;
  }

  trackTitleEl.textContent = track.title;
  const label = getTrackSourceLabel(track);
  trackMetaEl.textContent = label;
  trackMetaEl.classList.toggle("hidden", !label);
  setCoverArtLoaded(track);
  console.log(`[UI] updateNowPlaying: Loaded track "${track.title}"`);

  if (shuffleEnabled && repeatMode === "one") {
    setPlayerStatus("Shuffle is on. Repeat one is also on.");
  } else if (shuffleEnabled) {
    setPlayerStatus("Shuffle is on.");
  } else if (repeatMode === "all") {
    setPlayerStatus("Repeat all is on.");
  } else if (repeatMode === "one") {
    setPlayerStatus("Repeating this track.");
  } else {
    setPlayerStatus("Normal playback.");
  }

  updateMediaSession();

}


function savePlaylistState() {
  const safePlaylist = playlist
    .map((track) => normalizeTrack(track))
    .filter(Boolean);

  localStorage.setItem(STORAGE_KEYS.playlist, JSON.stringify(safePlaylist));
  localStorage.setItem(
    STORAGE_KEYS.currentTrackIndex,
    String(currentTrackIndex),
  );
}

function savePlaybackState() {
  localStorage.setItem(
    STORAGE_KEYS.currentTrackIndex,
    String(currentTrackIndex),
  );

  if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
    localStorage.setItem(
      STORAGE_KEYS.currentTime,
      String(audio.currentTime || 0),
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentTime);
  }
}

function saveVolume() {
  localStorage.setItem(STORAGE_KEYS.volume, String(audio.volume));
}

function loadVolume() {
  // Volume is controlled by the device hardware — keep audio at full and restore
  // only if a saved value exists (legacy support); slider no longer in the DOM.
  const saved = Number(localStorage.getItem(STORAGE_KEYS.volume));
  audio.volume = Number.isFinite(saved) && saved > 0 ? Math.min(1, saved) : 1;
  if (volumeSlider) volumeSlider.value = String(audio.volume);
}

function loadModes() {
  shuffleEnabled = localStorage.getItem(STORAGE_KEYS.shuffle) === "true";
  repeatMode = localStorage.getItem(STORAGE_KEYS.repeat) || "off";
  updateModeButtons();
}

function saveModes() {
  localStorage.setItem(STORAGE_KEYS.shuffle, String(shuffleEnabled));
  localStorage.setItem(STORAGE_KEYS.repeat, repeatMode);
}

function updateModeButtons() {
  // Shuffle — sidebar button
  if (shuffleBtnLabel) shuffleBtnLabel.textContent = `Shuffle: ${shuffleEnabled ? "On" : "Off"}`;
  if (shuffleBtn) shuffleBtn.classList.toggle("active", shuffleEnabled);

  // Repeat — main page button (SVG icon + text)
  const repeatLabels = { off: "Off", all: "All", one: "One" };
  repeatBtn.innerHTML = `${ICONS.repeat} <span>Repeat: ${repeatLabels[repeatMode] || "Off"}</span>`;
  repeatBtn.classList.toggle("active", repeatMode !== "off");
}

