const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const addUrlBtn = document.getElementById("addUrlBtn");
const playlistEl = document.getElementById("playlist");
const clearPlaylistBtn = document.getElementById("clearPlaylistBtn");

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const trackTitleEl = document.getElementById("trackTitle");
const trackMetaEl = document.getElementById("trackMeta");
const coverArtEl = document.getElementById("coverArt");

const volumeSlider = document.getElementById("volumeSlider");
const sleepTimerSelect = document.getElementById("sleepTimerSelect");
const setSleepTimerBtn = document.getElementById("setSleepTimerBtn");
const sleepTimerStatus = document.getElementById("sleepTimerStatus");

const STORAGE_KEYS = {
  playlist: "justPlayItPlaylist",
  currentTrackIndex: "justPlayItCurrentTrackIndex",
  currentTime: "justPlayItCurrentTime",
  volume: "justPlayItVolume",
  sleepTimerEnd: "justPlayItSleepTimerEnd",
};

let playlist = [];
let currentTrackIndex = -1;
let pendingRestoreTime = null;
let sleepTimerInterval = null;
let sleepTimerTimeout = null;

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

function updateNowPlaying(track) {
  if (!track) {
    trackTitleEl.textContent = "Nothing loaded yet";
    trackMetaEl.textContent = "Add a file or paste an audio URL";
    coverArtEl.textContent = "♪";
    return;
  }

  trackTitleEl.textContent = track.title;
  trackMetaEl.textContent =
    track.sourceType === "file" ? "Device file" : "Streaming from URL";
  coverArtEl.textContent = getTrackEmoji(track);
}

function savePlaylist() {
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
  savePlaylist();

  if (shouldPlay) {
    audio
      .play()
      .then(() => {
        updatePlayPauseButton();
      })
      .catch((error) => {
        console.error("Playback failed:", error);
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

  if (currentTrackIndex === -1 && playlist.length > 0) {
    currentTrackIndex = 0;
    loadTrack(0, false);
  } else {
    renderPlaylist();
  }
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

  if (currentTrackIndex === -1) {
    currentTrackIndex = 0;
    loadTrack(0, false);
  } else {
    renderPlaylist();
    savePlaylist();
  }

  urlInput.value = "";
}

function removeTrack(index) {
  if (index < 0 || index >= playlist.length) return;

  const wasCurrent = index === currentTrackIndex;
  playlist.splice(index, 1);

  if (playlist.length === 0) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    currentTrackIndex = -1;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    seekBar.value = 0;
    localStorage.removeItem(STORAGE_KEYS.currentTime);
    savePlaylist();
    renderPlaylist();
    updatePlayPauseButton();
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
  savePlaylist();
}

function clearPlaylist() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  playlist = [];
  currentTrackIndex = -1;
  seekBar.value = 0;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  localStorage.removeItem(STORAGE_KEYS.playlist);
  localStorage.removeItem(STORAGE_KEYS.currentTrackIndex);
  localStorage.removeItem(STORAGE_KEYS.currentTime);

  renderPlaylist();
  updatePlayPauseButton();
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
    })
    .catch((error) => {
      console.error("Playback failed:", error);
    });
}

function pauseCurrent() {
  audio.pause();
  updatePlayPauseButton();
}

function playNext() {
  if (playlist.length === 0) return;

  const nextIndex =
    currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
  pendingRestoreTime = null;
  loadTrack(nextIndex, true);
}

function playPrev() {
  if (playlist.length === 0) return;

  const prevIndex =
    currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
  pendingRestoreTime = null;
  loadTrack(prevIndex, true);
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

audio.addEventListener("play", updatePlayPauseButton);
audio.addEventListener("pause", updatePlayPauseButton);

audio.addEventListener("ended", () => {
  pendingRestoreTime = null;
  localStorage.removeItem(STORAGE_KEYS.currentTime);
  playNext();
});

window.addEventListener("beforeunload", () => {
  savePlaylist();
  savePlaybackState();
  saveVolume();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

loadVolume();
loadPlaylist();
restoreSleepTimer();
renderPlaylist();
updatePlayPauseButton();
