"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardAutoRefresh({
  intervaloMs = 30000,
}: {
  intervaloMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervaloMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [intervaloMs, router]);

  return null;
}
