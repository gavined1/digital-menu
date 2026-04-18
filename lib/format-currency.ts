/**
 * Format amounts stored as Khmer Riel (whole numbers in DB).
 * Uses the Riel sign (៛) via Intl for km-KH / KHR.
 */
export function formatKhmerRiel(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(n)) {
    return new Intl.NumberFormat("km-KH", {
      style: "currency",
      currency: "KHR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat("km-KH", {
    style: "currency",
    currency: "KHR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
