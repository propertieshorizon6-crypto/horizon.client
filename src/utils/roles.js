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
 * A user counts as verified for client-portal gating if their email is verified
 * OR they are a privileged (admin/manager) account.
 */
export const isVerifiedForClientPortal = (user) =>
  user?.emailVerification === true || isPrivilegedRole(user?.role);
