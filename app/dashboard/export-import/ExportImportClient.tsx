"use client";

import { useState } from "react";
import { exportMenuSnapshot, importMenuSnapshot } from "../actions";

export default function ExportImportClient() {
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");

  async function handleExport() {
    setMessage(null);
    setBusy("export");
    const result = await exportMenuSnapshot();
    setBusy(null);
    if (result.error || !result.json) {
      setMessage({ type: "error", text: result.error ?? "Export failed." });
      return;
    }
    const blob = new Blob([result.json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digimenu-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "ok", text: "Download started." });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    setBusy("import");
    const text = await file.text();
    const result = await importMenuSnapshot(text, importMode);
    setBusy(null);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    const parts = [
      importMode === "replace"
        ? `Replaced with ${result.importedCategories ?? 0} categories and ${result.importedItems ?? 0} menu items (hero updated).`
        : `Added ${result.importedCategories ?? 0} new categories, ${result.importedItems ?? 0} new menu items.`,
    ];
    if (result.skippedItems != null && result.skippedItems > 0) {
      parts.push(`Skipped ${result.skippedItems} duplicate items (same name + category).`);
    }
    setMessage({ type: "ok", text: parts.join(" ") });
  }

  return (
    <div className="max-w-xl space-y-8">
      {message && (
        <p
          className={`text-sm p-3 rounded-lg ${
            message.type === "error"
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Export</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Download a JSON backup of your hero section, categories, and menu items. Image URLs point to
          your Supabase Storage or external URLs as stored in the database.
        </p>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={busy !== null}
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {busy === "export" ? "Preparing…" : "Download JSON backup"}
        </button>
      </section>

      <section className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Import</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Upload a JSON file from this app (same format as export). Choose how to apply it:
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="importMode"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-zinc-900 dark:text-white">Merge</span>
              <span className="block text-zinc-600 dark:text-zinc-400">
                Add categories that do not exist yet, then add menu items that are not already present
                (same name in the same category). Existing data is kept. Hero is not changed.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="importMode"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-zinc-900 dark:text-white">Replace all</span>
              <span className="block text-zinc-600 dark:text-zinc-400">
                Deletes all categories and menu items, then imports the file. Also overwrites the hero
                section. This cannot be undone from the app.
              </span>
            </span>
          </label>
        </div>
        <div>
          <label className="inline-block">
            <span className="sr-only">Choose JSON file</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFile(e)}
              disabled={busy !== null}
              className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:text-white dark:file:bg-white dark:file:text-zinc-900 file:font-medium file:hover:opacity-90 disabled:opacity-50"
            />
          </label>
          {busy === "import" && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Importing…</p>
          )}
        </div>
      </section>
    </div>
  );
}
