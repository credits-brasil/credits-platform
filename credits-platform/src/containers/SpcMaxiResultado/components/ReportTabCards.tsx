import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";

export type IsInsumoRequested = (insumoId: string) => boolean;

export type ReportTab<K extends string> = {
  key: K;
  label: string;
  count: number;
  helper: string;
  /** Insumos that bring the tab's data; any one of them being requested shows the tab. */
  insumos: string[];
};

/** Tabs whose insumo was requested; data that came back is shown even if its insumo isn't mapped. */
export function getVisibleTabs<K extends string>(
  tabs: ReportTab<K>[],
  isInsumoRequested: IsInsumoRequested,
): ReportTab<K>[] {
  return tabs.filter(
    (tab) => tab.count > 0 || tab.insumos.some(isInsumoRequested),
  );
}

/** Opens on the first tab with data; falls back if the selected tab is no longer shown. */
export function getActiveTab<K extends string>(
  tabs: ReportTab<K>[],
  selectedKey: K | null,
): ReportTab<K> {
  return (
    tabs.find((tab) => tab.key === selectedKey) ??
    tabs.find((tab) => tab.count > 0) ??
    tabs[0]
  );
}

export function formatDocument(document?: string): string {
  if (!document) return "-";

  const digits = document.replace(/\D/g, "");
  if (digits.length === 11) return formatCPF(digits);
  if (digits.length === 14) return formatCNPJ(digits);
  return document;
}

export function ReportTabCards<K extends string>({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: ReportTab<K>[];
  activeKey: K;
  onSelect: (key: K) => void;
}) {
  return (
    // Always 4 columns, so the cards keep the same size whatever the number of tabs.
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className="text-left rounded-xl border p-3 transition-all"
            style={{
              borderColor: isActive ? "#ED884A" : "#E5E7EB",
              backgroundColor: isActive ? "#FFFBF7" : "#fff",
              boxShadow: isActive
                ? "0 6px 20px rgba(237, 136, 74, 0.18)"
                : "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div className="mb-2 flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                {tab.label}
              </p>
            </div>

            <hr className="mb-2 border-gray-200" />

            <div className="mb-1 text-right">
              <span
                className="text-2xl font-bold leading-none"
                style={{ color: isActive ? "#ED884A" : "#1F2937" }}
              >
                {tab.count}
              </span>
            </div>

            <span className="inline-flex max-w-full rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <span className="truncate">{tab.helper}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
