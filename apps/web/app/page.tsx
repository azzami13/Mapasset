"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? "/assets" : "/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
