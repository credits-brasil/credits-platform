import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ResumoFinanceiroItem = {
  label: string;
  value: string | number | ReactNode;
  insumoId?: string;
};

type ResumoFinanceiroSectionProps = {
  items: ResumoFinanceiroItem[];
  onConsultar?: (item: ResumoFinanceiroItem) => void;
  isConsulting?: boolean;
  loadingItemLabel?: string | null;
  unavailableLabels?: string[];
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

function ConsultarInsumosButton({
  onClick,
  loading = false,
  disabled = false,
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#243871]/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      style={{ backgroundColor: "#243871" }}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
      ) : (
        <Search size={12} />
      )}

      {loading ? "Consultando..." : "Consultar"}
    </button>
  );
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

export function ResumoFinanceiroSection({
  items,
  onConsultar,
  isConsulting = false,
  loadingItemLabel = null,
  unavailableLabels = [],
}: ResumoFinanceiroSectionProps) {
  const [pendingItem, setPendingItem] = useState<ResumoFinanceiroItem | null>(null);

  const handleConfirmConsult = () => {
    if (!pendingItem || isConsulting) return;

    onConsultar?.(pendingItem);
    setPendingItem(null);
  };

  return (
    <>
      <AlertDialog
        open={Boolean(pendingItem)}
        onOpenChange={(open) => {
          if (!open) setPendingItem(null);
        }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:rounded-2xl">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
                style={{ backgroundColor: "#E0E7FF", color: "#243871" }}
              >
                !
              </div>

              <div>
                <AlertDialogTitle className="text-left text-base font-semibold text-slate-800">
                  Consultar {pendingItem?.label}?
                </AlertDialogTitle>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <AlertDialogHeader className="space-y-3 text-left">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  Consulta adicional
                </p>
              </div>

              <AlertDialogDescription className="text-sm leading-6 text-slate-600">
                Ao prosseguir, será feita uma nova consulta desse insumo. Caso o sistema
                identifique dados disponíveis, pode haver cobrança adicional.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <AlertDialogCancel
              className="border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              onClick={() => setPendingItem(null)}
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-[#243871] text-white hover:bg-[#1d2d5f] cursor-pointer"
              onClick={handleConfirmConsult}
            >
              Prosseguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-1/2 flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 mb-1">Resumo Financeiro</p>

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const { label, value } = item;
            const shouldRenderActionButton =
              value === null ||
              value === undefined ||
              value === "" ||
              value === "–" ||
              value === "—";

            return (
              <div
                key={label}
                className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "#F8F9FB" }}
              >
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {label}
                </span>

                {shouldRenderActionButton && !unavailableLabels.includes(label) ? (
                  <ConsultarInsumosButton
                    onClick={() => {
                      if (!isConsulting) setPendingItem(item);
                    }}
                    loading={loadingItemLabel === item.label}
                    disabled={isConsulting}
                  />
                ) : unavailableLabels.includes(label) ? (
                  <span
                    className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700"
                  >
                    Não foi possível consultar
                  </span>
                ) : typeof value === "string" || typeof value === "number" ? (
                  <span className="text-base font-bold text-gray-800">
                    <AnimatedResumoValue value={value} />
                  </span>
                ) : (
                  value
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
