import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

type ScrOperacao = {
  quantidade?: string | number | null;
  contratadoInicial?: string | number | null;
  contratadoFinal?: string | number | null;
};

type HistoricoScrScoreData = {
  score?: string | number | null;
  "indice-risco-credito-score"?: string | number | null;
  "probabilidade-inadimplencia"?: string | number | null;
};

type ScrSummarySectionProps = {
  hasScrData: boolean;
  scrOperacao: ScrOperacao;
  historicoScrScoreData?: HistoricoScrScoreData | null;
};

type ParsedDisplayNumber = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
};

function parseDisplayNumber(value: string): ParsedDisplayNumber | null {
  const match = value.match(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!match || match.index === undefined) {
    return null;
  }

  const numericToken = match[0];
  const normalizedToken = numericToken.replace(/\./g, "").replace(",", ".");
  const target = Number(normalizedToken);
  if (!Number.isFinite(target)) {
    return null;
  }

  const decimals = numericToken.includes(",")
    ? numericToken.split(",")[1]?.length ?? 0
    : 0;

  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + numericToken.length),
    target,
    decimals,
  };
}

function AnimatedScrValue({ value }: { value: string | number }) {
  const parsed = useMemo(() => {
    if (typeof value === "number") {
      return {
        prefix: "",
        suffix: "",
        target: value,
        decimals: Number.isInteger(value) ? 0 : 2,
      } as ParsedDisplayNumber;
    }

    return parseDisplayNumber(value);
  }, [value]);

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!parsed) {
      return;
    }

    const duration = 900;
    const start = performance.now();

    setAnimatedValue(0);

    let frameId = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedValue(parsed.target * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [parsed]);

  if (!parsed) {
    return <>{value}</>;
  }

  const formattedNumber = Math.max(animatedValue, 0).toLocaleString("pt-BR", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return <>{`${parsed.prefix}${formattedNumber}${parsed.suffix}`}</>;
}

function ScrDataItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  const safeValue = value ?? "-";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>

      <span className="text-base font-bold text-gray-800">
        {typeof safeValue === "string" || typeof safeValue === "number" ? (
          <AnimatedScrValue value={safeValue} />
        ) : (
          "-"
        )}
      </span>
    </div>
  );
}

export function ScrSummarySection({ hasScrData, scrOperacao, historicoScrScoreData }: ScrSummarySectionProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-100 p-4 md:col-span-2 xl:col-span-1">
      <span className="text-xs text-gray-500 font-medium">SCR</span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hasScrData && (
          <>
            <ScrDataItem label="Operações" value={scrOperacao.quantidade} />

            <ScrDataItem
              label="Contratado Inicial"
              value={formatCurrency(scrOperacao.contratadoInicial)}
            />

            <ScrDataItem
              label="Contratado Final"
              value={formatCurrency(scrOperacao.contratadoFinal)}
            />
          </>
        )}

        {historicoScrScoreData && (
          <>
            <ScrDataItem label="Score SCR" value={historicoScrScoreData?.score ?? "-"} />

            <ScrDataItem
              label="Risco de Crédito"
              value={historicoScrScoreData?.["indice-risco-credito-score"] ?? "-"}
            />

            <ScrDataItem
              label="Prob. Inadimplência"
              value={
                historicoScrScoreData?.["probabilidade-inadimplencia"]
                  ? `${historicoScrScoreData?.["probabilidade-inadimplencia"]}%`
                  : "-"
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
