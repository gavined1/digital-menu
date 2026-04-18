"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Star } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { MenuItem } from "@/lib/menu";

const VIRTUAL_THRESHOLD = 36;

function useMenuColumnCount(): number {
  const [cols, setCols] = useState(2);
  useLayoutEffect(() => {
    const mqMd = window.matchMedia("(min-width: 768px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (mqLg.matches) setCols(4);
      else if (mqMd.matches) setCols(3);
      else setCols(2);
    };
    update();
    mqMd.addEventListener("change", update);
    mqLg.addEventListener("change", update);
    return () => {
      mqMd.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

function MenuItemCard({
  item,
  onSelect,
  onPeek,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onPeek: () => void;
}) {
  return (
    <button
      type="button"
      role="listitem"
      aria-label={`${item.name}, ${item.price}`}
      onClick={() => onSelect(item)}
      onMouseEnter={onPeek}
      onFocus={onPeek}
      className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-2 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-zinc-100 dark:border-zinc-800 flex flex-col menu-grid-item text-left w-full min-w-0"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {item.image?.trim() ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] text-center px-2 leading-snug"
            aria-hidden
          >
            No photo
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
            {item.price}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-col grow">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs md:text-sm leading-tight mb-0.5 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
          {item.description}
        </p>
        <div className="mt-auto flex items-center gap-1 text-amber-500">
          <Star size={10} fill="currentColor" aria-hidden />
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            {item.rating}
          </span>
        </div>
      </div>
    </button>
  );
}

type MenuGridProps = {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onPeekDetail: () => void;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  loadingMore: boolean;
};

export const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  onSelectItem,
  onPeekDetail,
  loadMoreRef,
  loadingMore,
}) => {
  const columnCount = useMenuColumnCount();
  const listAnchorRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const el = listAnchorRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setScrollMargin(rect.top + window.scrollY);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length, columnCount]);

  const useVirtual = items.length >= VIRTUAL_THRESHOLD;
  const rowCount = useMemo(
    () => Math.ceil(items.length / columnCount),
    [items.length, columnCount]
  );

  const rowHeightEstimate = columnCount >= 4 ? 320 : columnCount >= 3 ? 300 : 280;

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeightEstimate,
    overscan: 3,
    scrollMargin,
  });

  if (!useVirtual) {
    return (
      <>
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          role="list"
          aria-label="Menu products"
        >
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              onPeek={onPeekDetail}
            />
          ))}
        </div>
        <div
          ref={loadMoreRef}
          className="min-h-[72px] flex items-center justify-center py-8"
          aria-hidden
        >
          {loadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" aria-hidden />
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <div ref={listAnchorRef}>
        <div
          role="list"
          aria-label="Menu products"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const start = virtualRow.index * columnCount;
            const rowItems = items.slice(start, start + columnCount);
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="grid gap-4 md:gap-6 pb-4 md:pb-6"
                  style={{
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onSelect={onSelectItem}
                      onPeek={onPeekDetail}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        ref={loadMoreRef}
        className="min-h-[72px] flex items-center justify-center py-8"
        aria-hidden
      >
        {loadingMore ? (
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" aria-hidden />
        ) : null}
      </div>
    </>
  );
};
