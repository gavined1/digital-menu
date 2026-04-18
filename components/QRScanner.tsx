"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useRef, useState } from "react";
import { isValidEnterUrl } from "@/lib/qr-enter-url";

const Scanner = dynamic(
  () =>
    import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

export default function QRScanner() {
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  const onScan = useCallback((detectedCodes: { rawValue: string }[]) => {
    const code = detectedCodes[0]?.rawValue?.trim();
    if (!code || handled.current) return;
    if (!isValidEnterUrl(code, window.location.origin)) {
      setError("Please scan the QR code on your table.");
      return;
    }
    handled.current = true;
    window.location.href = code;
  }, []);

  const onError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : "Camera access failed.");
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className="relative aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700">
        <Scanner
          onScan={onScan}
          onError={onError}
          constraints={{ facingMode: "environment" }}
          styles={{
            container: { width: "100%", height: "100%", position: "relative" },
            video: { objectFit: "cover" },
          }}
        />
      </div>
      {error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
      ) : null}
    </div>
  );
}
