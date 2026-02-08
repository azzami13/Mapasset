"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { apiFetch, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";

const AssetMap = dynamic(() => import("./AssetMap"), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch<FeatureCollection>("/assets/geojson");
      setGeojson(data);
    } catch (e: any) {
      setErr(e?.message ?? "Gagal load geojson");
      setGeojson(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <b>MapAset</b>

        <button onClick={load} style={{ padding: "8px 12px", cursor: "pointer" }}>
          Refresh
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.replace("/login");
          }}
          style={{ padding: "8px 12px", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>

      {loading && <div style={{ padding: 12 }}>Loading geojson...</div>}

      {err && (
        <div style={{ padding: 12, background: "#ffe6e6" }}>
          {err}
        </div>
      )}

      {geojson && <AssetMap geojson={geojson} />}
    </div>
  );
}
