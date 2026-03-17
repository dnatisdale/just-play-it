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

const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const trackTitleEl = document.getElementById("trackTitle");
const trackMetaEl = document.getElementById("trackMeta");
const coverArtEl = document.getElementById("coverArt");
const playerStatusEl = document.getElementById("playerStatus");

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
const savedPlaylistStatus = document.getElementById("savedPlaylistStatus");
const playlistNameDisplay = document.getElementById("playlistNameDisplay");

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
};

let playlist = [];
let currentTrackIndex = -1;
let pendingRestoreTime = null;
let sleepTimerInterval = null;
let sleepTimerTimeout = null;
let shuffleEnabled = false;
let repeatMode = "off";
let savedPlaylists = {};
let currentPlaylistName = "";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function updatePlaylistNameDisplay() {
  playlistNameDisplay.textContent = `Current playlist: ${currentPlaylistName || "Unsaved"}`;
  localStorage.setItem(STORAGE_KEYS.currentPlaylistName, currentPlaylistName);
}

function updateNowPlaying(track) {
  if (!track) {
    trackTitleEl.textContent = "Nothing loaded yet";
    trackMetaEl.textContent = "Add a file or paste an audio URL";
    coverArtEl.textContent = "♪";
    setPlayerStatus("Ready when you are.");
    return;
  }

  trackTitleEl.textContent = track.title;
  trackMetaEl.textContent =
    track.sourceType === "file" ? "Device file" : "Streaming from URL";
  coverArtEl.textContent = getTrackEmoji(track);

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
}

function savePlaylistState() {
  const safePlaylist = playlist.map((track) => ({
    id: track.id,
    title: track.title,
    sourceType: track.sourceType,
    src: track.sourceType === "url" ? track.src : null,
  }));

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

  if (
    currentTrackIndex >= 0 &&
    currentTrackIndex < playlist.length &&
    playlist[currentTrackIndex]?.sourceType === "url"
  ) {
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

function loadPlaylist() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.playlist) || "[]",
    );
    if (!Array.isArray(saved)) return;

    playlist = saved
      .filter((track) => track && track.sourceType === "url" && track.src)
      .map((track) => ({
        id: track.id || crypto.randomUUID(),
        title: track.title || "URL Audio",
        sourceType: "url",
        src: track.src,
      }));

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
      loadTrack(currentTrackIndex, false);
    }
  } catch (error) {
    console.error("Could not load playlist:", error);
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = "";

  if (playlist.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Your playlist is empty.";
    playlistEl.appendChild(empty);
    updateNowPlaying(null);
    return;
  }

  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "playlist-item";
    if (index === currentTrackIndex) {
      li.classList.add("active");
    }

    const thumb = document.createElement("div");
    thumb.className = "track-thumb";
    thumb.textContent = getTrackEmoji(track);

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "track-info-btn";
    infoBtn.innerHTML = `
      <span class="track-name">${escapeHtml(track.title)}</span>
      <span class="track-source">${track.sourceType === "file" ? "File from device" : "Audio from URL"}</span>
    `;
    infoBtn.addEventListener("click", () => {
      loadTrack(index, true);
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "small-btn";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => {
      loadTrack(index, true);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small-btn remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      removeTrack(index);
    });

    actions.appendChild(playBtn);
    actions.appendChild(removeBtn);

    li.appendChild(thumb);
    li.appendChild(infoBtn);
    li.appendChild(actions);

    playlistEl.appendChild(li);
  });
}

function loadTrack(index, shouldPlay = false) {
  if (index < 0 || index >= playlist.length) return;

  currentTrackIndex = index;
  const track = playlist[index];

  audio.src = track.src;
  audio.load();

  updateNowPlaying(track);
  renderPlaylist();
  savePlaylistState();

  if (shouldPlay) {
    audio
      .play()
      .then(() => {
        updatePlayPauseButton();
        setPlayerStatus(`Playing: ${track.title}`);
      })
      .catch((error) => {
        console.error("Playback failed:", error);
        setPlayerStatus("Playback could not start.");
      });
  } else {
    updatePlayPauseButton();
  }
}

function addFileTracks(files) {
  const newTracks = Array.from(files).map((file) => ({
    id: crypto.randomUUID(),
    title: file.name,
    sourceType: "file",
    src: URL.createObjectURL(file),
  }));

  playlist.push(...newTracks);
  currentPlaylistName = "";
  updatePlaylistNameDisplay();

  if (currentTrackIndex === -1 && playlist.length > 0) {
    currentTrackIndex = 0;
    loadTrack(0, false);
  } else {
    renderPlaylist();
    savePlaylistState();
  }

  setPlayerStatus(
    `${newTracks.length} file${newTracks.length === 1 ? "" : "s"} added.`,
  );
}

function addUrlTrack(url) {
  const trimmed = url.trim();
  if (!trimmed) return;

  try {
    new URL(trimmed);
  } catch {
    alert("That does not look like a valid URL.");
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
}

function clearPlaylist() {
  audio.pause();
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
}

function updatePlayPauseButton() {
  playPauseBtn.textContent = audio.paused ? "▶" : "⏸";
}

function playCurrent() {
  if (playlist.length === 0) return;

  if (currentTrackIndex === -1) {
    loadTrack(0, true);
    return;
  }

  audio
    .play()
    .then(() => {
      updatePlayPauseButton();
      setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
    })
    .catch((error) => {
      console.error("Playback failed:", error);
      setPlayerStatus("Playback could not start.");
    });
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

function playNext() {
  if (playlist.length === 0) return;

  let nextIndex;

  if (shuffleEnabled) {
    nextIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    nextIndex =
      currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
  }

  pendingRestoreTime = null;
  loadTrack(nextIndex, true);
}

function playPrev() {
  if (playlist.length === 0) return;

  let prevIndex;

  if (shuffleEnabled) {
    prevIndex = getRandomTrackIndex(currentTrackIndex);
  } else {
    prevIndex =
      currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
  }

  pendingRestoreTime = null;
  loadTrack(prevIndex, true);
}

function toggleShuffle() {
  shuffleEnabled = !shuffleEnabled;
  saveModes();
  updateModeButtons();
  updateNowPlaying(playlist[currentTrackIndex] || null);
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
}

function saveNamedPlaylist() {
  const name = playlistNameInput.value.trim();

  if (!name) {
    savedPlaylistStatus.textContent = "Please enter a playlist name first.";
    return;
  }

  const urlTracks = playlist
    .filter((track) => track.sourceType === "url" && track.src)
    .map((track) => ({
      id: track.id,
      title: track.title,
      sourceType: track.sourceType,
      src: track.src,
    }));

  if (urlTracks.length === 0) {
    savedPlaylistStatus.textContent = "Only URL tracks can be saved right now.";
    return;
  }

  savedPlaylists[name] = {
    name,
    tracks: urlTracks,
    savedAt: new Date().toISOString(),
  };

  currentPlaylistName = name;
  updatePlaylistNameDisplay();
  persistSavedPlaylists();
  savedPlaylistsSelect.value = name;
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
  savedPlaylistStatus.textContent = `Saved playlist: ${name}`;
}

function loadNamedPlaylist() {
  const name = savedPlaylistsSelect.value;

  if (!name || !savedPlaylists[name]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist first.";
    return;
  }

  const saved = savedPlaylists[name];
  playlist = saved.tracks.map((track) => ({
    id: track.id || crypto.randomUUID(),
    title: track.title || "URL Audio",
    sourceType: "url",
    src: track.src,
  }));

  currentTrackIndex = playlist.length > 0 ? 0 : -1;
  currentPlaylistName = name;
  updatePlaylistNameDisplay();

  savePlaylistState();
  localStorage.setItem(STORAGE_KEYS.selectedSavedPlaylist, name);
  savedPlaylistStatus.textContent = `Loaded playlist: ${name}`;

  if (currentTrackIndex >= 0) {
    pendingRestoreTime = null;
    loadTrack(0, false);
  } else {
    renderPlaylist();
    updatePlayPauseButton();
  }

  setPlayerStatus(`Loaded saved playlist: ${name}`);
}

function renameNamedPlaylist() {
  const oldName = savedPlaylistsSelect.value;

  if (!oldName || !savedPlaylists[oldName]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist to rename.";
    return;
  }

  const newName = prompt("Rename playlist:", oldName);
  if (newName === null) return;

  const cleanName = newName.trim();
  if (!cleanName) {
    savedPlaylistStatus.textContent = "Playlist name cannot be empty.";
    return;
  }

  if (cleanName !== oldName && savedPlaylists[cleanName]) {
    savedPlaylistStatus.textContent = "That playlist name already exists.";
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
}

function deleteNamedPlaylist() {
  const name = savedPlaylistsSelect.value;

  if (!name || !savedPlaylists[name]) {
    savedPlaylistStatus.textContent = "Choose a saved playlist to delete.";
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
}

function setSleepTimer(minutes) {
  clearSleepTimer();

  if (!minutes || minutes <= 0) {
    sleepTimerStatus.textContent = "No sleep timer set.";
    localStorage.removeItem(STORAGE_KEYS.sleepTimerEnd);
    sleepTimerSelect.value = "0";
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
    },
    minutes * 60 * 1000,
  );

  sleepTimerInterval = window.setInterval(updateSleepTimerStatus, 1000);
  updateSleepTimerStatus();
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
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
      sleepTimerInterval = null;
    }
    if (sleepTimerTimeout) {
      clearTimeout(sleepTimerTimeout);
      sleepTimerTimeout = null;
    }
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
  sleepTimerStatus.textContent = `Playback will pause in ${mins}:${secs
    .toString()
    .padStart(2, "0")}.`;
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
  }, remainingMs);

  sleepTimerInterval = window.setInterval(updateSleepTimerStatus, 1000);
  sleepTimerSelect.value = String(approxMinutes);
  updateSleepTimerStatus();
}

fileInput.addEventListener("change", (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  addFileTracks(files);
  fileInput.value = "";
});

addUrlBtn.addEventListener("click", () => {
  addUrlTrack(urlInput.value);
});

urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addUrlTrack(urlInput.value);
  }
});

clearPlaylistBtn.addEventListener("click", () => {
  clearPlaylist();
});

playPauseBtn.addEventListener("click", () => {
  if (!audio.src) {
    playCurrent();
    return;
  }

  if (audio.paused) {
    playCurrent();
  } else {
    pauseCurrent();
  }
});

nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrev);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeatMode);

savePlaylistBtn.addEventListener("click", saveNamedPlaylist);
loadPlaylistBtn.addEventListener("click", loadNamedPlaylist);
renamePlaylistBtn.addEventListener("click", renameNamedPlaylist);
deletePlaylistBtn.addEventListener("click", deleteNamedPlaylist);

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
  if (playlist[currentTrackIndex]) {
    setPlayerStatus(`Playing: ${playlist[currentTrackIndex].title}`);
  }
});

audio.addEventListener("pause", () => {
  updatePlayPauseButton();
  if (audio.currentTime > 0 && !audio.ended) {
    setPlayerStatus("Playback paused.");
  }
});

audio.addEventListener("ended", () => {
  pendingRestoreTime = null;
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error("Replay failed:", error);
    });
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
    playNext();
  }
});

window.addEventListener("beforeunload", () => {
  savePlaylistState();
  savePlaybackState();
  saveVolume();
  saveModes();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

loadVolume();
loadModes();
loadSavedPlaylists();
loadPlaylist();
restoreSleepTimer();
renderPlaylist();
updatePlayPauseButton();
updateNowPlaying(playlist[currentTrackIndex] || null);
