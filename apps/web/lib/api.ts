// apps/web/lib/api.ts
"use client";

/** ========= TYPES ========= */
export type AssetListItem = {
  id: number;
  kode_aset: string;
  nama_aset: string;
  luas_m2?: number | null;
  nilai_aset?: number | null;
  tahun_perolehan?: number | null;
  status_hukum?: string | null;
  status_penggunaan?: string | null;
  alamat_lokasi?: string | null;
  updated_at?: string;
  geometry_type?: string | null; // contoh: ST_Point / ST_Polygon
};

export type AssetDetail = {
  id: number;
  kode_aset: string;
  nama_aset: string;
  luas_m2?: number | null;
  nilai_aset?: number | null;
  tahun_perolehan?: number | null;
  status_hukum?: string | null;
  status_penggunaan?: string | null;
  alamat_lokasi?: string | null;
  geometry?: any;
  updated_at?: string;
};

/** ========= CONFIG ========= */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/**
 * PENTING:
 * Backend login return field: access_token
 * Jadi kita simpan token di localStorage key: "access_token"
 */
const TOKEN_KEY = "access_token";

/** ========= TOKEN HELPERS ========= */
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/** ========= INTERNAL UTILS ========= */
function joinUrl(base: string, path: string) {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * helper: parse response text/json secara aman
 */
async function safeReadBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return JSON.stringify(await res.json());
    } catch {
      return "";
    }
  }
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/** ========= GENERIC FETCH ========= */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts?: {
    /** default: true (pakai Bearer token) */
    auth?: boolean;
    /** override base url kalau perlu */
    baseUrl?: string;
    /** kalau true, jangan auto redirect ke /login saat 401 */
    noAutoRedirect401?: boolean;
  }
): Promise<T> {
  const baseUrl = opts?.baseUrl ?? API_BASE;
  const url = joinUrl(baseUrl, path);

  const headers = new Headers(init.headers || {});
  const hasBody = init.body !== undefined && init.body !== null;

  // Content-Type hanya diset kalau memang kirim body dan belum ada
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // attach token bila auth bukan false
  if (opts?.auth !== false) {
    const token = getToken();
    if (!token) {
      // kalau token ga ada, lempar error yang jelas
      throw new Error("Token tidak ada. Login dulu ya");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  // auto-handle unauthorized
  if (res.status === 401) {
    // bersihin token biar gak “401 spam”
    clearToken();

    if (typeof window !== "undefined" && !opts?.noAutoRedirect401) {
      // redirect ke login
      window.location.href = "/login";
    }

    const body = await safeReadBody(res);
    throw new Error(`401 Unauthorized: ${body || "Silakan login ulang"}`);
  }

  if (!res.ok) {
    const body = await safeReadBody(res);
    throw new Error(`API ${res.status} ${res.statusText}: ${body}`);
  }

  // kalau endpoint return kosong (204)
  if (res.status === 204) return undefined as T;

  // normal json
  return (await res.json()) as T;
}

/** ========= FEATURE API ========= */
export const AssetsAPI = {
  list: () => apiFetch<AssetListItem[]>("/assets"),
  geojson: () => apiFetch<any>("/assets/geojson"),
  detail: (id: number) => apiFetch<AssetDetail>(`/assets/${id}`),

  patch: (
    id: number,
    payload: Partial<
      Pick<
        AssetDetail,
        | "luas_m2"
        | "nilai_aset"
        | "tahun_perolehan"
        | "status_hukum"
        | "status_penggunaan"
        | "alamat_lokasi"
      >
    >
  ) =>
    apiFetch<AssetDetail>(`/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    apiFetch<{ ok: true }>(`/assets/${id}`, { method: "DELETE" }),
};
