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

let playlist = [];
let currentTrackIndex = -1;

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

function savePlaylist() {
  const safePlaylist = playlist.map((track) => ({
    id: track.id,
    title: track.title,
    sourceType: track.sourceType,
    src: track.sourceType === "url" ? track.src : null,
  }));

  localStorage.setItem("justPlayItPlaylist", JSON.stringify(safePlaylist));
  localStorage.setItem(
    "justPlayItCurrentTrackIndex",
    String(currentTrackIndex),
  );
}

function loadPlaylist() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("justPlayItPlaylist") || "[]",
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
      localStorage.getItem("justPlayItCurrentTrackIndex"),
    );
    if (
      Number.isInteger(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < playlist.length
    ) {
      currentTrackIndex = savedIndex;
      loadTrack(currentTrackIndex, false);
    }
  } catch (error) {
    console.error("Could not load playlist:", error);
  }
}

function updateNowPlaying(track) {
  if (!track) {
    trackTitleEl.textContent = "Nothing loaded yet";
    trackMetaEl.textContent = "Add a file or paste an audio URL";
    return;
  }

  trackTitleEl.textContent = track.title;
  trackMetaEl.textContent =
    track.sourceType === "file" ? "Device file" : "Streaming from URL";
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

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "track-info-btn";
    infoBtn.innerHTML = `
      <span class="track-name">${escapeHtml(track.title)}</span>
      <span class="track-source">${track.sourceType === "file" ? "File" : "URL"}</span>
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

    li.appendChild(infoBtn);
    li.appendChild(actions);

    playlistEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  }

  renderPlaylist();
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
    savePlaylist();
    renderPlaylist();
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

  localStorage.removeItem("justPlayItPlaylist");
  localStorage.removeItem("justPlayItCurrentTrackIndex");

  renderPlaylist();
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
  loadTrack(nextIndex, true);
}

function playPrev() {
  if (playlist.length === 0) return;

  const prevIndex =
    currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
  loadTrack(prevIndex, true);
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
});

audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  } else {
    seekBar.value = 0;
  }
});

seekBar.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const seekTo = (Number(seekBar.value) / 100) * audio.duration;
  audio.currentTime = seekTo;
});

audio.addEventListener("play", updatePlayPauseButton);
audio.addEventListener("pause", updatePlayPauseButton);

audio.addEventListener("ended", () => {
  playNext();
});

window.addEventListener("beforeunload", savePlaylist);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

loadPlaylist();
renderPlaylist();
updatePlayPauseButton();
