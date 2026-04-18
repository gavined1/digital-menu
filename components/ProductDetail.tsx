"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Clock, Star, X } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

type ProductDetailProps = {
  item: MenuItem | null;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ProductDetail: React.FC<ProductDetailProps> = ({ item, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!item) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    const first = focusables[0];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (nodes.length === 0) return;

      const ix = nodes.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (ix <= 0) {
          e.preventDefault();
          nodes[nodes.length - 1]?.focus();
        }
      } else if (ix === nodes.length - 1) {
        e.preventDefault();
        nodes[0]?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [item, handleClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer border-0 p-0 appearance-none ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        aria-label="Close product details"
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        className={`
          relative w-full md:max-w-lg bg-white dark:bg-zinc-900 
          rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl 
          transform transition-transform duration-300 ease-out
          ${
            isClosing
              ? "translate-y-full md:translate-y-10 md:opacity-0"
              : "translate-y-0"
          }
          max-h-[90vh] flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all"
          aria-label="Close"
        >
          <X size={20} aria-hidden />
        </button>

        <div className="relative h-72 md:h-80 w-full shrink-0 bg-zinc-800">
          {item.image?.trim() ? (
            <Image
              src={item.image}
              alt=""
              fill
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm"
              aria-hidden
            >
              No photo
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                {item.category}
              </span>
              <div className="flex items-center gap-1 text-amber-300 text-xs font-medium bg-black/30 backdrop-blur-md px-2 py-1 rounded-md">
                <Star size={12} fill="currentColor" aria-hidden /> {item.rating}
              </div>
            </div>
            <h2
              id={titleId}
              className="text-3xl font-serif font-bold leading-tight shadow-sm"
            >
              {item.name}
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
              <Clock size={16} aria-hidden />
              <span>Prep: {item.time}</span>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">
              {item.price}
            </span>
          </div>

          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-base">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
