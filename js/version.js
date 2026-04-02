// ────────────────────────────────────────────────────────────
// JUST PLAY IT. — Version source of truth
//
// ► EDIT THIS FILE ONLY when you want to bump the version.
//   All other files (service-worker, UI labels) derive from here.
// ────────────────────────────────────────────────────────────

const APP_VERSION = "V.90";
const APP_BUILD_DATE = "02APR2026";
const APP_BUILD_TIME = "14:18";

// Derived composite string used in the UI
// Format: "BUILD V.90 — 02APR2026 — 14:18"
const BUILD_LABEL = `${APP_VERSION} — ${APP_BUILD_DATE} — ${APP_BUILD_TIME}`;
