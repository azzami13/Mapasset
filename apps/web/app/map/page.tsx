"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

// PENTING: file harus ada di folder yang sama: app/map/AssetMap.tsx
const AssetMap = dynamic(() => import("./AssetMap"), { ssr: false });

export default function MapPage() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);

        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("Token tidak ada. Login dulu ya.");
          return;
        }

        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

        const res = await fetch(`${apiBase}/assets/geojson`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

        setGeojson((await res.json()) as FeatureCollection);
      } catch (e: any) {
        setError(e?.message ?? "Fetch gagal");
      }
    };

    run();
  }, []);

  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!geojson) return <div style={{ padding: 24 }}>Loading GeoJSON...</div>;

  return <AssetMap geojson={geojson} />;
}
