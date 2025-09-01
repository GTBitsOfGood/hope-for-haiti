"use client";

import { useState } from "react";

type ApiClientOptions = Omit<RequestInit, 'method'>;

type HTTPRequestType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export async function apiRequest<T = unknown>(
  url: string,
  method: HTTPRequestType,
  options: ApiClientOptions = {}
): Promise<T> {
  // Determine if we should set Content-Type automatically
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  
  // Only set Content-Type to application/json if:
  // 1. No Content-Type is already specified in options.headers
  // 2. Body is not FormData (browser sets multipart/form-data automatically)
  if (!isFormData && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If response body is not JSON, use status + statusText
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  const data = await response.json();
  return data as T;
}

interface UseApiClientReturn {
  isLoading: boolean;
  apiClient: {
    get: <T = unknown>(url: string, options?: ApiClientOptions) => Promise<T>;
    post: <T = unknown>(url: string, options?: ApiClientOptions) => Promise<T>;
    put: <T = unknown>(url: string, options?: ApiClientOptions) => Promise<T>;
    delete: <T = unknown>(url: string, options?: ApiClientOptions) => Promise<T>;
    patch: <T = unknown>(url: string, options?: ApiClientOptions) => Promise<T>;
  };
}

export function useApiClient(): UseApiClientReturn {
  const [isLoading, setIsLoading] = useState(false);

  const createApiMethod = (method: HTTPRequestType) => 
    async <T = unknown>(url: string, options?: ApiClientOptions): Promise<T> => {
      try {
        setIsLoading(true);
        const result = await apiRequest<T>(url, method, options);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

  const apiClient = {
    get: createApiMethod('GET'),
    post: createApiMethod('POST'),
    put: createApiMethod('PUT'),
    delete: createApiMethod('DELETE'),
    patch: createApiMethod('PATCH'),
  };

  return {
    isLoading,
    apiClient,
  };
}

export type { ApiClientOptions, HTTPRequestType };
