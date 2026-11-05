import { useState } from "react";
import { Search } from "lucide-react";
import { FilterCheckboxComponent } from "@/components";
import { InsumoGroupCard } from "@/containers/SpcMaxi/components/InsumoGroupCard";
import type { InsumoGroup } from "@/constants/insumo-groups";

type InsumosAdicionaisSectionProps = {
  groups: InsumoGroup[];
  consultedIds: Set<string>;
  isConsulting: boolean;
  /** Another extra consultation is pending or in progress. */
  disabled?: boolean;
  /** Looks disabled but stays clickable, so the click can explain why. */
  blocked?: boolean;
  errorMessage?: string | null;
  onSubmit: (insumoIds: string[]) => void;
};

export function InsumosAdicionaisSection({
  groups,
  consultedIds,
  isConsulting,
  disabled = false,
  blocked = false,
  errorMessage,
  onSubmit,
}: InsumosAdicionaisSectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const availableIds = Array.from(
    new Set(groups.flatMap((group) => group.items.map((item) => item.id))),
  ).filter((id) => !consultedIds.has(id));

  // Insumos consulted in the meantime drop out of the selection on their own.
  const selectedIds = availableIds.filter((id) => selected.has(id));
  const isAllSelected =
    availableIds.length > 0 && selectedIds.length === availableIds.length;
  const canSubmit = selectedIds.length > 0 && !isConsulting && !disabled;

  const toggleInsumo = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (groups.length === 0) return null;

  return (
    <div
      id="section-insumos-adicionais"
      className="mb-4 mt-2 rounded-xl border border-gray-200 bg-white p-5 print:hidden"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">
            Insumos Opcionais
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {availableIds.length > 0
              ? "Selecione os insumos que ainda não foram consultados para complementar este relatório."
              : "Todos os insumos disponíveis já foram consultados."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {availableIds.length > 0 && (
            <FilterCheckboxComponent
              checked={isAllSelected}
              onChange={() =>
                setSelected(isAllSelected ? new Set() : new Set(availableIds))
              }
              label="Selecionar todos"
              labelFirst
              disabled={isConsulting}
              className="px-3 py-1.5"
            />
          )}

          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            {selectedIds.length} selecionado{selectedIds.length !== 1 ? "s" : ""}
          </span>

          <button
            type="button"
            onClick={() => onSubmit(selectedIds)}
            disabled={!canSubmit}
            aria-disabled={blocked || undefined}
            className={`inline-flex items-center gap-2 rounded-lg bg-[#243871] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1b2b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#243871] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
              blocked ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {isConsulting ? (
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
            ) : (
              <Search size={14} aria-hidden="true" />
            )}
            {isConsulting ? "Consultando..." : "Consultar selecionados"}
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 ${
          isConsulting ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {groups.map((group) => (
          <InsumoGroupCard
            key={group.id}
            group={group}
            selected={selected}
            onToggleInsumo={toggleInsumo}
            lockedIds={consultedIds}
            lockedTitle="Insumo já consultado"
          />
        ))}
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
