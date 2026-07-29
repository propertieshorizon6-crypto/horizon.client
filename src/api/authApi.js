import { apiPost, apiGet } from "./apiHelper";

export const registerUser = (payload) =>
  apiPost("/auth/register", payload);

export const loginUser = (payload, ) =>
  apiPost("/auth/login", payload);

export const logoutUser = (refreshToken) =>
  apiPost("/auth/logout", { refreshToken });

export const getCurrentUser = () =>
  apiGet("/auth/me");

// Prefer refreshAccessToken() from ./refreshClient — it is single-flight.
// skipAuthRefresh stops a 401 here from re-entering the refresh interceptor.
export const refresh = (refreshToken) =>
  apiPost("/auth/refresh", { refreshToken }, { skipAuthRefresh: true });

export const forgotPassword = (email) =>
  apiPost("/auth/forgot-password", { email, portal: "client" });

export const resetPassword = (payload, config = {}) =>
  apiPost("/auth/reset-password", payload, config);

export const changePassword = (payload, config = {}) =>
  apiPost("/auth/change-password", payload, config);

export const verifyEmail = (payload) =>
  apiPost("/auth/verify-email", payload);

export const resendVerification = () =>
  apiPost("/auth/resend-verification");

