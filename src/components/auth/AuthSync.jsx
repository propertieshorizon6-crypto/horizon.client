
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { syncAuthState, updateUser } from "../../store/slices/authSlice";
import { getCurrentUser } from "../../api/authApi";
import { getTokens } from "../../utils/token";
import {
  broadcastAuthReload,
  handleAuthReloadSignal,
  hasGatingChange,
} from "../../utils/authReload";

// Don't re-hit /auth/me on every tab switch.
const SERVER_SYNC_INTERVAL = 60 * 1000;

/**
 * AuthSync Component
 *
 * Handles:
 * 1. Initial auth state sync from localStorage
 * 2. Refreshing the stored user from the server (see syncFromServer)
 * 3. Cross-tab synchronization
 * 4. Logout when both tokens deleted manually
 */
export default function AuthSync() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const lastServerSyncRef = useRef(0);

  // Read inside the sync callback without making it a dependency — otherwise
  // every user update would rebuild the callback and re-fire the sync effect.
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─── Initial Sync on Mount ────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(syncAuthState());
  }, [dispatch]);

  // ─── Server Sync (fields that can change outside this device) ─────────────────

  /**
   * The stored user is a snapshot taken at login. Anything changed elsewhere —
   * most importantly email verification done on another device — would other-
   * wise stay stale here until the next login, and keep the client-side gates
   * (booking, /verify-email redirect) firing at an already-verified account.
   *
   * Failures are ignored on purpose: a 401 is the axios interceptor's job, and
   * an offline boot should leave the existing snapshot alone.
   */
  const syncFromServer = useCallback(async () => {
    lastServerSyncRef.current = Date.now();

    try {
      const response = await getCurrentUser();
      const serverUser = response?.data;

      if (!serverUser?.email) return;

      const gatingChanged = hasGatingChange(userRef.current, serverUser);

      dispatch(updateUser({
        ...serverUser,
        // ProfileHeader reads `verified`; keep it in step with the source field.
        verified: serverUser.emailVerification === true,
      }));

      // Verified (or promoted, or suspended) somewhere else — every page in
      // every tab was rendered against the old answer. Reload them all.
      if (gatingChanged) broadcastAuthReload();
    } catch {
      lastServerSyncRef.current = 0; // let the next opportunity retry
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      lastServerSyncRef.current = 0;
      return;
    }

    if (Date.now() - lastServerSyncRef.current < SERVER_SYNC_INTERVAL) return;

    syncFromServer();
  }, [isAuthenticated, syncFromServer]);

  // Returning to the tab is the moment a verification done elsewhere is most
  // likely to have just happened.
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastServerSyncRef.current < SERVER_SYNC_INTERVAL) return;

      syncFromServer();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, syncFromServer]);

  // ─── Cross-Tab Synchronization ────────────────────────────────────────────────

  useEffect(() => {
    const handleStorageChange = (e) => {
      // A reload signal supersedes everything else — this tab is going away.
      if (handleAuthReloadSignal(e)) return;

      if (e.key === "accessToken" || e.key === "refreshToken" || e.key === "user") {
        dispatch(syncAuthState());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // ─── Detect Both Tokens Deletion (Logout Trigger) ─────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check every second for both tokens deletion
    const interval = setInterval(() => {
      const { accessToken, refreshToken } = getTokens();

      // If both tokens missing while authenticated → Force logout
      if (!accessToken && !refreshToken && isAuthenticated) {
        dispatch(syncAuthState());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

  return null; // This component doesn't render anything
}
