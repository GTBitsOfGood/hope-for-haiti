import React, { useState, useEffect, useMemo, useRef } from "react";
import AsyncSelect from "react-select/async";
import { GroupBase, StylesConfig } from "react-select";

interface LocationOption {
  value: string; // "lat,lon" format
  label: string; // Display name
  addressString?: string; // Readable address string
}

interface LocationSearchProps {
  value: string | undefined | null;
  onChange: (value: string, addressString?: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

// Haiti center coordinates for prioritizing results
const HAITI_CENTER_LAT = 18.9712;
const HAITI_CENTER_LON = -72.2852;

interface PhotonFeatureProperties {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  street?: string;
  housenumber?: string;
  [key: string]: string | undefined;
}

interface PhotonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: PhotonFeatureProperties;
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

const reverseGeocode = async (
  lat: number,
  lon: number
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PhotonResponse;
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties;
      const addressParts: string[] = [];

      if (props.street) {
        if (props.housenumber) {
          addressParts.push(`${props.housenumber} ${props.street}`);
        } else {
          addressParts.push(props.street);
        }
      }
      if (props.city) addressParts.push(props.city);
      if (props.state) addressParts.push(props.state);
      if (props.country) addressParts.push(props.country);

      return addressParts.length > 0
        ? addressParts.join(", ")
        : props.name || null;
    }

    return null;
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
    // Use Haiti center coordinates to prioritize results from Haiti
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        inputValue
      )}&lat=${HAITI_CENTER_LAT}&lon=${HAITI_CENTER_LON}&limit=10`
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as PhotonResponse;

    return data.features.map((feature: PhotonFeature) => {
      // Photon returns coordinates as [lon, lat]
      const [lon, lat] = feature.geometry.coordinates;
      const coordinates = `${lat},${lon}`;

      const props = feature.properties;
      const addressParts: string[] = [];

      if (props.street) {
        if (props.housenumber) {
          addressParts.push(`${props.housenumber} ${props.street}`);
        } else {
          addressParts.push(props.street);
        }
      }
      if (props.city) addressParts.push(props.city);
      if (props.state) addressParts.push(props.state);
      if (props.country) addressParts.push(props.country);

      const label =
        addressParts.length > 0
          ? addressParts.join(", ")
          : props.name || coordinates;

      return {
        value: coordinates,
        label: label,
        addressString: label, // Store the readable address string
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
  placeholder = "Search for an address...",
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
            addressString: label || undefined,
          });
        })
        .catch(() => {
          setSelectedOption({
            value: value,
            label: value,
            addressString: undefined,
          });
        })
        .finally(() => {
          setIsLoadingReverse(false);
        });
    } else {
      setSelectedOption({
        value: value,
        label: value,
        addressString: value,
      });
    }
  }, [value]);

  const handleChange = (option: LocationOption | null) => {
    setSelectedOption(option);
    onChange(option?.value || "", option?.addressString);
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
