"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";

type Props = {
  geojson: FeatureCollection;
};

export default function AssetMap({ geojson }: Props) {
  const center: [number, number] = [-6.872, 107.542];

  return (
    <div style={{ height: "calc(100vh - 80px)" }}>
      <MapContainer
        {...({
          center,
          zoom: 16,
          style: { height: "100%", width: "100%" },
          scrollWheelZoom: true,
        } as any)}
      >
        <TileLayer
          {...({
            attribution: "© OpenStreetMap contributors",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          } as any)}
        />
        <GeoJSON data={geojson as any} />
      </MapContainer>
    </div>
  );
}
