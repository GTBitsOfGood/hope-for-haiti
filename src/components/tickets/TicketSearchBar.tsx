"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface TicketSearchBarProps {
  onSearchChange: (query: string) => void;
}

export default function TicketSearchBar({
  onSearchChange,
}: TicketSearchBarProps) {
  const [inputValue, setInputValue] = useState("");

  // Debounce the search query to avoid glitchy updates
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  return (
    <div className="flex justify-between items-center w-full pt-4 pb-2 gap-4">
      <div className="relative flex-1">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-primary/50"
          size={18}
        />
        <input
          type="text"
          placeholder="Search tickets"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-primary/20 rounded-lg bg-sunken focus:outline-none focus:border-blue-primary/50"
        />
      </div>
    </div>
  );
}

