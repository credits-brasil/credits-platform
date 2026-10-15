import { formatScoreProbability } from "@/utils/formatScoreProbability";
import { useEffect, useState } from "react";

export function ScoreIndicator({
  score,
  animatedScore,
  probability,
  riskClass,
  compact = false,
  isPositiveScore = false,
  isTwelveMonthPf = false,
  isPjScore = false,
}: {
  score: number;
  animatedScore: number;
  probability?: unknown;
  riskClass?: unknown;
  compact?: boolean;
  isPositiveScore?: boolean;
  isTwelveMonthPf?: boolean;
  isPjScore?: boolean;
}) {
  const displayedRiskClass = typeof riskClass === "string" || typeof riskClass === "number"
    ? String(riskClass).trim() : "";
  const hasPositiveScore = Number.isFinite(score);
  const hasProbability = (typeof probability === "number" || typeof probability === "string") &&
    String(probability).trim() !== "" &&
    Number.isFinite(Number(String(probability).replace(",", ".")));
  const animatedPositiveScore = animatedScore;
  const positiveRiskSegments = isPjScore ? [
    { label: "Risco Alto", backgroundColor: "#F1AAAA", color: "#7F1D1D" },
    { label: "Risco Médio", backgroundColor: "#F59E0B", color: "#78350F" },
    { label: "Risco Baixo", backgroundColor: "#D1EBD9", color: "#14532D" },
    { label: "Risco Muito Baixo", backgroundColor: "#AFE3BF", color: "#14532D" },
  ] : isTwelveMonthPf ? [
    { label: "Risco Alto", backgroundColor: "#F1AAAA", color: "#7F1D1D" },
    { label: "Risco Médio", backgroundColor: "#F59E0B", color: "#78350F" },
    { label: "Risco Baixo", backgroundColor: "#D1EBD9", color: "#14532D" },
    { label: "Risco Muito Baixo", backgroundColor: "#AFE3BF", color: "#14532D" },
  ] : [
    { label: "Risco Alto", backgroundColor: "#F1AAAA", color: "#7F1D1D" },
    { label: "Risco Médio", backgroundColor: "#F59E0B", color: "#78350F" },
    { label: "Risco Baixo", backgroundColor: "#D1EBD9", color: "#14532D" },
    { label: isPositiveScore ? "Risco Muito Baixo" : "Risco Mínimo", backgroundColor: "#AFE3BF", color: "#14532D" },
  ];
  const thresholds = isPjScore ? [0, 405, 598, 793, 1000] : isTwelveMonthPf ? [0, 552, 675, 816, 1000]
    : isPositiveScore ? [0, 405, 598, 793, 1000] : [0, 250, 500, 750, 1000];
  const safeAnimatedScore = Number.isFinite(animatedPositiveScore)
    ? Math.min(1000, Math.max(0, Math.round(animatedPositiveScore))) : 0;
  const getRiskIndex = (value: number) => {
    let index = 0;
    while (index < positiveRiskSegments.length - 1 && value >= thresholds[index + 1]) index++;
    return index;
  };
  const positiveRiskIndex = getRiskIndex(safeAnimatedScore);
  const positiveScoreRisk = isTwelveMonthPf && score === 0
    ? { label: "Restrição ativa", backgroundColor: "#FF7F7F", color: "#7F1D1D" }
    : positiveRiskSegments[positiveRiskIndex];
  const riskPosition = (100 / positiveRiskSegments.length) * (positiveRiskIndex +
    (safeAnimatedScore - thresholds[positiveRiskIndex]) /
    (thresholds[positiveRiskIndex + 1] - thresholds[positiveRiskIndex]));
  const positiveScoreColor = isTwelveMonthPf || isPjScore ? positiveRiskSegments[getRiskIndex(score)].backgroundColor
    : isPositiveScore
      ? score >= 793 ? "#259f58" : score >= 598 ? "#7CB98D" : score >= 405 ? "#F59E0B" : "#DC6464"
      : score >= 675 ? "#259f58" : score >= 467 ? "#ffca39" : "#f6a020";
  return (
    <div data-print-score className={`grid min-h-[164px] grid-cols-1 items-center gap-8 ${compact ? "w-full max-w-[467px] sm:grid-cols-[155px_minmax(0,280px)]" : "sm:grid-cols-[2fr_3fr]"}`}>
      {/* Score gauge */}
      <div className="flex items-center justify-center">
        <div data-print-score-gauge className="relative h-[88px] w-[155px]">
          <svg
            viewBox="0 0 220 130"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path
              d="M 26 108 A 84 84 0 0 1 194 108"
              fill="none"
              stroke="#DCEBE3"
              strokeWidth="16"
              strokeLinecap="round"
              pathLength="100"
            />
            <path
              d="M 26 108 A 84 84 0 0 1 194 108"
              fill="none"
              stroke={positiveScoreColor}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${animatedPositiveScore / 10} 100`}
              pathLength="100"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center leading-none">
            <span
              className="text-[28px] font-bold"
              style={{ color: "#243871" }}
            >
              {hasPositiveScore ? Math.round(animatedPositiveScore) : "?"}
            </span>
            <span
              className="mt-0.5 text-[10px] font-medium"
              style={{ color: "#243871" }}
            >
              de 1000
            </span>
          </div>
        </div>
      </div>

      {/* Risk scale */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full max-w-[280px] flex-col items-center gap-4">
          {hasProbability && (
            <span className="text-[13px] text-gray-500">
              Inadimplência:{" "}
              <strong className="font-bold text-gray-700">{formatScoreProbability(probability)}</strong>
            </span>
          )}
          {displayedRiskClass && (
            <span className="text-[13px] text-gray-500">
              Risco de Crédito:{" "}
              <strong className="font-bold text-gray-700">{displayedRiskClass}</strong>
            </span>
          )}
          <div className="relative h-6 w-full">
            <span
              data-print-risk-badge
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{
                left: `${Math.min(87.5, Math.max(12.5, riskPosition))}%`,
                backgroundColor: positiveScoreRisk.backgroundColor,
                color: positiveScoreRisk.color,
              }}
            >
              {hasPositiveScore ? positiveScoreRisk.label : "-"}
            </span>
          </div>
        </div>

        <div className="w-full max-w-[280px]">
          <div
            className="relative h-2 overflow-visible rounded-full"
            role="img"
            aria-label={`Escala de risco: ${hasPositiveScore ? positiveScoreRisk.label : "indispon?vel"}`}
          >
            <div className="flex h-2 overflow-hidden rounded-full">
              {positiveRiskSegments.map((segment) => (
                <span
                  key={segment.label}
                  className="flex-1"
                  style={{ backgroundColor: segment.backgroundColor }}
                />
              ))}
            </div>
            <span
              className="absolute -top-1.5 h-5 w-0.5 rounded-full"
              style={{
                left: `${riskPosition}%`,
                backgroundColor: "#243871",
              }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 grid gap-1 text-[9px] font-medium" style={{ gridTemplateColumns: `repeat(${positiveRiskSegments.length}, minmax(0, 1fr))` }}>
            {positiveRiskSegments.map((segment) => (
              <span key={segment.label} title={segment.label} className="text-center text-gray-500">
                {segment.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimatedScoreIndicator({ score, probability, riskClass, isPositiveScore = false, isTwelveMonthPf = false, isPjScore = false }: { score: number; probability?: unknown; riskClass?: unknown; isPositiveScore?: boolean; isTwelveMonthPf?: boolean; isPjScore?: boolean }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frameId = 0;
    setAnimatedScore(0);
    const animate = (now: number) => {
      const progress = Math.min(Math.max((now - start) / 900, 0), 1);
      setAnimatedScore(score * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [score]);
  return <ScoreIndicator score={score} animatedScore={animatedScore} probability={probability} riskClass={riskClass} isPositiveScore={isPositiveScore} isTwelveMonthPf={isTwelveMonthPf} isPjScore={isPjScore} compact />;
}
