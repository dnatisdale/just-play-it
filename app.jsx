const BUILD_TIME = "BUILD V.52 <span class=\"accent-dash\">—</span> 21MAR2026 <span class=\"accent-dash\">—</span> 17:08";
const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const addUrlBtn = document.getElementById("addUrlBtn");
const playlistEl = document.getElementById("playlist");

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const skipBackBtn = document.getElementById("skipBackBtn");
const skipForwardBtn = document.getElementById("skipForwardBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const installBtn = document.getElementById("installBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const trackTitleEl = document.getElementById("trackTitle");
const trackMetaEl = document.getElementById("trackMeta");
const coverArtEl = document.getElementById("coverArt");
const storageUsageText = document.getElementById("storageUsageText");
const playerCard = document.querySelector(".player-card");

const volumeSlider = document.getElementById("volumeSlider");
const sleepTimerSelect = document.getElementById("sleepTimerSelect");
const setSleepTimerBtn = document.getElementById("setSleepTimerBtn");
const sleepTimerStatus = document.getElementById("sleepTimerStatus");

const playlistNameInput = document.getElementById("playlistNameInput");
const savePlaylistBtn = document.getElementById("savePlaylistBtn");
const savedPlaylistsSelect = document.getElementById("savedPlaylistsSelect");
const loadPlaylistBtn = document.getElementById("loadPlaylistBtn");
const renamePlaylistBtn = document.getElementById("renamePlaylistBtn");
const deletePlaylistBtn = document.getElementById("deletePlaylistBtn");
const clearDeviceLibraryBtn = document.getElementById("clearDeviceLibraryBtn");
const exportPlaylistsBtn = document.getElementById("exportPlaylistsBtn");
const importPlaylistsInput = document.getElementById("importPlaylistsInput");
const savedPlaylistStatus = document.getElementById("savedPlaylistStatus");
const jumpToCurrentBtn = document.getElementById("jumpToCurrentBtn");
const toggleEditBtn = document.getElementById("toggleEditBtn");

// Containers for tooltips (decluttering)
const savedPlaylistBox = document.getElementById("savedPlaylistBox");
const playlistHeader = document.getElementById("playlistHeader");
const currentPlaylistHeaderBtn = document.getElementById("currentPlaylistHeaderBtn");
const playlistContainer = document.getElementById("playlistContainer");
const sleepRow = document.querySelector(".sleep-row");

const brandLogoWrap = document.getElementById("brandLogoWrap");

// Sidebar elements
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const shuffleBtnLabel = document.getElementById("shuffleBtnLabel");
const shuffleToggle = document.getElementById("shuffleToggle");
const shareAppBtn = document.getElementById("shareAppBtn");
const copyQrBtn = document.getElementById("copyQrBtn");
const downloadQrBtn = document.getElementById("downloadQrBtn");

// Badges
const menuBadge = document.getElementById("menuBadge");
const savedPlaylistsBadge = document.getElementById("savedPlaylistsBadge");
const playlistBadge = document.getElementById("playlistBadge");
const nowPlayingPlaylistName = document.getElementById("nowPlayingPlaylistName");
const nowPlayingPlaylistBadge = document.getElementById("nowPlayingPlaylistBadge");
const nowPlayingPlaylistInfo = document.getElementById("nowPlayingPlaylistInfo");

// Drag & drop / add-audio elements
const dragOverlay = document.getElementById("dragOverlay");
const dropZone = document.getElementById("dropZone");
const folderInput = document.getElementById("folderInput");
const deviceLibraryList = document.getElementById("deviceLibraryList");

const toastEl = document.getElementById("toast");

// ── SVG icon library (line art) ─────────────────────────────────────────────
const ICONS = {
  play:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>`,
  pause:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>`,
  sun:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21,12.79A9,9,0,1,1,11.21,3,7,7,0,0,0,21,12.79Z"/></svg>`,
  repeat:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17,1 21,5 17,9"/><path d="M3,11V9a4,4,0,0,1,4-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21,13v2a4,4,0,0,1-4,4H3"/></svg>`,
  trash:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/></svg>`,
};


const STORAGE_KEYS = {
  playlist: "justPlayItPlaylist",
  currentTrackIndex: "justPlayItCurrentTrackIndex",
  currentTime: "justPlayItCurrentTime",
  volume: "justPlayItVolume",
  sleepTimerEnd: "justPlayItSleepTimerEnd",
  shuffle: "justPlayItShuffle",
  repeat: "justPlayItRepeat",
  savedPlaylists: "justPlayItSavedPlaylists",
  selectedSavedPlaylist: "justPlayItSelectedSavedPlaylist",
  currentPlaylistName: "justPlayItCurrentPlaylistName",
  theme: "justPlayItTheme",
};


const DB_NAME = "justPlayItDB";
const DB_VERSION = 1;
const TRACK_STORE = "deviceTracks";

let db = null;
let playlist = [];
let currentTrackIndex = -1;
let pendingRestoreTime = null;
let sleepTimerInterval = null;
let sleepTimerTimeout = null;
let shuffleEnabled = false;
let repeatMode = "off";
let savedPlaylists = {};
let currentPlaylistName = "";
let deferredInstallPrompt = null;
let currentObjectUrl = null;
let toastTimeout = null;
let draggedTrackIndex = null;
let isEditMode = false;
let userPaused = false; // New: Tracks if the PAUSE was intentional by the user

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
  // Playlist count
    if (playlistBadge) {
      const listCount = Array.isArray(playlist) ? playlist.length : 0;
      playlistBadge.textContent = listCount;
      playlistBadge.classList.toggle("hidden", listCount === 0);
      
      if (nowPlayingPlaylistBadge) {
        nowPlayingPlaylistBadge.textContent = listCount;
        nowPlayingPlaylistBadge.classList.remove("hidden");
      }
      if (nowPlayingPlaylistInfo) {
        nowPlayingPlaylistInfo.classList.remove("hidden");
      }
    }

  // Saved playlists count
  if (savedPlaylistsBadge) {
    const savedCount = Object.keys(savedPlaylists || {}).length;
    savedPlaylistsBadge.textContent = savedCount;
    savedPlaylistsBadge.classList.toggle("hidden", savedCount === 0);
  }

  // Sidebar badge: total library files
  if (menuBadge) {
    try {
      const records = db ? await getAllTrackBlobs() : [];
      const count = records.length;
      menuBadge.textContent = count;
      menuBadge.classList.toggle("hidden", count === 0);
    } catch (err) {
      console.error("Badge update error:", err);
      menuBadge.classList.add("hidden");
    }
  }
}

function revokeCurrentObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function updatePlaylistNameDisplay() {
  const name = currentPlaylistName || "CURRENT PLAYLIST";
  if (nowPlayingPlaylistName) {
    nowPlayingPlaylistName.textContent = name;
  }
  localStorage.setItem(STORAGE_KEYS.currentPlaylistName, currentPlaylistName);
}

function normalizeTrack(track) {
  if (!track || !track.sourceType || !track.id || !track.title) return null;

  const normalized = {
    id: track.id,
    title: track.title,
    sourceType: track.sourceType,
    disabled: !!track.disabled,
  };

  if (track.sourceType === "url") {
    if (!track.src) return null;
    normalized.src = track.src;
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

    return;
  }

  trackTitleEl.textContent = track.title;
  const label = getTrackSourceLabel(track);
  trackMetaEl.textContent = label;
  trackMetaEl.classList.toggle("hidden", !label);
  setCoverArtLoaded(track);

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

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(TRACK_STORE)) {
        database.createObjectStore(TRACK_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveTrackBlob(id, file) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);

    store.put({
      id,
      blob: file,
      title: file.name,
      type: file.type || "audio/*",
      size: file.size || 0,
      updatedAt: Date.now(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getTrackBlob(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readonly");
    const store = tx.objectStore(TRACK_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function getAllTrackBlobs() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readonly");
    const store = tx.objectStore(TRACK_STORE);
    const request = store.getAll();

    request.onsuccess = () =>
      resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error);
  });
}

function clearAllTrackBlobs() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Delete a single stored track blob by ID
function deleteTrackBlob(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateStorageUsage() {
  try {
    const records = db ? await getAllTrackBlobs() : [];
    const deviceBytes = records.reduce(
      (sum, item) => sum + (item.size || item.blob?.size || 0),
      0,
    );

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      storageUsageText.textContent = `Offline storage: ${formatBytes(deviceBytes)}. Browser usage: ${formatBytes(usage)} of ${formatBytes(quota)}.`;
    } else {
      storageUsageText.textContent = `Offline storage: ${formatBytes(deviceBytes)}.`;
    }
  } catch (error) {
    console.error("Could not estimate storage:", error);
    storageUsageText.textContent = "Storage usage unavailable in this browser.";
  }
}

// ── Device Library: render per-file list in sidebar ──
async function renderSidebarLibrary() {
  if (!deviceLibraryList) return;

  if (!db) {
    deviceLibraryList.innerHTML = `<p class="library-empty-state">Storage unavailable.</p>`;
    return;
  }

  let records;
  try {
    records = await getAllTrackBlobs();
  } catch {
    records = [];
  }

  if (records.length === 0) {
    deviceLibraryList.innerHTML = `<p class="library-empty-state">No offline tracks stored yet.</p>`;
    return;
  }

  deviceLibraryList.innerHTML = "";

  records.forEach((record) => {
    const size = formatBytes(record.size || record.blob?.size || 0);
    const name = record.title || record.id;

    const item = document.createElement("div");
    item.className = "library-item";
    item.dataset.id = record.id;

    const info = document.createElement("div");
    info.className = "library-item-info";
    info.innerHTML = `
      <span class="library-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      <span class="library-item-size">${size}</span>
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
        deleteBtn.setAttribute("aria-label", `Confirm delete ${escapeHtml(name)}`);

        confirmTimeout = setTimeout(() => {
          if (deleteBtn.classList.contains("confirming")) {
            deleteBtn.classList.remove("confirming");
            deleteBtn.innerHTML = ICONS.trash;
            deleteBtn.setAttribute("aria-label", `Delete ${escapeHtml(name)}`);
          }
        }, 3000);
      }
    });

    item.appendChild(info);
    item.appendChild(deleteBtn);
    deviceLibraryList.appendChild(item);
  });
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
  savedPlaylistsSelect.innerHTML = `<option value="">Choose a saved playlist</option>`;

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
    const label = getTrackSourceLabel(track);
    infoBtn.innerHTML = `
      <span class="track-name">${escapeHtml(track.title)}</span>
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

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "small-btn";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadTrack(index, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small-btn remove";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove from playlist";
    removeBtn.addEventListener("click", (e) => { e.stopPropagation(); removeTrack(index); });

    if (isEditMode) {
      actions.appendChild(dragHandle);
      actions.appendChild(removeBtn);
    } else {
      actions.appendChild(playBtn);
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

  currentTrackIndex = index;
  const track = playlist[index];
  const source = await resolveTrackSource(track);

  if (!source) {
    updateNowPlaying(track);
    renderPlaylist();
    savePlaylistState();
    updatePlayPauseButton();
    setPlayerStatus(`Missing stored file: ${track.title}`);
    showToast(`Missing stored file: ${track.title}`);
    return;
  }

  audio.src = source;
  // Let the browser handle the load triggered by the change in src.

  updateNowPlaying(track);
  renderPlaylist();
  savePlaylistState();

  if (shouldPlay) {
    try {
      await audio.play();
      updatePlayPauseButton();
      setPlayerStatus(`Playing: ${track.title}`);
    } catch (error) {
      console.error("Playback failed:", error);
      setPlayerStatus("Playback could not start.");
      showToast("Playback could not start.");
    }
  } else {
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
    await saveTrackBlob(id, file);

    newTracks.push({
      id,
      title: file.name,
      sourceType: "file",
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

function updatePlayPauseButton() {
  const icon = audio.paused ? ICONS.play : ICONS.pause;
  playPauseBtn.innerHTML = icon;
  updateSpinning();
}


async function playCurrent() {
  if (playlist.length === 0) return;
  userPaused = false; // User explicitly wants to play

  if (currentTrackIndex === -1) {
    await loadTrack(0, true);
    return;
  }

  if (!audio.src) {
    await loadTrack(currentTrackIndex, true);
    return;
  }

  try {
    await audio.play();
    updatePlayPauseButton();
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  } catch (error) {
    console.error("Playback failed:", error);
    setPlayerStatus("Playback could not start.");
    showToast("Playback could not start.");
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
  if (!audio.src || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  showToast(`${seconds > 0 ? "Forward" : "Back"} ${Math.abs(seconds)}s`);
}

function saveNamedPlaylist() {
  const name = playlistNameInput.value.trim();

  if (!name) {
    savedPlaylistStatus.textContent = "Please enter a playlist name first.";
    showToast("Enter a playlist name first.");
    return;
  }

  const normalizedTracks = playlist
    .map((track) => normalizeTrack(track))
    .filter(Boolean);

  if (normalizedTracks.length === 0) {
    savedPlaylistStatus.textContent =
      "There is nothing to save in this playlist.";
    showToast("There is nothing to save.");
    return;
  }

  savedPlaylists[name] = {
    name,
    tracks: normalizedTracks,
    savedAt: new Date().toISOString(),
  };

  currentPlaylistName = name;
  updatePlaylistNameDisplay();
  persistSavedPlaylists();
  savedPlaylistsSelect.value = name;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
  if (savedPlaylistBox) savedPlaylistBox.title = `Saved playlist: ${name}`;
  setPlayerStatus(`Saved playlist "${name}".`);
  showToast(`Saved playlist "${name}".`);
}

async function loadNamedPlaylist() {
  const name = savedPlaylistsSelect.value;

  if (!name || !savedPlaylists[name]) {
    if (savedPlaylistBox) savedPlaylistBox.title = "Choose a saved playlist first.";
    showToast("Choose a saved playlist first.");
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
  updateBadgeCounts();
  showToast(`Loaded "${name}".`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renameNamedPlaylist() {
  const oldName = savedPlaylistsSelect.value;

  if (!oldName || !savedPlaylists[oldName]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist to rename.";
    showToast("Choose a saved playlist to rename.");
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
  savedPlaylistsSelect.value = cleanName;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, cleanName);

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
  const name = savedPlaylistsSelect.value;

  if (!name || !savedPlaylists[name]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist to delete.";
    showToast("Choose a saved playlist to delete.");
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
  savedPlaylistsSelect.value = "";
  localStorage.removeItem(STORAGE_KEYS.selectedSavedPlaylist);

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

  if (!minutes || minutes <= 0) {
    sleepTimerStatus.textContent = "No sleep timer set.";
    localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
    sleepTimerSelect.value = "0";
    showToast("Sleep timer off.");
    return;
  }

  const endTime = Date.now() + minutes * 60 * 1000;
  localStorage.setItem(STORAGE_KEYS.sleepTimerEnd, String(endTime));
  sleepTimerSelect.value = String(minutes);

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
    sleepTimerSelect.value = "0";
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
    sleepTimerStatus.textContent = "No sleep timer set.";
    return;
  }

  const remainingMs = savedEnd - Date.now();
  const approxMinutes = Math.max(1, Math.round(remainingMs / 60000));

  sleepTimerTimeout = window.setTimeout(() => {
    audio.pause();
    updatePlayPauseButton();
    clearSleepTimer();
    sleepTimerStatus.textContent = "Sleep timer finished. Playback paused.";
    setPlayerStatus("Sleep timer finished.");
    showToast("Sleep timer finished.");
  }, remainingMs);

  sleepTimerInterval = window.setInterval(updateSleepTimerStatus, 1000);
  sleepTimerSelect.value = String(approxMinutes);
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
loadPlaylistBtn.addEventListener("click", async () => loadNamedPlaylist());
renamePlaylistBtn.addEventListener("click", renameNamedPlaylist);
deletePlaylistBtn.addEventListener("click", deleteNamedPlaylist);
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
  const isBuiltin = selected && savedPlaylists[selected] && savedPlaylists[selected].isBuiltin;
  
  if (renamePlaylistBtn) renamePlaylistBtn.disabled = !!isBuiltin;
  if (deletePlaylistBtn) deletePlaylistBtn.disabled = !!isBuiltin;

  if (selected) {
    localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, selected);
    if (savedPlaylistBox) savedPlaylistBox.title = `Selected saved playlist: ${selected}`;
  } else {
    localStorage.removeItem(STORAGE_KEYS.selectedSavedPlaylist);
    if (savedPlaylistBox) savedPlaylistBox.title = "No saved playlist selected.";
  }
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);

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

setSleepTimerBtn.addEventListener("click", () => {
  const minutes = Number(sleepTimerSelect.value);
  setSleepTimer(minutes);
});

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

  // New: Auto-resume logic for notifications
  if (!userPaused && !audio.ended) {
    setPlayerStatus("Interruption detected. Resuming shortly...");
    setTimeout(() => {
        // Only resume if the user hasn't clicked pause in the meantime
        if (!userPaused) {
            audio.play().catch(() => console.log("Auto-resume blocked by system."));
        }
    }, 2000); // 2 second delay is usually enough for a notification to end
  } else if (audio.currentTime > 0 && !audio.ended) {
    setPlayerStatus("Playback paused.");
  }
});

audio.addEventListener("ended", async () => {
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
      // Force a check for updates immediately on load
      reg.update();
    }).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });

  // Automatically reload the page when a new service worker takes over (Silent update)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
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
  loadPlaylistFromStorage();
  restoreSleepTimer();
  renderPlaylist();
  updatePlayPauseButton();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  setupMediaSessionActions();
  await updateStorageUsage();
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
        savedPlaylistsSelect.value = starterName;
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

  // ── Squeaking Sneakers sound logic ──
  const splash = document.getElementById("splashScreen");
  if (splash) {
    let bouncePlayed = false;
    let sequenceStarted = false;

    const splashAudio = new Audio("audio/ElevenLabs_Basketball2.ogg");
    splashAudio.volume = 0.45;
    splashAudio.preload = "auto";

    const playSplashSound = () => {
      if (sequenceStarted) return;
      sequenceStarted = true;

      // Sync start slightly to match animation onset
      setTimeout(() => {
        splashAudio.play().then(() => {
           bouncePlayed = true;
        }).catch(() => {
           // Reset if blocked so interaction can trigger it immediately
           sequenceStarted = false;
        });
      }, 100); 
    };

    // 1. Try playing automatically
    playSplashSound();

    // 2. Fallback: trigger on first user interaction anywhere
    const triggerSplash = () => {
      if (!bouncePlayed) {
        // If it was blocked, a user click will force it to play
        splashAudio.currentTime = 0;
        splashAudio.play().catch(()=>{});
        bouncePlayed = true;
        sequenceStarted = true;
      }
      window.removeEventListener("pointerdown", triggerSplash);
      window.removeEventListener("keydown", triggerSplash);
    };
    
    window.addEventListener("pointerdown", triggerSplash, { once: true });
    window.addEventListener("keydown", triggerSplash, { once: true });

    // Delay to let the fancy bouncy animation finish
    setTimeout(() => {
      splash.classList.add("fade-out");
      window.removeEventListener("pointerdown", triggerSplash);
      window.removeEventListener("keydown", triggerSplash);
    }, 4000);
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

initApp();
// ── File Handling API (Launch Queue) ─────────────────────────
// This catches audio files sent from the Android "Complete action using" menu
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    // Check if files were actually passed to the app
    if (!launchParams.files || !launchParams.files.length) return;
    
    try {
      // Extract the actual File objects from the Android file handles
      const filePromises = launchParams.files.map(handle => handle.getFile());
      const files = await Promise.all(filePromises);
      
      // Filter them using your existing isAudioFile function
      const audioFiles = files.filter(isAudioFile);
      
      if (audioFiles.length > 0) {
        // Pass them directly into your existing system to save and play!
        await addFileTracks(audioFiles);
      } else {
        showToast("No valid audio files found.");
      }
    } catch (error) {
      console.error("Error opening file from Android menu:", error);
      showToast("Could not open the file.");
    }
  });
}
