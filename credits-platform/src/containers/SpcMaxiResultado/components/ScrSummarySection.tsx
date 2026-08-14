import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

type ScrOperacao = {
  quantidade?: string | number | null;
  "data-inicio-relacionamento"?: string | number | null;
  "valor-total-contratado-inicial"?: string | number | null;
  "valor-total-contratado-final"?: string | number | null;
  "quantidade-instituicao-scr"?: string | number | null;
  resumoQuantidadeTotal?: string | number | null;
};

type ScrSummarySectionProps = {
  hasScrData: boolean;
  scrOperacao: ScrOperacao;
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

export function ScrSummarySection({ hasScrData, scrOperacao }: ScrSummarySectionProps) {
  const items = [
    {
      label: "Quantidade total",
      value: scrOperacao.resumoQuantidadeTotal ?? scrOperacao.quantidade ?? "-",
    },
    {
      label: "Data início relacionamento",
      value: formatDate(String(scrOperacao["data-inicio-relacionamento"] ?? "")),
    },
    {
      label: "Valor contratado",
      value: `${formatCurrency(scrOperacao["valor-total-contratado-inicial"])} a ${formatCurrency(scrOperacao["valor-total-contratado-final"])}`,
    },
    {
      label: "Quantidade instituição",
      value: scrOperacao["quantidade-instituicao-scr"] ?? "-",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {hasScrData ? (
        <div className="grid grid-cols-2 gap-2">
          {items.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: "#F8F9FB" }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {label}
              </span>

              <span className="text-base font-bold text-gray-800">
                {typeof value === "string" || typeof value === "number" ? (
                  <AnimatedScrValue value={value} />
                ) : (
                  value
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full min-h-[90px] items-center justify-center rounded-lg bg-[#F8F9FB] text-sm text-gray-400">
          Nenhum dado de SCR disponível
        </div>
      )}
    </div>
  );
}
