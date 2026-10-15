import { formatScoreProbability } from "@/utils/formatScoreProbability";
import { useEffect, useState } from "react";

export function ScoreIndicator({
  score,
  animatedScore,
  probability,
  compact = false,
}: {
  score: number;
  animatedScore: number;
  probability?: unknown;
  compact?: boolean;
}) {
  const hasPositiveScore = Number.isFinite(score);
  const animatedPositiveScore = animatedScore;
  const positiveScoreColor =
    score >= 675 ? "#259f58" : score >= 467 ? "#ffca39" : "#f6a020";
  const positiveRiskSegments = [
    { label: "Risco Alto", backgroundColor: "#F1AAAA", color: "#7F1D1D" },
    { label: "Risco Médio", backgroundColor: "#F59E0B", color: "#78350F" },
    { label: "Risco Baixo", backgroundColor: "#D1EBD9", color: "#14532D" },
    { label: "Risco Mínimo", backgroundColor: "#AFE3BF", color: "#14532D" },
  ];
  const positiveRiskIndex = Number.isFinite(animatedPositiveScore)
    ? Math.min(
        positiveRiskSegments.length - 1,
        Math.max(0, Math.floor(animatedPositiveScore / 250)),
      )
    : 0;
  const positiveScoreRisk = positiveRiskSegments[positiveRiskIndex];
  return (
    <div className={`grid min-h-[164px] grid-cols-1 items-center gap-8 ${compact ? "w-full max-w-[467px] sm:grid-cols-[155px_minmax(0,280px)]" : "sm:grid-cols-[2fr_3fr]"}`}>
      {/* Score gauge */}
      <div className="flex items-center justify-center">
        <div className="relative h-[88px] w-[155px]">
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
          <span className="text-[13px] text-gray-500">
            Inadimplência:{" "}
            <strong className="font-bold text-gray-700">{formatScoreProbability(probability)}</strong>
          </span>
          <div className="relative h-6 w-full">
            <span
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{
                left: `${Math.min(87.5, Math.max(12.5, animatedPositiveScore / 10))}%`,
                backgroundColor: positiveScoreRisk.backgroundColor,
                color: positiveScoreRisk.color,
              }}
            >
              {hasPositiveScore ? positiveScoreRisk.label : "?"}
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
                  className="w-1/4"
                  style={{ backgroundColor: segment.backgroundColor }}
                />
              ))}
            </div>
            <span
              className="absolute -top-1.5 h-5 w-0.5 rounded-full"
              style={{
                left: `${animatedPositiveScore / 10}%`,
                backgroundColor: "#243871",
              }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 grid grid-cols-4 text-[10px] font-medium">
            <span className="whitespace-nowrap text-left text-gray-500">
              Risco Alto
            </span>
            <span
              className="whitespace-nowrap text-center"
              style={{ color: "#ED9A2F" }}
            >
              Risco Médio
            </span>
            <span className="whitespace-nowrap text-center text-gray-500">
              Risco Baixo
            </span>
            <span className="whitespace-nowrap text-right text-gray-500">
              Risco Mínimo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimatedScoreIndicator({ score, probability }: { score: number; probability?: unknown }) {
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
  return <ScoreIndicator score={score} animatedScore={animatedScore} probability={probability} compact />;
}
