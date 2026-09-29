//src/lib/price.ts
const MAX_CENTS = 100_000_000; // 1,000,000.00

/** "350" → 35000 · "350.50" → 35050 · "1,250.50" → 125050 · "350,50" → 35050 */
export function parsePriceToCents(input: string): number | null {
  let s = input.replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;

  const cents = Math.round(parseFloat(s) * 100);
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2);