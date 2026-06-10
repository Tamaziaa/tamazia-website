// LEGACY PATH — the cockpit moved to the React build at /admin (loads /admin/cockpit-v2/*).
// This file now only ever runs when a STALE cached /admin/index.html (which referenced the
// old /admin/cockpit/app.js) is served from a browser/edge cache. When that happens, force a
// clean upgrade so the founder always lands on the current cockpit. The old admin is preserved
// verbatim at /admin/legacy/ for fallback.
(function () {
  try { if ('caches' in window) caches.keys().then(ks => ks.forEach(k => caches.delete(k))); } catch (e) {}
  try { if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); } catch (e) {}
  // cache-busting query forces a fresh fetch of /admin/index.html (the current React shell)
  try { location.replace('/admin/?fresh=' + Date.now()); } catch (e) { location.href = '/admin/'; }
})();
