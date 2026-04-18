import React from "react";

/**
 * Hoisted static skeleton UI for Suspense fallback (rendering-hoist-jsx).
 * Reused instance, not recreated every time Suspense shows fallback.
 */
export const HeroSkeleton = (
  <div
    className="relative h-[45vh] min-h-[350px] flex items-end overflow-hidden pb-12 rounded-b-[40px] bg-zinc-200 dark:bg-zinc-800 animate-pulse"
    aria-hidden
  >
    <div className="relative z-10 px-5 w-full container mx-auto space-y-3">
      <div className="flex gap-2">
        <span className="h-6 w-20 rounded-md bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-6 w-24 rounded-md bg-zinc-300 dark:bg-zinc-700" />
      </div>
      <div className="h-10 w-64 md:w-96 rounded-lg bg-zinc-300 dark:bg-zinc-700" />
      <div className="h-4 w-48 rounded bg-zinc-300 dark:bg-zinc-700" />
    </div>
  </div>
);

export const CategoryPillsSkeleton = (
  <div className="flex gap-3 overflow-hidden px-5 py-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className="h-10 w-20 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"
      />
    ))}
  </div>
);

export const GridSkeleton = (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl p-2 border border-zinc-100 dark:border-zinc-800"
      >
        <div className="w-full aspect-square rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="mt-2 space-y-2">
          <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-2 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export default function PageSkeleton() {
  return (
    <div className="min-h-screen relative font-sans bg-stone-50 dark:bg-zinc-950">
      <div className="relative z-10">
        <nav className="absolute top-0 left-0 right-0 z-40 py-5">
          <div className="container mx-auto px-5 flex justify-between items-center">
            <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </nav>
        {HeroSkeleton}
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200/50 dark:border-zinc-800/50">
          {CategoryPillsSkeleton}
        </div>
        <main className="container mx-auto px-4 py-4 pb-32">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="h-7 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          {GridSkeleton}
        </main>
      </div>
    </div>
  );
}
