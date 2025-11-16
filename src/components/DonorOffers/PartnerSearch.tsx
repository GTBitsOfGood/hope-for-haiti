import { useState, useEffect } from "react";
import { groupUsersByTagForSelect, searchByNameOrTag } from "@/lib/userUtils";
import ConfiguredSelect from "../ConfiguredSelect";
import { useApiClient } from "@/hooks/useApiClient";
import SelectGroupWithAddAll from "../SelectGroupWithAddAll";

export type Partner = {
  id: number;
  name: string;
  tag?: string;
};

interface PartnerSearchProps {
  selectedPartners: Partner[];
  disabled?: boolean;
  onPartnersChange?: (partners: Partner[]) => void;
}

export const PartnerSearch = ({
  selectedPartners,
  onPartnersChange,
  disabled,
}: PartnerSearchProps) => {
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const { apiClient } = useApiClient();

  useEffect(() => {
    if (!apiClient) return;

    apiClient
      .get<{
        partners: typeof searchResults;
      }>("/api/partners")
      .then((response) => setSearchResults(response.partners));
  }, [apiClient, setSearchResults]);

  return (
    <div className="relative w-1/2">
      <label className="block text-sm font-light text-black mb-1">
        Partners who can view this offer
      </label>
      <ConfiguredSelect
        options={groupUsersByTagForSelect(searchResults)}
        filterOption={searchByNameOrTag}
        placeholder={"Search and select partners..."}
        value={selectedPartners.map((partner) => ({
          label: partner.name,
          value: partner,
        }))}
        onChange={(selectedOptions) => {
          const partners = selectedOptions.map(
            (option) => option.value as Partner
          );
          onPartnersChange?.(partners);
        }}
        formatGroupLabel={(data) => (
          <SelectGroupWithAddAll
            data={data}
            addOptions={(options) => {
              const newSelectedPartners = selectedPartners
                .concat(options)
                .reduce(
                  (acc, partner) => {
                    acc[partner.id] = partner;
                    return acc;
                  },
                  {} as {
                    [key: number]: Partner;
                  }
                );

              onPartnersChange?.(Object.values(newSelectedPartners));
            }}
          />
        )}
        isDisabled={disabled}
        isMulti
      />
    </div>
  );
};
