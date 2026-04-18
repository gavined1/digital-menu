"use client";

import { useState, useRef } from "react";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type MenuItemForm,
} from "../actions";
import { createClient } from "@/lib/supabase/client";
import { formatKhmerRiel } from "@/lib/format-currency";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  MENU_ITEMS_BUCKET,
} from "@/lib/storage-constants";
import { getStoragePathFromPublicUrl } from "@/lib/storage-utils";
import type { MenuItemRow } from "./page";
import type { CategoryOption } from "./page";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

async function removeFromStorageIfOurs(url: string): Promise<void> {
  const path = getStoragePathFromPublicUrl(url, SUPABASE_URL);
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(MENU_ITEMS_BUCKET).remove([path]);
}

function ImagePreview({ src, size = 48 }: { src: string | null; size?: number }) {
  const [error, setError] = useState(false);
  if (!src?.trim() || error) {
    return (
      <div
        className="rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs shrink-0"
        style={{ width: size, height: size }}
      >
        {error ? "?" : "—"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user/supabase URLs, dynamic
    <img
      src={src}
      alt=""
      className="rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

function itemToForm(item: MenuItemRow): MenuItemForm {
  return {
    categoryId: item.category_id,
    name: item.name,
    description: item.description ?? "",
    price: String(item.price),
    image: item.image ?? "",
    rating: item.rating ?? 0,
    time: item.time ?? "",
  };
}

export default function MenuItemsManager({
  initialItems,
  categories,
}: {
  initialItems: MenuItemRow[];
  categories: CategoryOption[];
}) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [form, setForm] = useState<MenuItemForm>({
    categoryId: categories[0]?.id ?? 0,
    name: "",
    description: "",
    price: "",
    image: "",
    rating: 0,
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function showMsg(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function categoryName(id: number) {
    return categories.find((c) => c.id === id)?.name ?? "—";
  }

  function openAdd() {
    setForm({
      categoryId: categories[0]?.id ?? 0,
      name: "",
      description: "",
      price: "",
      image: "",
      rating: 0,
      time: "",
    });
    setModal("add");
  }

  function openEdit(item: MenuItemRow) {
    setEditingItem(item);
    setForm(itemToForm(item));
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingItem(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    setMessage(null);
    const result = await createMenuItem(form);
    setIsSubmitting(false);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    const newItem: MenuItemRow = {
      id: result.id!,
      category_id: form.categoryId,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      image: form.image || null,
      rating: form.rating ?? null,
      time: form.time || null,
    };
    setItems((prev) => [newItem, ...prev]);
    closeModal();
    showMsg("ok", "Item added.");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    setMessage(null);
    const result = await updateMenuItem(editingItem.id, form);
    setIsSubmitting(false);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              category_id: form.categoryId,
              name: form.name,
              description: form.description || null,
              price: parseFloat(form.price) || 0,
              image: form.image || null,
              rating: form.rating ?? null,
              time: form.time || null,
            }
          : i
      )
    );
    closeModal();
    showMsg("ok", "Item updated.");
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this menu item?")) return;
    setDeletingId(id);
    setMessage(null);
    const result = await deleteMenuItem(id);
    setDeletingId(null);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    showMsg("ok", "Item deleted.");
  }

  if (categories.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Create at least one category first, then add menu items.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={openAdd}
        className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 shadow-sm"
      >
        Add menu item
      </button>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-3 font-medium text-zinc-900 dark:text-white w-16">Image</th>
                <th className="p-3 font-medium text-zinc-900 dark:text-white">Name</th>
                <th className="p-3 font-medium text-zinc-900 dark:text-white">Category</th>
                <th className="p-3 font-medium text-zinc-900 dark:text-white">Price</th>
                <th className="p-3 font-medium text-zinc-900 dark:text-white text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="p-3">
                    <ImagePreview src={item.image} size={48} />
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-zinc-900 dark:text-white">{item.name}</span>
                    {item.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{categoryName(item.category_id)}</td>
                  <td className="p-3 text-zinc-900 dark:text-white font-medium">
                    {formatKhmerRiel(item.price)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add menu item" : "Edit menu item"} onClose={closeModal}>
          <ItemForm
            form={form}
            setForm={setForm}
            categories={categories}
            onSubmit={modal === "add" ? handleAdd : handleUpdate}
            onCancel={closeModal}
            submitLabel={modal === "add" ? "Add item" : "Save changes"}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ImageField({
  value,
  onChange,
}: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    const path = `${crypto.randomUUID()}.${ext}`;

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
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Image</label>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="menu-item-image-upload"
            />
            <label
              htmlFor="menu-item-image-upload"
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
                  <ImagePreview key={value} src={value} size={80} />
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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

function ItemForm({
  form,
  setForm,
  categories,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: {
  form: MenuItemForm;
  setForm: React.Dispatch<React.SetStateAction<MenuItemForm>>;
  categories: CategoryOption[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: parseInt(e.target.value, 10) }))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <ImageField value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Price (៛, riel)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="e.g. 15000"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rating (0–5)</label>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time (e.g. 15 min)</label>
        <input
          type="text"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          placeholder="15 min"
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
