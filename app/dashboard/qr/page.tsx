import { headers } from "next/headers";
import { getAppSettings } from "@/lib/app-settings";
import QrPanel from "./QrPanel";

export const dynamic = "force-dynamic";

async function getEnterBaseUrl(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (base) return `${base.replace(/\/$/, "")}/enter`;
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}/enter`;
  } catch {
    return "";
  }
}

export default async function DashboardQrPage() {
  const [enterBaseUrl, { maxTables }] = await Promise.all([
    getEnterBaseUrl(),
    getAppSettings(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Table URLs
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Copy these enter URLs and use them in your own QR generator. Each scan grants 12-hour access to the menu.
      </p>
      <QrPanel enterBaseUrl={enterBaseUrl} initialMaxTables={maxTables} />
    </div>
  );
}
