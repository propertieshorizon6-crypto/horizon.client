/**
 * Role helpers for the client app.
 *
 * Admins and managers may use the client portal with their own credentials to
 * access the full client interface. They are treated as "privileged" so the
 * client-only gates (email verification, etc.) don't block them.
 */

const PRIVILEGED_ROLES = ["admin", "manager"];

export const isPrivilegedRole = (role) => PRIVILEGED_ROLES.includes(role);

/**
 * Single source of truth for the email-verification gate.
 *
 * Only a definite `false` blocks. A user object that simply doesn't carry the
 * field (older stored snapshot, a trimmed API response) is "unknown", not
 * "unverified" — treating unknown as unverified used to bounce already-verified
 * users to /verify-email.
 */
export const needsEmailVerification = (user) =>
  user?.emailVerification === false && !isPrivilegedRole(user?.role);

/**
 * A user counts as verified for client-portal gating unless we positively know
 * their email is unverified, or they are a privileged (admin/manager) account.
 */
export const isVerifiedForClientPortal = (user) => !needsEmailVerification(user);
