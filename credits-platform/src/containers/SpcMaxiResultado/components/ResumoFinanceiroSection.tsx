import { useEffect, useMemo, useState, type ReactNode } from "react";

type ResumoFinanceiroItem = {
  label: string;
  value: string | number | ReactNode;
};

type ResumoFinanceiroSectionProps = {
  items: ResumoFinanceiroItem[];
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

function AnimatedResumoValue({ value }: { value: string | number | ReactNode }) {
  const parsed = useMemo(() => {
    if (typeof value === "number") {
      return {
        prefix: "",
        suffix: "",
        target: value,
        decimals: Number.isInteger(value) ? 0 : 2,
      } as ParsedDisplayNumber;
    }

    if (typeof value === "string") {
      return parseDisplayNumber(value);
    }

    return null;
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

export function ResumoFinanceiroSection({ items }: ResumoFinanceiroSectionProps) {
  return (
    <div className="w-1/2 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 mb-1">Resumo Financeiro</p>

      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: "#F8F9FB" }}
          >
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              {label}
            </span>

            {typeof value === "string" || typeof value === "number" ? (
              <span className="text-base font-bold text-gray-800">
                <AnimatedResumoValue value={value} />
              </span>
            ) : (
              value
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
