export type ResultProductCode = "323" | "325" | "337" | "629" | "668" | "695";

const PRODUCT_CODES: ResultProductCode[] = ["323", "325", "337", "629", "668", "695"];

/** Checked in order: "SPC MIX MAIS" must win over "SPC MAIS". */
const PRODUCT_NAME_PATTERNS: Array<[string, ResultProductCode]> = [
  ["SPC MIX MAIS", "323"],
  ["SPC RELATORIO", "337"],
  ["SPC POSITIVO INTERMEDIARIO", "629"],
  ["SPC AVANCADA", "668"],
  ["SPC MAXI", "325"],
  ["SPC MAIS", "695"],
];

function normalizeProductName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Finds which product an order belongs to from its stored product name
 * (e.g. "695 SPC MAIS", "SPC Positivo Intermediário PJ"): the product code wins, then the name.
 */
export function findResultProductCode(productName?: string | null): ResultProductCode | null {
  const normalized = normalizeProductName(productName ?? "");
  if (!normalized) return null;

  const code = PRODUCT_CODES.find((value) => new RegExp(`(^| )${value}( |$)`).test(normalized));
  if (code) return code;

  const match = PRODUCT_NAME_PATTERNS.find(([pattern]) => normalized.includes(pattern));
  return match ? match[1] : null;
}
