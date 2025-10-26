import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "@phosphor-icons/react";

export type Partner = {
  id: number;
  name: string;
};

interface PartnerSearchProps {
  selectedPartners: Partner[];
  onPartnersChange: (partners: Partner[]) => void;
}

export const PartnerSearch = ({
  selectedPartners,
  onPartnersChange,
}: PartnerSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchPartners = useCallback(
    async (term?: string) => {
      setIsSearching(true);
      try {
        const query = term && term.trim().length
          ? `/api/partners?term=${encodeURIComponent(term.trim())}`
          : "/api/partners";

        const response = await fetch(query, {
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Failed to fetch partners");
          setSearchResults([]);
          return;
        }

        const responseData = await response.json();

        let data: Partner[] = [];
        if (responseData.partners && Array.isArray(responseData.partners)) {
          data = responseData.partners;
        } else if (Array.isArray(responseData)) {
          data = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          data = responseData.data;
        }

        const filteredData = data.filter(
          (partner: Partner) =>
            !selectedPartners.some((selected) => selected.id === partner.id)
        );

        setSearchResults(filteredData);
        if (filteredData.length > 0) {
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error searching partners:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedPartners]
  );

  // Debounced search function
  useEffect(() => {
    const trimmedTerm = searchTerm.trim();

    if (trimmedTerm === "") {
      if (initialFetchRef.current) {
        fetchPartners();
      } else {
        setSearchResults([]);
      }
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPartners(trimmedTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchPartners]);

  const handleAddPartner = (partner: Partner) => {
    onPartnersChange([...selectedPartners, partner]);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleRemovePartner = (partnerId: number) => {
    onPartnersChange(
      selectedPartners.filter((partner) => partner.id !== partnerId)
    );
  };

  const handleInputFocus = () => {
    if (!initialFetchRef.current || searchTerm.trim() === "") {
      initialFetchRef.current = true;
      fetchPartners();
    } else if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for click events
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div>
        <label className="block text-sm font-light text-black mb-1">
          Partners who can view this offer
        </label>
        <div className="relative w-full lg:w-1/2">
          <div className="flex items-center flex-wrap border border-gray-300 rounded-md bg-zinc-50 p-1">
            {selectedPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center border border-red-500 bg-red-100 text-red-800 px-2 py-0.5 rounded-md text-sm m-0.5"
              >
                <span>{partner.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePartner(partner.id)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex-1 flex items-center min-w-[120px]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={
                  selectedPartners.length === 0 ? "Search partners..." : ""
                }
                className="flex-1 py-1.5 px-2 bg-zinc-50 border-0 focus:outline-none focus:ring-0 min-w-[60px]"
              />
              {isSearching && (
                <div className="mr-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full lg:w-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((partner) => (
            <div
              key={partner.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleAddPartner(partner)}
            >
              {partner.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
