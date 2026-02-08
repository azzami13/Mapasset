"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AssetsAPI, getToken, type AssetListItem } from "@/lib/api";

function formatRupiah(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function AssetsCatalogPage() {
  const router = useRouter();

  const [rows, setRows] = useState<AssetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusPenggunaan, setStatusPenggunaan] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await AssetsAPI.list();
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "Gagal load assets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // stop 401 spam: kalau belum login langsung lempar
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !qq ||
        r.kode_aset?.toLowerCase().includes(qq) ||
        r.nama_aset?.toLowerCase().includes(qq) ||
        (r.alamat_lokasi ?? "").toLowerCase().includes(qq);

      const matchStatus =
        !statusPenggunaan || (r.status_penggunaan ?? "") === statusPenggunaan;

      return matchQ && matchStatus;
    });
  }, [rows, q, statusPenggunaan]);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Pengelolaan Aset</h1>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            Katalog aset terstruktur (klik row untuk lihat detail).
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/map")}
            style={topBtn}
            title="Tambah aset (sementara diarahkan ke map untuk buat point/polygon)"
          >
            + Tambah Aset
          </button>

          <button
            onClick={() => {
              const csv = [
                [
                  "id",
                  "kode_aset",
                  "nama_aset",
                  "luas_m2",
                  "nilai_aset",
                  "tahun_perolehan",
                  "status_hukum",
                  "status_penggunaan",
                  "alamat_lokasi",
                ].join(","),
                ...filtered.map((r) =>
                  [
                    r.id,
                    r.kode_aset,
                    JSON.stringify(r.nama_aset ?? ""),
                    r.luas_m2 ?? "",
                    r.nilai_aset ?? "",
                    r.tahun_perolehan ?? "",
                    JSON.stringify(r.status_hukum ?? ""),
                    JSON.stringify(r.status_penggunaan ?? ""),
                    JSON.stringify(r.alamat_lokasi ?? ""),
                  ].join(",")
                ),
              ].join("\n");

              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `assets_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={topBtn}
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={filterBar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kode/nama/alamat..."
          style={input}
        />

        <select
          value={statusPenggunaan}
          onChange={(e) => setStatusPenggunaan(e.target.value)}
          style={select}
        >
          <option value="">Semua status penggunaan</option>
          <option value="Dimanfaatkan">Dimanfaatkan</option>
          <option value="Idle">Idle</option>
          <option value="Sengketa">Sengketa</option>
        </select>

        <button
          onClick={() => {
            setQ("");
            setStatusPenggunaan("");
          }}
          style={topBtn}
        >
          Reset
        </button>

        <div style={{ marginLeft: "auto", color: "#666" }}>
          Total: <b>{filtered.length}</b>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginTop: 14 }}>
        {loading && <div>Loading...</div>}

        {err && (
          <div style={errBox}>
            {err}
            <div style={{ marginTop: 10 }}>
              <button onClick={load} style={topBtn}>
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {!loading && !err && (
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  <th style={th}>Kode</th>
                  <th style={th}>Nama</th>
                  <th style={th}>Alamat</th>
                  <th style={th}>Luas (m²)</th>
                  <th style={th}>Nilai</th>
                  <th style={th}>Tahun</th>
                  <th style={th}>Status Hukum</th>
                  <th style={th}>Status Penggunaan</th>
                  <th style={{ ...th, width: 210, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/assets/${r.id}`)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fcfcff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <td style={td}>
                      <b>{r.kode_aset}</b>
                    </td>
                    <td style={td}>{r.nama_aset}</td>
                    <td style={td}>{r.alamat_lokasi ?? "-"}</td>
                    <td style={td}>{r.luas_m2 ?? "-"}</td>
                    <td style={td}>{formatRupiah(r.nilai_aset)}</td>
                    <td style={td}>{r.tahun_perolehan ?? "-"}</td>
                    <td style={td}>{r.status_hukum ?? "-"}</td>
                    <td style={td}>{r.status_penggunaan ?? "-"}</td>

                    <td
                      style={{ ...td, textAlign: "right" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => router.push(`/assets/${r.id}`)} style={btn}>
                        Detail
                      </button>
                      <button onClick={() => router.push(`/assets/${r.id}?edit=1`)} style={btn}>
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Hapus aset ${r.kode_aset}?`)) return;
                          try {
                            await AssetsAPI.remove(r.id);
                            await load();
                          } catch (e: any) {
                            alert(e?.message ?? "Gagal hapus");
                          }
                        }}
                        style={{ ...btn, borderColor: "#f3c0c0" }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 16, color: "#666" }}>
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "12px 10px",
  textAlign: "left",
  fontSize: 13,
  borderBottom: "1px solid #eee",
};
const td: React.CSSProperties = {
  padding: "12px 10px",
  fontSize: 13,
  borderBottom: "1px solid #f3f3f3",
  verticalAlign: "top",
};
const btn: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  marginLeft: 8,
};
const topBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #ddd",
  cursor: "pointer",
  background: "white",
};
const filterBar: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  border: "1px solid #eee",
  borderRadius: 10,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};
const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  minWidth: 260,
};
const select: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
};
const tableWrap: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 10,
  overflow: "hidden",
};
const errBox: React.CSSProperties = {
  padding: 12,
  border: "1px solid #f2c",
  borderRadius: 8,
  color: "#a00",
};
