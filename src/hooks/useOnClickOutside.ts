import { useEffect, useRef } from "react";

/**
 * Fires onClick on outside click or escape key.
 * Deps automatically includes onClick.
 */
export default function useOnClickOutside<TRef extends HTMLElement>(
  onClick: () => void,
  deps: unknown[] = []
) {
  const ref = useRef<TRef>(null);

  useEffect(
    () => {
      if (!ref.current) return;

      function handleClickOutside(event: Event) {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          onClick();
        }
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          onClick();
        }
      }

      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClick, ...deps]
  );

  return ref;
}
