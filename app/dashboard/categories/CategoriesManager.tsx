"use client";

import { Fragment, useState } from "react";
import { GripVertical } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../actions";
import type { CategoryRow } from "./page";

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const out = list.slice();
  const [removed] = out.splice(fromIndex, 1);
  out.splice(toIndex, 0, removed);
  return out;
}

export default function CategoriesManager({
  initialCategories,
}: { initialCategories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(initialCategories.length);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropAfterIndex, setDropAfterIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  function showMsg(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setMessage(null);
    const result = await createCategory(newName.trim(), newSortOrder);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    setCategories((prev) => [...prev, { id: result.id!, name: newName.trim(), sort_order: newSortOrder }].sort((a, b) => a.sort_order - b.sort_order));
    setNewName("");
    setNewSortOrder((n) => n + 1);
    setAdding(false);
    showMsg("ok", "Category added.");
  }

  function startEdit(c: CategoryRow) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSortOrder(c.sort_order);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setMessage(null);
    const result = await updateCategory(editingId, editName.trim(), editSortOrder);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? { ...c, name: editName.trim(), sort_order: editSortOrder }
          : c
      ).sort((a, b) => a.sort_order - b.sort_order)
    );
    setEditingId(null);
    showMsg("ok", "Category updated.");
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category? Menu items in it will need a new category.")) return;
    setMessage(null);
    const result = await deleteCategory(id);
    if (result.error) {
      showMsg("error", result.error);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showMsg("ok", "Category deleted.");
  }

  function handleDragStart(e: React.DragEvent, id: number) {
    setDraggedId(id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const dropAfter = e.clientY < mid ? index - 1 : index;
    setDropAfterIndex(dropAfter);
  }

  function handleDragLeave() {
    setDropAfterIndex(null);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDraggedId(null);
    setDropAfterIndex(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { id: idBeingDragged } = JSON.parse(raw) as { id: number };
    const fromIndex = categories.findIndex((c) => c.id === idBeingDragged);
    if (fromIndex === -1) return;
    const insertIndex =
      dropAfterIndex === null
        ? fromIndex
        : Math.min(Math.max(0, dropAfterIndex + 1), categories.length);
    if (insertIndex === fromIndex) return;
    const reordered = reorderList(categories, fromIndex, insertIndex).map((c, i) => ({
      ...c,
      sort_order: i,
    }));
    setCategories(reordered);
    setIsReordering(true);
    setMessage(null);
    const result = await reorderCategories(reordered.map((c) => ({ id: c.id, sort_order: c.sort_order })));
    setIsReordering(false);
    if (result.error) {
      showMsg("error", result.error);
      setCategories(categories);
      return;
    }
    showMsg("ok", "Order saved.");
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDropAfterIndex(null);
  }

  return (
    <div className="space-y-4">
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

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90"
        >
          Add category
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-48 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90">
            Save
          </button>
          <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Cancel
          </button>
        </form>
      )}

      {isReordering && (
        <p className="text-sm p-3 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
          Saving order…
        </p>
      )}

      <ul
        className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
        onDragLeave={handleDragLeave}
      >
        {dropAfterIndex === -1 && (
          <li
            className="h-1 bg-amber-500 dark:bg-amber-400 rounded-full mx-2 my-1 shrink-0 pointer-events-none list-none"
            aria-hidden
          />
        )}
        {categories.map((c, index) => (
          <Fragment key={c.id}>
          <li
            key={c.id}
            data-category-id={c.id}
            draggable={editingId !== c.id}
            onDragStart={(e) => handleDragStart(e, c.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-4 transition-opacity ${
              draggedId === c.id ? "opacity-50" : ""
            } ${editingId !== c.id ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            {editingId === c.id ? (
              <form onSubmit={handleUpdate} className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-48 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm">Cancel</button>
              </form>
            ) : (
              <>
                <span
                  className="shrink-0 p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 touch-none"
                  aria-hidden
                >
                  <GripVertical size={20} />
                </span>
                <span className="shrink-0 w-6 text-sm font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {index + 1}
                </span>
                <span className="font-medium text-zinc-900 dark:text-white flex-1 min-w-0">{c.name}</span>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(c)} className="text-sm text-amber-600 dark:text-amber-400 hover:underline">Edit</button>
                  <button type="button" onClick={() => handleDelete(c.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
                </div>
              </>
            )}
          </li>
          {dropAfterIndex === index && (
            <li
              className="h-1 bg-amber-500 dark:bg-amber-400 rounded-full mx-2 my-1 shrink-0 pointer-events-none list-none border-0"
              aria-hidden
            />
          )}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
