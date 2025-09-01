"use client";

import { useEffect, useState } from "react";
import { apiRequest, HTTPRequestType } from "./useApiClient";


interface UseFetchOptions<T> extends RequestInit {
  conditionalFetch?: boolean;
  onSuccess?: (data: T) => void; 
  onError?: (error: string) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: (overrideOptions?: Partial<RequestInit>) => void;
}

export function useFetch<T = unknown>(
  endpoint: string,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { conditionalFetch = true, onSuccess, onError, ...fetchOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(conditionalFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (overrideOptions?: Partial<RequestInit>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const finalOptions = overrideOptions ? { ...fetchOptions, ...overrideOptions } : fetchOptions;
      const result = await apiRequest<T>(endpoint, (finalOptions['method'] ?? 'GET') as HTTPRequestType, finalOptions);
      console.log('result', result);

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error(`Failed to fetch ${endpoint}:`, err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conditionalFetch) {
      fetchData();
    }
  }, [endpoint, conditionalFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = (overrideOptions?: Partial<RequestInit>) => {
    fetchData(overrideOptions);
  };

  return { data, isLoading, error, refetch };
}
