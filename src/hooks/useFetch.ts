"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);
  const fetchOptionsRef = useRef<RequestInit>(fetchOptions);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { fetchOptionsRef.current = fetchOptions; }, [fetchOptions]);

  const fetchData = useCallback(async (overrideOptions?: Partial<RequestInit>) => {
    if (!conditionalFetch) return;

    try {
      setIsLoading(true);
      setError(null);

      const baseOptions = fetchOptionsRef.current;
      const finalOptions = overrideOptions ? { ...baseOptions, ...overrideOptions } : baseOptions;
      const method = (finalOptions['method'] ?? 'GET') as HTTPRequestType;
      const result = await apiRequest<T>(endpoint, method, finalOptions);

      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error(`Failed to fetch ${endpoint}:`, err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [conditionalFetch, endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback((overrideOptions?: Partial<RequestInit>) => {
    fetchData(overrideOptions);
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
