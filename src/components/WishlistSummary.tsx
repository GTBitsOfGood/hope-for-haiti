"use client";

import { useStreamClient } from "@/hooks/useStreamClient";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function WishlistSummary() {
  const [fullText, setFullText] = useState<string>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { isStreaming, streamClient } = useStreamClient<string>();
  const hasStreamed = useRef(false);
  const typewriterInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading) return;

    const loadingMessage = "Loading wishlist summary...";
    let index = 0;

    typewriterInterval.current = setInterval(() => {
      if (index < loadingMessage.length) {
        setDisplayedText(loadingMessage.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typewriterInterval.current!);
      }
    }, 50);

    return () => {
      if (typewriterInterval.current) {
        clearInterval(typewriterInterval.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || fullText === displayedText) return;

    if (typewriterInterval.current) {
      clearInterval(typewriterInterval.current);
    }

    let index = displayedText.length;

    typewriterInterval.current = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typewriterInterval.current!);
      }
    }, 10);

    return () => {
      if (typewriterInterval.current) {
        clearInterval(typewriterInterval.current);
      }
    };
  }, [fullText, isLoading, displayedText]);

  useEffect(() => {
    if (hasStreamed.current) return;
    hasStreamed.current = true;

    const startStream = async () => {
      try {
        await streamClient.stream("/api/wishlists/summary", {
          onChunk: (chunk) => {
            setFullText((prev) => prev + chunk);
          },
          onDone: () => {
            setIsLoading(false);
          },
          onError: (error) => {
            console.error("Streaming error:", error);
            setFullText("Unable to load summary.");
            setIsLoading(false);
          },
        });
      } catch (error) {
        console.error("Failed to start stream:", error);
        setFullText("Unable to load summary.");
        setIsLoading(false);
      }
    };

    startStream();

    return () => {
      streamClient.cancel();
    };
  }, [streamClient]);

  const showContainer = displayedText.length > 0;
  const showCursor = isLoading || isStreaming || displayedText.length < fullText.length;

  return (
    <div
      className={`mt-8 mb-5 ${
        showContainer 
          ? "min-h-4 p-4 rounded border border-blue-primary bg-blue-light" 
          : "h-0"
      } transition-all duration-200 text-md text-black`}
    >
      {displayedText.split("\n").map((line, index, array) => (
        <div key={index} className={line.trim() === "" ? "h-4" : "mb-2 last:mb-0 inline-block w-full"}>
          <ReactMarkdown components={{ p: "span" }}>
            {line}
          </ReactMarkdown>
          {showCursor && index === array.length - 1 && (
            <span className="animate-pulse">|</span>
          )}
        </div>
      ))}
    </div>
  );
}
