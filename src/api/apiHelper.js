import axiosInstance from "./axiosInstance";

const handleResponse = (response) => response.data;

const handleError = (error) => {
  // The API returns { success: false, error: { code, message } } — `error` is
  // an object, so reading it directly yields "[object Object]" and hides every
  // real failure behind "Something went wrong".
  const apiError = error?.response?.data?.error;

  const message =
    apiError?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong";

  // Reject with a real Error so `instanceof Error` and stack traces work, but
  // keep code/details/status so ErrorBanner can still list field errors.
  const normalized = new Error(message);
  normalized.code = apiError?.code || null;
  normalized.details = apiError?.details || [];
  normalized.status = error?.response?.status ?? null;

  return Promise.reject(normalized);
};

export const apiGet = (url, config = {}) =>
  axiosInstance.get(url, config).then(handleResponse).catch(handleError);

export const apiPost = (url, data, config = {}) =>
  axiosInstance.post(url, data, config).then(handleResponse).catch(handleError);

export const apiPut = (url, data, config = {}) =>
  axiosInstance.put(url, data, config).then(handleResponse).catch(handleError);

export const apiDelete = (url, config = {}) =>
  axiosInstance.delete(url, config).then(handleResponse).catch(handleError);