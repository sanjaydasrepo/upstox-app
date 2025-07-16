import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default stale time
      retry: 2,
      refetchOnWindowFocus: false,
      // Parallel loading optimizations
      refetchOnMount: false, // Don't refetch if data is fresh
      refetchInterval: false, // No automatic polling by default
      // Network optimization
      networkMode: 'online', // Only run queries when online
    },
  },
});
