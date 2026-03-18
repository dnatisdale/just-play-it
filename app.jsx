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
const playerStatusEl = document.getElementById("playerStatus");
const storageUsageText = document.getElementById("storageUsageText");

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
const playlistNameDisplay = document.getElementById("playlistNameDisplay");

const playlistSearchInput = document.getElementById("playlistSearchInput");
const jumpToCurrentBtn = document.getElementById("jumpToCurrentBtn");

const miniPlayer = document.getElementById("miniPlayer");
const miniPlayerTitle = document.getElementById("miniPlayerTitle");
const miniPlayerMeta = document.getElementById("miniPlayerMeta");
const miniPrevBtn = document.getElementById("miniPrevBtn");
const miniPlayPauseBtn = document.getElementById("miniPlayPauseBtn");
const miniNextBtn = document.getElementById("miniNextBtn");
const miniVinylEl = document.getElementById("miniVinyl");
const brandLogoWrap = document.getElementById("brandLogoWrap");

const toastEl = document.getElementById("toast");


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
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === "light" ? "🌙" : "☀️";
    themeToggleBtn.setAttribute("aria-label",
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
  }
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const theme = saved || getSystemTheme();
  applyTheme(theme);

  // Listen for system changes (only if no saved preference)
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
  coverArtEl.innerHTML = `<img src="icons/Just-Play-It 512.png" alt="">`;
  coverArtEl.classList.remove("cover-art-load");
  coverArtEl.setAttribute("aria-label", track ? track.title : "Now playing");
  coverArtEl.title = "";
  coverArtEl.style.cursor = "default";
}

function setCoverArtEmpty() {
  coverArtEl.innerHTML = `<span class="cover-art-icon" aria-hidden="true">📁</span><span class="cover-art-hint">Load</span>`;
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
  playerStatusEl.textContent = text;
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
    miniPlayer.classList.add("hidden");
    miniPlayerTitle.textContent = "Nothing loaded yet";
    miniPlayerMeta.textContent = "Ready";
    return;
  }

  miniPlayer.classList.remove("hidden");
  miniPlayerTitle.textContent = track.title;
  miniPlayerMeta.textContent =
    track.sourceType === "file" ? "Stored device file" : "URL audio";
  miniPlayPauseBtn.textContent = audio.paused ? "▶" : "⏸";
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
  const saved = Number(localStorage.getItem(STORAGE_KEYS.volume));
  const safeValue = Number.isFinite(saved)
    ? Math.min(1, Math.max(0, saved))
    : 1;
  audio.volume = safeValue;
  volumeSlider.value = String(safeValue);
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
  shuffleBtn.textContent = `Shuffle: ${shuffleEnabled ? "On" : "Off"}`;
  shuffleBtn.classList.toggle("active", shuffleEnabled);

  const repeatLabels = {
    off: "Off",
    all: "All",
    one: "One",
  };

  repeatBtn.textContent = `Repeat: ${repeatLabels[repeatMode] || "Off"}`;
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
      storageUsageText.textContent = `Stored device audio: ${formatBytes(deviceBytes)}. Browser usage: ${formatBytes(usage)} of ${formatBytes(quota)}.`;
    } else {
      storageUsageText.textContent = `Stored device audio: ${formatBytes(deviceBytes)}.`;
    }
  } catch (error) {
    console.error("Could not estimate storage:", error);
    storageUsageText.textContent = "Storage usage unavailable in this browser.";
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
  audio.load();

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

  if (currentTrackIndex === -1 && playlist.length > 0) {
    currentTrackIndex = 0;
    await loadTrack(0, false);
  } else {
    renderPlaylist();
    savePlaylistState();
  }

  await updateStorageUsage();
  setPlayerStatus(
    `${newTracks.length} file${newTracks.length === 1 ? "" : "s"} added and stored.`,
  );
  showToast(
    `${newTracks.length} file${newTracks.length === 1 ? "" : "s"} stored.`,
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
    loadTrack(0, false);
  } else {
    renderPlaylist();
    savePlaylistState();
  }

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
  const symbol = audio.paused ? "▶" : "⏸";
  playPauseBtn.textContent = symbol;
  miniPlayPauseBtn.textContent = symbol;
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
  savedPlaylistStatus.textContent = `Saved playlist: ${name}`;
  setPlayerStatus(`Saved playlist "${name}".`);
  showToast(`Saved playlist "${name}".`);
}

async function loadNamedPlaylist() {
  const name = savedPlaylistsSelect.value;

  if (!name || !savedPlaylists[name]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist first.";
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
  savedPlaylistStatus.textContent = `Loaded playlist: ${name}`;

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

  savedPlaylistStatus.textContent = `Renamed playlist to: ${cleanName}`;
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

  savedPlaylistStatus.textContent = `Deleted playlist: ${name}`;
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
    if (
      sleepTimerStatus.textContent !== "Sleep timer finished. Playback paused."
    ) {
      sleepTimerStatus.textContent = "No sleep timer set.";
    }
    sleepTimerSelect.value = "0";
    return;
  }

  const remainingMs = savedEnd - Date.now();
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  sleepTimerStatus.textContent = `Playback will pause in ${mins}:${secs.toString().padStart(2, "0")}.`;
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
      currentTrack.sourceType === "file" ? "Stored device file" : "URL stream",
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


savePlaylistBtn.addEventListener("click", saveNamedPlaylist);
loadPlaylistBtn.addEventListener("click", async () => loadNamedPlaylist());
renamePlaylistBtn.addEventListener("click", renameNamedPlaylist);
deletePlaylistBtn.addEventListener("click", deleteNamedPlaylist);
clearDeviceLibraryBtn.addEventListener("click", async () =>
  clearDeviceLibrary(),
);

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
  const name = savedPlaylistsSelect.value;
  if (name) {
    localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
    savedPlaylistStatus.textContent = `Selected saved playlist: ${name}`;
  } else {
    localStorage.removeItem(STORAGE_KEYS.selectedSavedPlaylist);
    savedPlaylistStatus.textContent = "No saved playlist selected.";
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

volumeSlider.addEventListener("input", () => {
  audio.volume = Number(volumeSlider.value);
  saveVolume();
});

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

  if (currentTrackIndex >= 0) {
    await loadTrack(currentTrackIndex, false);
  }
}

initApp();
