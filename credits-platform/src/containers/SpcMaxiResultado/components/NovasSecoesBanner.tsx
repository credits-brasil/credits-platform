import { ArrowDown, Sparkles, X } from "lucide-react";
import type { PrintSection } from "@/components/PrintSectionsDialog";
import { scrollToReportSection } from "@/containers/SpcMaxiResultado/scrollToReportSection";

type NovasSecoesBannerProps = {
  sections: PrintSection[];
  insumosCount: number;
  onClose: () => void;
};

export function NovasSecoesBanner({
  sections,
  insumosCount,
  onClose,
}: NovasSecoesBannerProps) {
  const insumosText =
    insumosCount === 1
      ? "1 insumo consultado"
      : `${insumosCount} insumos consultados`;

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 print:hidden animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[#243871]" aria-hidden="true" />

          <div>
            <p className="text-sm font-semibold text-[#243871]">
              {sections.length > 0
                ? "Novas informações disponíveis"
                : "Consulta adicional concluída"}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {sections.length > 0
                ? `${insumosText}. Veja as seções atualizadas:`
                : `${insumosText}, sem novas informações para exibir no relatório.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>

      {sections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToReportSection(section.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#243871] ring-1 ring-indigo-200 transition-colors hover:bg-indigo-100"
            >
              {section.label}
              <ArrowDown size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
