"use client";

import { useCallback, useMemo, useRef, useState } from "react";

interface StreamChunkMeta {
  chunkIndex: number;
  response: Response;
}

type StreamChunkParser<TChunk> = (
  chunk: string,
  meta: StreamChunkMeta
) => TChunk;

interface StreamResult<TChunk> {
  response: Response;
  chunks: TChunk[];
}

interface StreamClientOptions<TChunk> extends Omit<RequestInit, "signal"> {
  encoding?: string;
  parseChunk?: StreamChunkParser<TChunk>;
  onChunk?: (chunk: TChunk, meta: StreamChunkMeta) => void;
  onDone?: (result: StreamResult<TChunk>) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

interface UseStreamClientReturn<TChunk> {
  isStreaming: boolean;
  streamClient: {
    stream: (
      url: string,
      options?: StreamClientOptions<TChunk>
    ) => Promise<StreamResult<TChunk>>;
    cancel: () => void;
  };
}

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (typeof error === "object" && error !== null) {
    const { name } = error as { name?: string };
    return name === "AbortError";
  }

  return false;
};

const defaultParseChunk = <TChunk,>(chunk: string): TChunk =>
  chunk as unknown as TChunk;

/**
 * Lightweight wrapper around the Fetch streaming APIs that yields decoded string chunks
 * and lets consumers provide a typed parser so they can work with structured data.
 *
 * Example:
 * const { isStreaming, streamClient } = useStreamClient<MyChunk>();
 * await streamClient.stream("/api/stream", {
 *   parseChunk: (chunk) => JSON.parse(chunk) as MyChunk,
 *   onChunk: (data) => setItems((items) => [...items, data]),
 * });
 */
export function useStreamClient<TChunk = string>(): UseStreamClientReturn<TChunk> {
  const [isStreaming, setIsStreaming] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const stream = useCallback(
    async (
      url: string,
      options: StreamClientOptions<TChunk> = {}
    ): Promise<StreamResult<TChunk>> => {
      const {
        encoding = "utf-8",
        parseChunk = defaultParseChunk<TChunk>,
        onChunk,
        onDone,
        onError,
        signal: externalSignal,
        ...requestInit
      } = options;

      cancel();

      const controller = new AbortController();
      const { signal } = controller;
      activeControllerRef.current = controller;

      let detachExternalAbort: (() => void) | undefined;

      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort(externalSignal.reason);
        } else {
          const handleAbort = () => controller.abort(externalSignal.reason);
          externalSignal.addEventListener("abort", handleAbort);
          detachExternalAbort = () => {
            externalSignal.removeEventListener("abort", handleAbort);
          };
        }
      }

      setIsStreaming(true);

      const textDecoder = new TextDecoder(encoding);
      const chunks: TChunk[] = [];

      try {
        const response = await fetch(url, {
          ...requestInit,
          signal,
        });

        if (!response.ok) {
          let message = `${response.status} ${response.statusText}`;

          try {
            const errorText = await response.text();
            message = errorText || message;
          } catch {
            // Swallow text parsing errors, fall back to status text.
          }

          throw new Error(message);
        }

        if (!response.body) {
          throw new Error("Response does not contain a readable stream");
        }

        const reader = response.body.getReader();
        let chunkIndex = 0;

        const emitChunk = (chunkText: string) => {
          if (!chunkText) {
            return;
          }

          const meta: StreamChunkMeta = {
            chunkIndex,
            response,
          };

          const parsedChunk = parseChunk(chunkText, meta);
          chunks.push(parsedChunk);
          onChunk?.(parsedChunk, meta);
          chunkIndex += 1;
        };

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            const chunkText = textDecoder.decode(value, { stream: true });
            emitChunk(chunkText);
          }
        }

        const trailingChunk = textDecoder.decode();
        emitChunk(trailingChunk);

        const result: StreamResult<TChunk> = {
          response,
          chunks,
        };

        onDone?.(result);

        return result;
      } catch (error) {
        if (!isAbortError(error)) {
          onError?.(error as Error);
        }

        throw error;
      } finally {
        detachExternalAbort?.();

        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [cancel]
  );

  const streamClient = useMemo(
    () => ({
      stream,
      cancel,
    }),
    [stream, cancel]
  );

  return {
    isStreaming,
    streamClient,
  };
}

export type {
  StreamChunkMeta,
  StreamChunkParser,
  StreamClientOptions,
  StreamResult,
};
