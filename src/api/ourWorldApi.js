import axiosInstance from './axiosInstance';

/**
 * Get the active "Our World" logos.
 * GET /api/v1/our-world
 * PUBLIC
 */
export const getOurWorldLogos = async () => {
  try {
    const response = await axiosInstance.get('/our-world');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Our World logos');
  }
};
