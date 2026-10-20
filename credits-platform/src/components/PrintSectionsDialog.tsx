import { Printer } from "lucide-react";

import { FilterCheckboxComponent } from "@/components/FilterCheckbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PrintSection = {
  id: string;
  label: string;
};

type PrintSectionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: PrintSection[];
  selectedIds: string[];
  onSelectedIdsChange: (selectedIds: string[]) => void;
  onConfirm: () => void;
  onClosed: () => void;
};

export function PrintSectionsDialog({
  open,
  onOpenChange,
  sections,
  selectedIds,
  onSelectedIdsChange,
  onConfirm,
  onClosed,
}: PrintSectionsDialogProps) {
  const allSelected = selectedIds.length === sections.length;

  const toggleSection = (id: string) => {
    // Rebuild from the sections list to keep the report order.
    onSelectedIdsChange(
      sections
        .filter((section) =>
          section.id === id
            ? !selectedIds.includes(id)
            : selectedIds.includes(section.id),
        )
        .map((section) => section.id),
    );
  };

  const toggleAll = () => {
    onSelectedIdsChange(allSelected ? [] : sections.map(({ id }) => id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onCloseAutoFocus={onClosed}>
        <DialogHeader>
          <DialogTitle className="text-base text-gray-800">
            Imprimir relatório
          </DialogTitle>

          <DialogDescription>
            Selecione as seções que deseja incluir na impressão.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gray-200">
          <FilterCheckboxComponent
            checked={allSelected}
            onChange={toggleAll}
            label="Selecionar todas"
            className="border-b border-gray-100 px-3 py-2.5"
            labelClassName="font-semibold text-gray-700"
          />

          <div className="max-h-72 overflow-y-auto px-3 py-1">
            {sections.map(({ id, label }) => (
              <FilterCheckboxComponent
                key={id}
                checked={selectedIds.includes(id)}
                onChange={() => toggleSection(id)}
                label={label}
                className="py-2"
              />
            ))}
          </div>
        </div>

        <DialogFooter className="items-center gap-2 sm:space-x-0">
          <span className="mr-auto text-xs text-gray-400">
            {selectedIds.length} de {sections.length} seções selecionadas
          </span>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#243871" }}
          >
            <Printer aria-hidden="true" size={12} />
            Imprimir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
