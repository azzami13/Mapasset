"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ redirect HARUS di useEffect, bukan di render
  useEffect(() => {
    if (getToken()) router.replace("/assets");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ access_token: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        },
        { auth: false } // ✅ login tidak pakai bearer
      );

      setToken(data.access_token);
      router.replace("/assets");
    } catch (e: any) {
      setErr(e?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 320 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button disabled={loading} type="submit">{loading ? "..." : "Login"}</button>
        {err && <div style={{ color: "red" }}>{err}</div>}
      </form>
    </div>
  );
}
