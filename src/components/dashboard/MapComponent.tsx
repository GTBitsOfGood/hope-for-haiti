"use client";

import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

const iconRetinaUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const iconUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  partners: { id: string; name: string; lat: number; lng: number }[];
}

export default function MapComponent({ partners }: MapComponentProps) {
  const haitiCenter: [number, number] = [18.9712, -72.2852];
  const haitiBounds: [[number, number], [number, number]] = [
    [-12.2, -72.0],
    [19.9, -71.9],
  ];

  return (
    <MapContainer
      center={haitiCenter}
      zoom={8}
      minZoom={8}
      maxZoom={8}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      touchZoom={false}
      maxBounds={haitiBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {partners.map((partner) => (
        <Marker
          key={partner.id}
          position={[partner.lat, partner.lng]}
          icon={DefaultIcon}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            permanent={false}
          >
            <span className="font-medium text-blue-primary">
              {partner.name}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
