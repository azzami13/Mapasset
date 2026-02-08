"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssetsAPI, type AssetDetail } from "@/lib/api";

function formatRupiah(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function AssetDetailClient({ id }: { id: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  const startEdit = sp.get("edit") === "1";

  const [data, setData] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [edit, setEdit] = useState(startEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    luas_m2: "",
    nilai_aset: "",
    tahun_perolehan: "",
    status_hukum: "",
    status_penggunaan: "",
    alamat_lokasi: "",
  });

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await AssetsAPI.detail(id);
      setData(d);
      setForm({
        luas_m2: d.luas_m2?.toString() ?? "",
        nilai_aset: d.nilai_aset?.toString() ?? "",
        tahun_perolehan: d.tahun_perolehan?.toString() ?? "",
        status_hukum: d.status_hukum ?? "",
        status_penggunaan: d.status_penggunaan ?? "",
        alamat_lokasi: d.alamat_lokasi ?? "",
      });
    } catch (e: any) {
      setErr(e?.message ?? "Gagal load detail");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setErr("ID tidak valid");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const centerText = useMemo(() => {
    const g: any = data?.geometry;
    if (!g) return "-";
    if (g.type === "Point" && Array.isArray(g.coordinates)) {
      const [lng, lat] = g.coordinates;
      return `${lat}, ${lng}`;
    }
    return g.type ?? "Geometry";
  }, [data]);

  async function onSave() {
    setSaving(true);
    try {
      const payload = {
        luas_m2: form.luas_m2 === "" ? null : Number(form.luas_m2),
        nilai_aset: form.nilai_aset === "" ? null : Number(form.nilai_aset),
        tahun_perolehan: form.tahun_perolehan === "" ? null : Number(form.tahun_perolehan),
        status_hukum: form.status_hukum || null,
        status_penggunaan: form.status_penggunaan || null,
        alamat_lokasi: form.alamat_lokasi || null,
      };

      const updated = await AssetsAPI.patch(id, payload);
      setData(updated);
      setEdit(false);
      router.replace(`/assets/${id}`);
    } catch (e: any) {
      alert(e?.message ?? "Gagal simpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!data) return;
    if (!confirm(`Hapus aset ${data.kode_aset}?`)) return;

    try {
      await AssetsAPI.remove(id);
      router.push("/assets");
    } catch (e: any) {
      alert(e?.message ?? "Gagal hapus");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ color: "#666", marginBottom: 6 }}>
            <a href="/assets" style={{ color: "#666", textDecoration: "none" }}>
              Manajemen Aset
            </a>{" "}
            &nbsp;›&nbsp; Detail Aset
          </div>
          <h1 style={{ margin: 0 }}>{data ? data.nama_aset : "Detail Aset"}</h1>
          {data && (
            <div style={{ color: "#666", marginTop: 6 }}>
              <b>{data.kode_aset}</b> • Lokasi: {centerText}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/map")} style={btn}>
            Lihat di Peta
          </button>

          {!edit ? (
            <button onClick={() => setEdit(true)} style={btn}>
              Edit
            </button>
          ) : (
            <>
              <button onClick={onSave} disabled={saving} style={btn}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => {
                  setEdit(false);
                  router.replace(`/assets/${id}`);
                  if (data) {
                    setForm({
                      luas_m2: data.luas_m2?.toString() ?? "",
                      nilai_aset: data.nilai_aset?.toString() ?? "",
                      tahun_perolehan: data.tahun_perolehan?.toString() ?? "",
                      status_hukum: data.status_hukum ?? "",
                      status_penggunaan: data.status_penggunaan ?? "",
                      alamat_lokasi: data.alamat_lokasi ?? "",
                    });
                  }
                }}
                style={btn}
              >
                Batal
              </button>
            </>
          )}

          <button onClick={onDelete} style={{ ...btn, borderColor: "#f3c0c0" }}>
            Hapus
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && <div>Loading...</div>}
        {err && <div style={{ padding: 12, border: "1px solid #f2c", borderRadius: 8, color: "#a00" }}>{err}</div>}
      </div>

      {data && !loading && !err && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card title="Rincian Aset">
            <Field label="ID" value={data.id} />
            <Field label="Kode Aset" value={data.kode_aset} />
            <Field label="Nama Aset" value={data.nama_aset} />

            {!edit ? (
              <>
                <Field label="Luas (m²)" value={data.luas_m2 ?? "-"} />
                <Field label="Nilai Aset" value={formatRupiah(data.nilai_aset)} />
                <Field label="Tahun Perolehan" value={data.tahun_perolehan ?? "-"} />
                <Field label="Status Hukum" value={data.status_hukum ?? "-"} />
                <Field label="Status Penggunaan" value={data.status_penggunaan ?? "-"} />
                <Field label="Alamat Lokasi" value={data.alamat_lokasi ?? "-"} />
              </>
            ) : (
              <>
                <EditRow label="Luas (m²)">
                  <input value={form.luas_m2} onChange={(e) => setForm({ ...form, luas_m2: e.target.value })} style={input} />
                </EditRow>

                <EditRow label="Nilai Aset">
                  <input value={form.nilai_aset} onChange={(e) => setForm({ ...form, nilai_aset: e.target.value })} style={input} />
                </EditRow>

                <EditRow label="Tahun Perolehan">
                  <input value={form.tahun_perolehan} onChange={(e) => setForm({ ...form, tahun_perolehan: e.target.value })} style={input} />
                </EditRow>

                <EditRow label="Status Hukum">
                  <input value={form.status_hukum} onChange={(e) => setForm({ ...form, status_hukum: e.target.value })} style={input} />
                </EditRow>

                <EditRow label="Status Penggunaan">
                  <select value={form.status_penggunaan} onChange={(e) => setForm({ ...form, status_penggunaan: e.target.value })} style={input}>
                    <option value="">-</option>
                    <option value="Dimanfaatkan">Dimanfaatkan</option>
                    <option value="Idle">Idle</option>
                    <option value="Sengketa">Sengketa</option>
                  </select>
                </EditRow>

                <EditRow label="Alamat Lokasi">
                  <input value={form.alamat_lokasi} onChange={(e) => setForm({ ...form, alamat_lokasi: e.target.value })} style={input} />
                </EditRow>
              </>
            )}
          </Card>

          <Card title="Lokasi & Geometri">
            <Field label="Tipe Geometri" value={data.geometry?.type ?? "-"} />
            <Field label="Koordinat/Info" value={centerText} />
            <div style={{ marginTop: 10, color: "#666", fontSize: 13 }}>
              *Nanti di Phase berikutnya: galeri foto aset & dokumen PDF/SK sesuai SRS.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", padding: "8px 0", borderBottom: "1px solid #f3f3f3" }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{String(value)}</div>
    </div>
  );
}

function EditRow({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", padding: "8px 0", borderBottom: "1px solid #f3f3f3", alignItems: "center" }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

const btn: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" };
const input: React.CSSProperties = { width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd" };
