// Service workers are intentionally NOT used on this site anymore.
// An earlier version cached files aggressively and kept serving old
// versions after new deploys, which caused real problems. assets/js/app.js
// now actively unregisters any leftover service worker on every page load,
// so this file does nothing on purpose. Safe to delete later if you like.
