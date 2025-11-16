"use client";

import { useEffect, useState } from "react";
import MapSection from "./MapSection";
import { fetchPartnerLocations } from "@/lib/dashboardApi";

export default function MapSectionWithData() {
  const [partnerLocations, setPartnerLocations] = useState<
    { id: string; name: string; lat: number; lng: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPartnerLocations() {
      try {
        setLoading(true);
        setError(null);
        const partners = await fetchPartnerLocations();
        setPartnerLocations(partners);
      } catch (err) {
        console.error("Failed to load partner locations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load partner locations"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPartnerLocations();
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-primary text-white rounded-lg hover:bg-blue-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
        <div className="h-[600px] w-full flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  return <MapSection partners={partnerLocations} />;
}
