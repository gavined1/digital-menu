"use client";

import { useState, useRef } from "react";
import { updateHero, type HeroForm } from "../actions";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_MIME_TYPES,
  HERO_IMAGE_PREFIX,
  MAX_FILE_BYTES,
  MENU_ITEMS_BUCKET,
} from "@/lib/storage-constants";
import { getStoragePathFromPublicUrl } from "@/lib/storage-utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

async function removeFromStorageIfOurs(url: string): Promise<void> {
  const path = getStoragePathFromPublicUrl(url, SUPABASE_URL);
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(MENU_ITEMS_BUCKET).remove([path]);
}

function HeroImageField({
  label,
  value,
  onChange,
  pathPrefix,
  inputId,
  previewSize = 80,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
  inputId: string;
  previewSize?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    if (inputRef.current) inputRef.current.value = "";

    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File too large (max 10MB)");
      setUploading(false);
      return;
    }
    const type = file.type?.toLowerCase();
    if (!type || !ALLOWED_MIME_TYPES.includes(type)) {
      setUploadError("Use JPEG, PNG, GIF, or WebP");
      setUploading(false);
      return;
    }

    const supabase = createClient();
    await removeFromStorageIfOurs(value);

    const ext = type === "image/jpeg" ? "jpg" : type.replace("image/", "");
    const path = `${pathPrefix}${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(MENU_ITEMS_BUCKET).upload(path, file, {
      contentType: type,
      upsert: false,
    });

    setUploading(false);
    if (error) {
      setUploadError(error.message);
      return;
    }
    const { data } = supabase.storage.from(MENU_ITEMS_BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
  }

  async function handleRemove() {
    setUploadError(null);
    await removeFromStorageIfOurs(value);
    onChange("");
  }

  function handleUrlChange(newUrl: string) {
    setUploadError(null);
    removeFromStorageIfOurs(value).catch(() => {});
    onChange(newUrl);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id={inputId}
            />
            <label
              htmlFor={inputId}
              className={`px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium cursor-pointer transition-colors ${
                uploading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {uploading ? "Uploading…" : "Upload image"}
            </label>
            <input
              type="url"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Or paste image URL"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
            />
          </div>
          {(uploadError || value) && (
            <div className="flex items-center gap-2 flex-wrap">
              {value ? (
                <div className="relative inline-block group">
                  {imgError || !value.trim() ? (
                    <div
                      className="rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs shrink-0"
                      style={{ width: previewSize, height: previewSize }}
                    >
                      —
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase URL
                    <img
                      src={value}
                      alt=""
                      className="rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                      style={{ width: previewSize, height: previewSize }}
                      onError={() => setImgError(true)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              {uploadError && (
                <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeroEditor({
  initial,
}: { initial: HeroForm }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const result = await updateHero(form);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: "Hero saved." });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
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
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Name / Brand
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <HeroImageField
        label="Logo"
        value={form.logoUrl}
        onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
        pathPrefix={`${HERO_IMAGE_PREFIX}logo-`}
        inputId="hero-logo-upload"
        previewSize={64}
      />
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Badge text
        </label>
        <input
          type="text"
          value={form.badgeText}
          onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Location text
        </label>
        <input
          type="text"
          value={form.locationText}
          onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Subtitle
        </label>
        <textarea
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <HeroImageField
        label="Background image"
        value={form.backgroundImageUrl}
        onChange={(url) => setForm((f) => ({ ...f, backgroundImageUrl: url }))}
        pathPrefix={HERO_IMAGE_PREFIX}
        inputId="hero-background-upload"
        previewSize={120}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90"
      >
        Save hero
      </button>
    </form>
  );
}
