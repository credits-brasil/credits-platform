export function formatScoreProbability(value: unknown): string {
  if (typeof value !== "number" && typeof value !== "string") return "?";
  if (typeof value === "string" && value.trim() === "") return "?";
  const probability = Number(typeof value === "string" ? value.replace(",", ".") : value);
  if (!Number.isFinite(probability)) return "?";
  return `${probability.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
