/**
 * Cross-tab hard reload on auth change.
 *
 * When the fields that decide what a user is *allowed* to do change (email
 * verification, role, account status), every open tab is showing a page it
 * rendered under the old answer. Rather than teach each page to react, we do
 * what accounts.google.com does: reload them.
 *
 * The signal is a localStorage write — `storage` events fire in every other tab
 * of the same origin, which is exactly the audience we want. The writing tab
 * does not receive its own event, so it reloads itself explicitly.
 */

const RELOAD_SIGNAL_KEY = "authReloadAt";

// Fields whose change invalidates what's on screen. Ignore everything else so a
// renamed profile or a new avatar doesn't blow away the page.
const GATING_FIELDS = ["emailVerification", "role", "status"];

/** True when the server user differs from the stored one in a gating field. */
export const hasGatingChange = (storedUser, serverUser) => {
  if (!storedUser || !serverUser) return false;

  return GATING_FIELDS.some(
    (field) =>
      serverUser[field] !== undefined && storedUser[field] !== serverUser[field],
  );
};

/**
 * Tell every other tab to reload, and optionally reload this one.
 *
 * `reloadSelf: false` is for the tab that already rendered the change correctly
 * — the verification success screen, for instance, which would be destroyed by
 * a reload the user never asked for.
 */
export const broadcastAuthReload = ({ reloadSelf = true } = {}) => {
  try {
    localStorage.setItem(RELOAD_SIGNAL_KEY, String(Date.now()));
  } catch {
    // Private mode / storage full — the reload below still fixes this tab.
  }

  if (reloadSelf) window.location.reload();
};

/**
 * Handle a `storage` event that might be a reload signal.
 *
 * Signals written before this document loaded are ignored. That matters when
 * two tabs detect the same change at once: each broadcasts, each would other-
 * wise reload a second time on the other's now-stale signal.
 */
export const handleAuthReloadSignal = (event) => {
  if (event.key !== RELOAD_SIGNAL_KEY || !event.newValue) return false;

  const signalledAt = Number(event.newValue);
  if (!Number.isFinite(signalledAt)) return false;

  const loadedAt = performance.timeOrigin ?? 0;
  if (signalledAt < loadedAt) return false;

  window.location.reload();
  return true;
};
