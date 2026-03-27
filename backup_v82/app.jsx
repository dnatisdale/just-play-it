/**
 * JUST PLAY IT. — Main Entry Point
 *
 * This file is intentionally minimal. The application logic is split into
 * logical modules inside /js/ for easier maintainability:
 *
 *   js/constants.js  — DOM refs, ICONS, STORAGE_KEYS, DB constants, global state
 *   js/utils.js      — Error logging, theme, cover art, formatting, badges, sidebar order
 *   js/db.js         — IndexedDB helpers (open, get, put, delete, clear)
 *   js/library.js    — Sidebar library rendering, deleteStoredTrack
 *   js/playlist.js   — Playlist CRUD, save/load/rename/delete, import/export
 *   js/player.js     — Playback, shuffle/repeat, sleep timer, media session, install
 *   js/main.js       — Event listeners, initApp(), audio events, QR, service worker
 *
 * Scripts are loaded via <script> tags in index.html in dependency order.
 * This file is kept as the last script tag for any future entry-point logic.
 */
