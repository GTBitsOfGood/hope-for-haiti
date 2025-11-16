import React, { useState, useEffect, useMemo, useRef } from "react";
import AsyncSelect from "react-select/async";
import { GroupBase, StylesConfig } from "react-select";

interface LocationOption {
  value: string; // "lat,lon" format
  label: string; // Display name
}

interface LocationSearchProps {
  value: string | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

interface NominatimAddress {
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

const reverseGeocode = async (
  lat: number,
  lon: number
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Hope-for-Haiti-App",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimReverseResult;
    if (data.address) {
      const addressParts: string[] = [];
      if (data.address.road) addressParts.push(data.address.road);
      const cityOrTown =
        data.address.city || data.address.town || data.address.village;
      if (cityOrTown) {
        addressParts.push(cityOrTown);
      }
      if (data.address.state) addressParts.push(data.address.state);
      if (data.address.country) addressParts.push(data.address.country);

      return addressParts.length > 0
        ? addressParts.join(", ")
        : data.display_name || null;
    }

    return data.display_name || null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

const loadOptions = async (inputValue: string): Promise<LocationOption[]> => {
  if (!inputValue || inputValue.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        inputValue
      )}&limit=10&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Hope-for-Haiti-App",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as NominatimSearchResult[];

    return data.map((item: NominatimSearchResult) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const coordinates = `${lat},${lon}`;

      const addressParts: string[] = [];
      if (item.address) {
        if (item.address.road) addressParts.push(item.address.road);
        const cityOrTown =
          item.address.city || item.address.town || item.address.village;
        if (cityOrTown) {
          addressParts.push(cityOrTown);
        }
        if (item.address.state) addressParts.push(item.address.state);
        if (item.address.country) addressParts.push(item.address.country);
      }

      const label =
        addressParts.length > 0
          ? addressParts.join(", ")
          : item.display_name || coordinates;

      return {
        value: coordinates,
        label: label,
      };
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

export default function LocationSearch({
  value,
  onChange,
  placeholder = "Search for a location...",
  error = false,
}: LocationSearchProps) {
  const [selectedOption, setSelectedOption] = useState<LocationOption | null>(
    null
  );
  const [isLoadingReverse, setIsLoadingReverse] = useState(false);
  const previousValueRef = useRef<string | undefined | null>(null);

  // Update selectedOption when value changes from outside
  useEffect(() => {
    // Skip if value hasn't changed
    if (previousValueRef.current === value) {
      return;
    }
    previousValueRef.current = value;

    if (!value) {
      setSelectedOption(null);
      return;
    }

    // Check if value is in "lat,lon" format
    const coordsMatch = value.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[2]);

      setIsLoadingReverse(true);
      reverseGeocode(lat, lon)
        .then((label) => {
          setSelectedOption({
            value: value,
            label: label || value,
          });
        })
        .catch(() => {
          setSelectedOption({
            value: value,
            label: value,
          });
        })
        .finally(() => {
          setIsLoadingReverse(false);
        });
    } else {
      setSelectedOption({
        value: value,
        label: value,
      });
    }
  }, [value]);

  const handleChange = (option: LocationOption | null) => {
    setSelectedOption(option);
    onChange(option?.value || "");
  };

  const loadOptionsDebounced = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (
      inputValue: string,
      callback: (options: LocationOption[]) => void
    ) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        loadOptions(inputValue).then(callback);
      }, 300);
    };
  }, []);

  const customStyles: StylesConfig<
    LocationOption,
    false,
    GroupBase<LocationOption>
  > = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: error ? "#fef2f2" : "#f9fafb",
      borderColor: error ? "#ef4444" : state.isFocused ? "#ef333f" : "#e5e7eb",
      boxShadow: state.isFocused
        ? error
          ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
          : "0 0 0 2px rgba(239, 51, 63, 0.2)"
        : "none",
      minHeight: "48px",
      "&:hover": {
        borderColor: error
          ? "#ef4444"
          : state.isFocused
            ? "#ef333f"
            : "#d1d5db",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6b7280",
    }),
    input: (provided) => ({
      ...provided,
      color: "#22070B",
      margin: 0,
      padding: 0,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "2px 8px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#22070B",
    }),
  };

  return (
    <AsyncSelect<LocationOption, false, GroupBase<LocationOption>>
      value={selectedOption}
      onChange={handleChange}
      loadOptions={(inputValue, callback) => {
        if (inputValue.length < 3) {
          callback([]);
          return;
        }
        loadOptionsDebounced(inputValue, callback);
      }}
      cacheOptions
      defaultOptions={false}
      placeholder={placeholder}
      isClearable
      isSearchable
      isLoading={isLoadingReverse}
      noOptionsMessage={({ inputValue }) =>
        inputValue.length < 3
          ? "Type at least 3 characters to search"
          : "No locations found"
      }
      loadingMessage={() => "Searching locations..."}
      styles={customStyles}
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
}
