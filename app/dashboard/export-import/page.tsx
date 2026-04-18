import ExportImportClient from "./ExportImportClient";

export default function ExportImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Export &amp; import
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Back up your menu or restore from a JSON file. Use files exported from this dashboard only.
      </p>
      <ExportImportClient />
    </div>
  );
}
