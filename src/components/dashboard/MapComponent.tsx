"use client";

import { MapContainer, GeoJSON, Pane, Marker, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import haitiDepartments from "@/../public/HaitiAdmin1.json";
import haitiMask from "@/../public/haitiMask.json";

import L, { MarkerCluster } from "leaflet";
import { GeoJsonObject } from "geojson";

const DefaultIcon = L.icon({
  iconUrl: "/pin.svg",
  iconSize: [27, 34],
  iconAnchor: [13, 34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  partners: { id: string; name: string; lat: number; lng: number }[];
}

export default function MapComponent({ partners }: MapComponentProps) {
  const haitiCenter: [number, number] = [19.1, -72.2];
  const haitiBounds: [[number, number], [number, number]] = [
    [17.8, -75.5],
    [20.2, -71.2],
  ];

  const clusterIconFunction = (cluster: MarkerCluster) => {
    return L.divIcon({
      html: `<div class="marker-cluster-custom">${cluster.getChildCount()}</div>`,
      className: "border-none",
      iconSize: L.point(40, 40),
    });
  };

  return (
    <MapContainer
      center={haitiCenter}
      zoom={8.5}
      minZoom={8.0}
      zoomDelta={0.75}
      zoomSnap={0.5}
      maxZoom={12}
      zoomControl={true}
      dragging={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      boxZoom={true}
      keyboard={true}
      touchZoom={true}
      maxBounds={haitiBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <GeoJSON
        data={haitiDepartments as GeoJsonObject}
        interactive={false}
        style={() => ({
          fillColor: "#D4E3EF",
          color: "#B8C9D8",
          weight: 1.5,
          fillOpacity: 1,
        })}
      />
      <Pane name="mask-pane" style={{ zIndex: 300, pointerEvents: "none" }}>
        <GeoJSON
          data={haitiMask as GeoJsonObject}
          interactive={false}
          style={{ 
            fillColor: "#ffffff", 
            fillOpacity: 1, 
            color: "transparent",
          }}
          pane="mask-pane"
        />
      </Pane>
      <MarkerClusterGroup 
        chunkedLoading
        iconCreateFunction={clusterIconFunction}
        spiderfyOnMaxZoom={true}
        maxClusterRadius={50}
      >
        {partners.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={DefaultIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false} className="custom-tooltip">
              {p.name}
            </Tooltip>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
