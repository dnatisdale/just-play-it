const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const addUrlBtn = document.getElementById("addUrlBtn");
const playlistEl = document.getElementById("playlist");
const clearPlaylistBtn = document.getElementById("clearPlaylistBtn");

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
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
const playlistSearchInput = document.getElementById("playlistSearchInput");
const jumpToCurrentBtn = document.getElementById("jumpToCurrentBtn");
const playlistNameDisplay = document.getElementById("playlistNameDisplay");

// Containers for tooltips (decluttering)
const savedPlaylistBox = document.getElementById("savedPlaylistBox");
const playlistHeader = document.getElementById("playlistHeader");
const sleepRow = document.querySelector(".sleep-row");

const miniPlayer = document.getElementById("miniPlayer");
const miniPlayerTitle = document.getElementById("miniPlayerTitle");
const miniPlayerMeta = document.getElementById("miniPlayerMeta");
const miniPrevBtn = document.getElementById("miniPrevBtn");
const miniPlayPauseBtn = document.getElementById("miniPlayPauseBtn");
const miniNextBtn = document.getElementById("miniNextBtn");
const miniVinylEl = document.getElementById("miniVinyl");
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

// Badges
const menuBadge = document.getElementById("menuBadge");
const savedPlaylistsBadge = document.getElementById("savedPlaylistsBadge");
const playlistBadge = document.getElementById("playlistBadge");

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
let playlistFilter = "";

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
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const theme = saved || "light"; // default to light mode
  applyTheme(theme);

  // Keep synced if user clears their saved preference and system changes
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (!localStorage.getItem(STORAGE_KEYS.theme)) {
      applyTheme(e.matches ? "light" : "dark");
    }
  });
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
  if (brandLogoWrap) brandLogoWrap.classList.toggle("spinning", isPlaying);
  if (miniVinylEl) miniVinylEl.classList.toggle("spinning", isPlaying);
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
  if (!track) return "♪";
  const name = (track.title || "").toLowerCase();

  if (name.includes("podcast")) return "🎙";
  if (name.includes("sermon")) return "📖";
  if (name.includes("bible")) return "📘";
  if (name.includes("song") || name.includes("music")) return "🎵";
  if (name.includes("lesson")) return "📝";
  return track.sourceType === "file" ? "🎧" : "🌐";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setPlayerStatus(text) {
  if (playerCard) playerCard.title = text;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2400);
}

async function updateBadgeCounts() {
  // Playlist count
  if (playlistBadge) {
    const listCount = Array.isArray(playlist) ? playlist.length : 0;
    playlistBadge.textContent = listCount;
    playlistBadge.classList.toggle("hidden", listCount === 0);
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
  playlistNameDisplay.textContent = `Current playlist: ${currentPlaylistName || "Unsaved"}`;
  localStorage.setItem(STORAGE_KEYS.currentPlaylistName, currentPlaylistName);
}

function normalizeTrack(track) {
  if (!track || !track.sourceType || !track.id || !track.title) return null;

  if (track.sourceType === "url") {
    if (!track.src) return null;
    return {
      id: track.id,
      title: track.title,
      sourceType: "url",
      src: track.src,
    };
  }

  if (track.sourceType === "file") {
    return {
      id: track.id,
      title: track.title,
      sourceType: "file",
    };
  }

  return null;
}

function updateMiniPlayer(track) {
  if (!track) {
    miniPlayerTitle.textContent = "Nothing loaded yet";
    miniPlayerMeta.textContent = "Ready";
    return;
  }

  miniPlayerTitle.textContent = track.title;
  miniPlayerMeta.textContent =
    track.sourceType === "file" ? "Stored device file" : "URL audio";
  const icon = audio.paused ? ICONS.play : ICONS.pause;
  if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = icon;
}

function updateNowPlaying(track) {
  if (!track) {
    trackTitleEl.textContent = "Nothing loaded yet";
    trackMetaEl.textContent = "Tap the record icon or add a file below";
    setCoverArtEmpty();
    setPlayerStatus("Ready when you are.");
    updateMediaSession();
    updateMiniPlayer(null);
    return;
  }

  trackTitleEl.textContent = track.title;
  trackMetaEl.textContent =
    track.sourceType === "file" ? "Stored device file" : "Streaming from URL";
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
  updateMiniPlayer(track);
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

function loadSavedPlaylists() {
  try {
    savedPlaylists = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.savedPlaylists) || "{}",
    );
    if (!savedPlaylists || typeof savedPlaylists !== "object") {
      savedPlaylists = {};
    }
  } catch {
    savedPlaylists = {};
  }

  refreshSavedPlaylistsSelect();

  const selected =
    localStorage.getItem(STORAGE_KEYS.selectedSavedPlaylist) || "";
  if (selected && savedPlaylists[selected]) {
    savedPlaylistsSelect.value = selected;
    savedPlaylistStatus.textContent = `Selected saved playlist: ${selected}`;
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
    .sort((a, b) => a.localeCompare(b))
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

function getFilteredEntries() {
  const filter = playlistFilter.trim().toLowerCase();

  return playlist
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => {
      if (!filter) return true;
      return track.title.toLowerCase().includes(filter);
    });
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  const entries = getFilteredEntries();

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

    const thumb = document.createElement("div");
    thumb.className = "track-thumb";
    thumb.textContent = getTrackEmoji(track);

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "track-info-btn";
    infoBtn.innerHTML = `
      <span class="track-name">${escapeHtml(track.title)}</span>
      <span class="track-source">${track.sourceType === "file" ? "Stored file on device" : "Audio from URL"}</span>
    `;
    infoBtn.addEventListener("click", async () => {
      await loadTrack(index, true);
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "small-btn";
    upBtn.textContent = "↑";
    upBtn.addEventListener("click", () => moveTrack(index, -1));

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "small-btn";
    downBtn.textContent = "↓";
    downBtn.addEventListener("click", () => moveTrack(index, 1));

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "small-btn";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", async () => {
      await loadTrack(index, true);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small-btn remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => removeTrack(index));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(playBtn);
    actions.appendChild(removeBtn);

    li.appendChild(thumb);
    li.appendChild(infoBtn);
    li.appendChild(actions);

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
  currentPlaylistName = "";
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
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= playlist.length) return;
  reorderTrack(index, targetIndex);
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

  for (const file of fileArray) {
    const id = crypto.randomUUID();
    await saveTrackBlob(id, file);

    newTracks.push({
      id,
      title: file.name,
      sourceType: "file",
    });
  }

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
    `Finished loading ${newTracks.length} file${newTracks.length === 1 ? "" : "s"}.`,
  );
}

function addUrlTrack(url) {
  const trimmed = url.trim();
  if (!trimmed) return;

  try {
    new URL(trimmed);
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
  currentPlaylistName = "";
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
    app: "Just Play It",
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
  miniPlayPauseBtn.innerHTML = icon;
  updateSpinning();
}


async function playCurrent() {
  if (playlist.length === 0) return;

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
  audio.pause();
  updatePlayPauseButton();
  setPlayerStatus("Playback paused.");
}

function getRandomTrackIndex(excludeIndex) {
  if (playlist.length <= 1) return excludeIndex;

  let randomIndex = excludeIndex;
  while (randomIndex === excludeIndex) {
    randomIndex = Math.floor(Math.random() * playlist.length);
  }
  return randomIndex;
}

async function playNext() {
  if (playlist.length === 0) return;

  let nextIndex;

  if (shuffleEnabled) {
    nextIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    nextIndex =
      currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
  }

  pendingRestoreTime = null;
  await loadTrack(nextIndex, true);
}

async function playPrev() {
  if (playlist.length === 0) return;

  let prevIndex;

  if (shuffleEnabled) {
    prevIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    prevIndex =
      currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
  }

  pendingRestoreTime = null;
  await loadTrack(prevIndex, true);
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
  showToast(`Loaded "${name}".`);
}

function renameNamedPlaylist() {
  const oldName = savedPlaylistsSelect.value;

  if (!oldName || !savedPlaylists[oldName]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist to rename.";
    showToast("Choose a saved playlist to rename.");
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
      currentTrack.sourceType === "file" ? "Saved offline audio" : "URL stream",
    album: currentPlaylistName || "Just Play It",
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

  playlistFilter = "";
  playlistSearchInput.value = "";
  renderPlaylist();

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

clearPlaylistBtn.addEventListener("click", clearPlaylist);

playPauseBtn.addEventListener("click", async () => {
  if (!audio.src) return playCurrent();
  if (audio.paused) {
    await playCurrent();
  } else {
    pauseCurrent();
  }
});

miniPlayPauseBtn.addEventListener("click", async () => {
  if (!audio.src) return playCurrent();
  if (audio.paused) {
    await playCurrent();
  } else {
    pauseCurrent();
  }
});

nextBtn.addEventListener("click", async () => playNext());
prevBtn.addEventListener("click", async () => playPrev());
miniNextBtn.addEventListener("click", async () => playNext());
miniPrevBtn.addEventListener("click", async () => playPrev());

shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeatMode);
installBtn.addEventListener("click", handleInstallClick);
if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

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

playlistSearchInput.addEventListener("input", () => {
  playlistFilter = playlistSearchInput.value;
  renderPlaylist();
});

jumpToCurrentBtn.addEventListener("click", jumpToCurrentTrack);

savedPlaylistsSelect.addEventListener("change", () => {
  if (name) {
    localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
    if (savedPlaylistBox) savedPlaylistBox.title = `Selected saved playlist: ${name}`;
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
  updateMiniPlayer(playlist[currentTrackIndex] || null);
  if (playlist[currentTrackIndex]) {
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  }
});

audio.addEventListener("pause", () => {
  updatePlayPauseButton();
  updateMediaSession();
  updateMiniPlayer(playlist[currentTrackIndex] || null);
  if (audio.currentTime > 0 && !audio.ended) {
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
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
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
  loadSavedPlaylists();
  loadPlaylistFromStorage();
  restoreSleepTimer();
  renderPlaylist();
  updatePlayPauseButton();
  updateNowPlaying(playlist[currentTrackIndex] || null);
  setupMediaSessionActions();
  await updateStorageUsage();
  await updateBadgeCounts();

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
    }
  }
}

initApp();
