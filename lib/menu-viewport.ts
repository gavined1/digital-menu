/**
 * Estimate grid columns for the public menu (matches Tailwind breakpoints in MenuPageClient).
 */
function menuGridColumns(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 4;
  if (viewportWidth >= 768) return 3;
  return 2;
}

/**
 * How many items to fetch on first paint so the grid roughly fills the space below the hero
 * without loading the entire catalog.
 */
export function getInitialMenuBatchSize(): number {
  if (typeof window === "undefined") return 12;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const cols = menuGridColumns(vw);
  const heroAndChrome = vh * 0.45 + 180;
  const gridAvailable = Math.max(160, vh - heroAndChrome);
  const rowHeight = vw < 640 ? 250 : 230;
  const rows = Math.max(1, Math.ceil(gridAvailable / rowHeight));
  const n = rows * cols;
  return Math.min(40, Math.max(6, n));
}
