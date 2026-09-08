import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = error as unknown as ApiError;
        if (apiError?.status && apiError.status < 500 && apiError.status !== 429) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
