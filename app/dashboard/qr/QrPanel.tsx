"use client";

import { useState } from "react";
import { updateMaxTables } from "../actions";

export default function QrPanel({
  enterBaseUrl,
  initialMaxTables,
}: {
  enterBaseUrl: string;
  initialMaxTables: number;
}) {
  const [maxTables, setMaxTables] = useState(initialMaxTables);
  const [savedMaxTables, setSavedMaxTables] = useState(initialMaxTables);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const tableCount = Math.max(1, Math.min(100, savedMaxTables));
  const tableUrls = Array.from({ length: tableCount }, (_, i) => {
    const n = i + 1;
    return `${enterBaseUrl}${enterBaseUrl.includes("?") ? "&" : "?"}table=${n}`;
  });

  async function handleSaveTableCount() {
    const n = Math.max(1, Math.min(100, Math.round(maxTables)));
    setMessage(null);
    const result = await updateMaxTables(n);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setSavedMaxTables(n);
    setMaxTables(n);
    setMessage({ type: "ok", text: "Table count saved." });
    setTimeout(() => setMessage(null), 3000);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  function copyAll() {
    navigator.clipboard.writeText(tableUrls.join("\n"));
  }

  return (
    <div className="space-y-6">
      <section className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
          Number of tables
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          Set how many tables you have (1–100). Use the URLs below in your own QR generator.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            value={maxTables}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setMaxTables(Number.isNaN(v) ? 1 : Math.max(1, Math.min(100, v)));
            }}
            className="w-24 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleSaveTableCount}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90"
          >
            Save
          </button>
          {message && (
            <span
              className={`text-sm ${
                message.type === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </section>

      {enterBaseUrl ? (
        <section className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Enter URLs ({tableCount} tables)
            </h2>
            <button
              type="button"
              onClick={copyAll}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Copy all
            </button>
          </div>
          <ul className="space-y-2">
            {tableUrls.map((url, i) => (
              <li
                key={i}
                className="flex items-center gap-2 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-20 shrink-0">
                  Table {i + 1}
                </span>
                <code className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 break-all">
                  {url}
                </code>
                <button
                  type="button"
                  onClick={() => copyUrl(url)}
                  className="shrink-0 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Use these URLs in your preferred QR generator. Each scan grants 12-hour menu access.
          </p>
        </section>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Set <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">NEXT_PUBLIC_APP_URL</code> in .env for the correct URLs in production.
        </p>
      )}
    </div>
  );
}
