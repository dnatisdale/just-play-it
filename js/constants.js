// ── Version ────────────────────────────────────────────────
// BUILD_LABEL, APP_VERSION, APP_BUILD_DATE, APP_BUILD_TIME
// are defined in js/version.js (loaded first in index.html).
// Do NOT define them here — edit js/version.js instead.
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
const sleepTimerBtn = document.getElementById("sleepTimerBtn");
const sleepTimerStatus = document.getElementById("sleepTimerStatus");

const playlistNameInput = document.getElementById("playlistNameInput");
const savePlaylistBtn = document.getElementById("savePlaylistBtn");
const clearDeviceLibraryBtn = document.getElementById("clearDeviceLibraryBtn");
const exportPlaylistsBtn = document.getElementById("exportPlaylistsBtn");
const importPlaylistsInput = document.getElementById("importPlaylistsInput");
const savedPlaylistStatus = document.getElementById("savedPlaylistStatus");
const jumpToCurrentBtn = document.getElementById("jumpToCurrentBtn");
const toggleEditBtn = document.getElementById("toggleEditBtn");
const selectionActionBar = document.getElementById("selectionActionBar");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");
const addLibraryToPlaylistBtn = document.getElementById("addLibraryToPlaylistBtn");


// Containers for tooltips (decluttering)
const savedPlaylistBox = document.getElementById("savedPlaylistBox");
const playlistHeader = document.getElementById("playlistHeader");
const currentPlaylistHeaderBtn = document.getElementById("currentPlaylistHeaderBtn");
const playlistContainer = document.getElementById("playlistContainer");
const sleepRow = document.querySelector(".sleep-row");

// Update active playlist controls (SAVED PLAYLISTS card)
const updatePlaylistBtn       = document.getElementById("updatePlaylistBtn");
const updatePlaylistRow       = document.getElementById("updatePlaylistRow");
const activePlaylistPillName  = document.getElementById("activePlaylistPillName");
const activePlaylistPillBadge = document.getElementById("activePlaylistPillBadge");

// CURRENT QUEUE toolbar pill
const queuePlaylistPill      = document.getElementById("queuePlaylistPill");
const queuePlaylistPillName  = document.getElementById("queuePlaylistPillName");
const queuePlaylistPillBadge = document.getElementById("queuePlaylistPillBadge");

const brandLogoWrap = document.getElementById("brandLogoWrap");

// Settings / topbar elements
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const shuffleBtnLabel = document.getElementById("shuffleBtnLabel");
const shuffleToggle = document.getElementById("shuffleToggle");
const shareAppBtn = document.getElementById("shareAppBtn");
const copyQrBtn = document.getElementById("copyQrBtn");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const viewErrorLogBtn = document.getElementById("viewErrorLogBtn");

// Badges
const libraryBadge = document.getElementById("libraryBadge");
const savedPlaylistsBadge = document.getElementById("savedPlaylistsBadge");
const playlistBadge = document.getElementById("playlistBadge");
const nowPlayingPlaylistName = document.getElementById("nowPlayingPlaylistName");
const nowPlayingPlaylistBadge = document.getElementById("nowPlayingPlaylistBadge");
const nowPlayingPlaylistInfo = document.getElementById("nowPlayingPlaylistInfo");

const dragOverlay = document.getElementById("dragOverlay"); // Kept just in case any safety fallback references it
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
  record:  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
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
  errorLogs: "justPlayItErrorLogs",
  defaultPlaylist: "justPlayItDefaultPlaylist"
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
let sleepTimerMinutes = 0;
let shuffleEnabled = false;
let repeatMode = "off";
let savedPlaylists = {};
let currentPlaylistName = "";
let selectedLibraryTracks = new Set();
let resumeRetries = 0;
let deferredInstallPrompt = null;
let currentObjectUrl = null;
let toastTimeout = null;
let draggedTrackIndex = null;
let isEditMode = false;
let userPaused = false;
let isTransitioning = false;
let selectedPlaylistKey = ""; // Tracks the active saved playlist WITHOUT showing it in the select

// Legacy / Phase 2 migration guard for dropdown elements removed from DOM
const savedPlaylistsSelect = document.getElementById("savedPlaylistsSelect");

