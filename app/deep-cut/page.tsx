"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeepCutPage from "@/components/DeepCutPage";
import type { DeepCutResult } from "@/lib/types";

export default function DeepCutRoute() {
  const router = useRouter();
  const [result, setResult] = useState<DeepCutResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("deepCutResult");
    if (!raw) {
      // No result in storage — send back to listen screen
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DeepCutResult;
      setResult(parsed);
    } catch {
      router.replace("/");
    } finally {
      setReady(true);
    }
  }, [router]);

  const handleBack = () => {
    sessionStorage.removeItem("deepCutResult");
    router.push("/");
  };

  if (!ready || !result) {
    // Brief blank while hydrating — avoids flash
    return <div className="min-h-dvh bg-void" />;
  }

  return <DeepCutPage result={result} onBack={handleBack} />;
}
