import { useQuery } from '@tanstack/react-query';
import { getOurWorldLogos } from '../api/ourWorldApi';

/**
 * Fetch the admin-managed "Our World" logos for the Explore page.
 * Returns the raw list; the component maps/falls back as needed.
 */
export function useOurWorld(options = {}) {
  return useQuery({
    queryKey: ['ourWorld'],
    queryFn: async () => {
      const res = await getOurWorldLogos();
      return res?.data?.logos ?? [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

export default useOurWorld;
