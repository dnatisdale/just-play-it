// ────────────────────────────────────────────────────────────
// JUST PLAY IT. — Version source of truth
//
// ► EDIT THIS FILE ONLY when you want to bump the version.
//   All other files (service-worker, UI labels) derive from here.
// ────────────────────────────────────────────────────────────

const APP_VERSION = "V.92";
const APP_BUILD_DATE = "03APR2026";
const APP_BUILD_TIME = "10:25";

// Derived composite string used in the UI
// Format: "BUILD V.92 — 03APR2026 — 10:25"
const BUILD_LABEL = `${APP_VERSION} — ${APP_BUILD_DATE} — ${APP_BUILD_TIME}`;
