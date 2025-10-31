"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

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

function MarkerCluster({
  partners,
}: {
  partners: MapComponentProps["partners"];
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current.clearLayers();
      clusterGroupRef.current = null;
    }

    const MarkerClusterGroupClass = (
      L as unknown as {
        MarkerClusterGroup: new (
          options?: L.MarkerClusterGroupOptions
        ) => L.MarkerClusterGroup;
      }
    ).MarkerClusterGroup;

    clusterGroupRef.current = new MarkerClusterGroupClass({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="
            background-color: #ef3340;
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: "marker-cluster-custom",
          iconSize: L.point(40, 40),
        });
      },
    });

    partners.forEach((partner) => {
      const marker = L.marker([partner.lat, partner.lng], {
        icon: DefaultIcon,
      });
      marker.bindTooltip(partner.name, {
        direction: "top",
        offset: [0, -10],
        opacity: 1,
        permanent: false,
        className: "custom-tooltip",
      });
      clusterGroupRef.current!.addLayer(marker);
    });

    if (clusterGroupRef.current) {
      map.addLayer(clusterGroupRef.current);
    }

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current.clearLayers();
        clusterGroupRef.current = null;
      }
    };
  }, [map, partners]);

  return null;
}

export default function MapComponent({ partners }: MapComponentProps) {
  const haitiCenter: [number, number] = [19.0, -72.2852];
  const haitiBounds: [[number, number], [number, number]] = [
    [17.9, -73.9],
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
      <MarkerCluster partners={partners} />
    </MapContainer>
  );
}
