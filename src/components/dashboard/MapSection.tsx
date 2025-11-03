"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface MapSectionProps {
  partners: { id: string; name: string; lat: number; lng: number }[];
}

export default function MapSection({ partners }: MapSectionProps) {
  return (
    <>
      <div>
        <h3 className="text-md font-medium text-black mb-2">
          GIK Partners Locations
        </h3>
      </div>
      <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
        <div className="h-[600px] w-full">
          <MapComponent partners={partners} />
        </div>
      </div>
    </>
  );
}
