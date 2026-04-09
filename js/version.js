// ────────────────────────────────────────────────────────────
// JUST PLAY IT. — Version source of truth
//
// ► EDIT THIS FILE ONLY when you want to bump the version.
//   All other files (service-worker, UI labels) derive from here.
// ────────────────────────────────────────────────────────────

const APP_VERSION = "V.2.6.7";
const APP_BUILD_DATE = "09APR2026";
const APP_BUILD_TIME = "3:26";

// Derived composite string used in the UI
// Format: "BUILD V.92 — 03APR2026 — 20:47"
const BUILD_LABEL = `${APP_VERSION} <span class="accent-dash">—</span> ${APP_BUILD_DATE} <span class="accent-dash">—</span> ${APP_BUILD_TIME}`;
