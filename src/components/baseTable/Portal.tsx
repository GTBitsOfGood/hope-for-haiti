"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type PortalPosition =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

interface PortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  position?: PortalPosition;
  offset?: number;
  className?: string;
}

export default function Portal({
  isOpen,
  onClose,
  triggerRef,
  children,
  position = "bottom",
  offset = 8,
  className = "",
}: PortalProps) {
  const [portalPosition, setPortalPosition] = useState({ top: -9999, left: -9999 });
  const portalRef = useRef<HTMLDivElement>(null);

  // Calculate position based on trigger element
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !portalRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const portalRect = portalRef.current.getBoundingClientRect();
      const portalWidth = portalRect.width || 320; // Fallback width
      const portalHeight = portalRect.height || 400; // Fallback height
      const gap = offset;

      let top = 0;
      let left = 0;

      // Calculate base position based on the specified position
      switch (position) {
        case "top-left":
          top = triggerRect.top - portalHeight - gap;
          left = triggerRect.left;
          break;
        case "top":
          top = triggerRect.top - portalHeight - gap;
          left = triggerRect.left + triggerRect.width / 2 - portalWidth / 2;
          break;
        case "top-right":
          top = triggerRect.top - portalHeight - gap;
          left = triggerRect.right - portalWidth;
          break;
        case "left":
          top = triggerRect.top + triggerRect.height / 2 - portalHeight / 2;
          left = triggerRect.left - portalWidth - gap;
          break;
        case "right":
          top = triggerRect.top + triggerRect.height / 2 - portalHeight / 2;
          left = triggerRect.right + gap;
          break;
        case "bottom-left":
          top = triggerRect.bottom + gap;
          left = triggerRect.left;
          break;
        case "bottom":
          top = triggerRect.bottom + gap;
          left = triggerRect.left + triggerRect.width / 2 - portalWidth / 2;
          break;
        case "bottom-right":
          top = triggerRect.bottom + gap;
          left = triggerRect.right - portalWidth;
          break;
      }

      // Viewport boundary checks and adjustments
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportPadding = 8;

      // Adjust horizontal position if overflow
      if (left + portalWidth > viewportWidth - viewportPadding) {
        left = viewportWidth - portalWidth - viewportPadding;
      }
      if (left < viewportPadding) {
        left = viewportPadding;
      }

      // Adjust vertical position if overflow
      if (top + portalHeight > viewportHeight - viewportPadding) {
        top = viewportHeight - portalHeight - viewportPadding;
      }
      if (top < viewportPadding) {
        top = viewportPadding;
      }

      setPortalPosition({ top, left });
    };

    // Initial position calculation with a slight delay to ensure DOM is ready
    requestAnimationFrame(() => {
      updatePosition();
    });

    // Add event listeners for dynamic updates
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef, position, offset]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        portalRef.current &&
        !portalRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const portalContent = (
    <div
      ref={portalRef}
      className={`fixed z-50 ${className}`}
      style={{
        top: `${portalPosition.top}px`,
        left: `${portalPosition.left}px`,
      }}
    >
      {children}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(portalContent, document.body)
    : null;
}

