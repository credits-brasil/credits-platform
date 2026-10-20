import { useRef, useState, type ButtonHTMLAttributes } from "react";
import { Printer } from "lucide-react";

import {
  PrintSectionsDialog,
  type PrintSection,
} from "@/components/PrintSectionsDialog";
import { cn } from "@/lib/utils";

type PrintButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  label?: string;
  onBeforePrint?: () => void;
  /** Sections the user can choose before printing; without them the whole page is printed. */
  sections?: PrintSection[];
};

const PRINT_EXCLUDED_ATTRIBUTE = "data-print-excluded";

function printWithoutSections(excludedIds: string[]) {
  // Clear leftovers in case a previous `afterprint` never fired.
  document
    .querySelectorAll(`[${PRINT_EXCLUDED_ATTRIBUTE}]`)
    .forEach((element) => element.removeAttribute(PRINT_EXCLUDED_ATTRIBUTE));

  const excludedElements = excludedIds
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);

  excludedElements.forEach((element) =>
    element.setAttribute(PRINT_EXCLUDED_ATTRIBUTE, ""),
  );

  window.addEventListener(
    "afterprint",
    () =>
      excludedElements.forEach((element) =>
        element.removeAttribute(PRINT_EXCLUDED_ATTRIBUTE),
      ),
    { once: true },
  );

  window.print();
}

export function PrintButton({
  className,
  label = "Imprimir relatório",
  onBeforePrint,
  sections,
  ...props
}: PrintButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableSections, setAvailableSections] = useState<PrintSection[]>(
    [],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const shouldPrintOnCloseRef = useRef(false);

  const print = (excludedIds: string[] = []) => {
    onBeforePrint?.();
    printWithoutSections(excludedIds);
  };

  const handlePrint = () => {
    // Some sections return null without data, so only offer the rendered ones.
    const renderedSections =
      sections?.filter(({ id }) => document.getElementById(id) !== null) ?? [];

    if (renderedSections.length === 0) {
      print();
      return;
    }

    setAvailableSections(renderedSections);
    setSelectedIds(renderedSections.map(({ id }) => id));
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    shouldPrintOnCloseRef.current = true;
    setIsDialogOpen(false);
  };

  // Wait for the dialog to unmount so its overlay is not captured by the print.
  const handleDialogClosed = () => {
    if (!shouldPrintOnCloseRef.current) return;

    shouldPrintOnCloseRef.current = false;
    print(
      availableSections
        .filter(({ id }) => !selectedIds.includes(id))
        .map(({ id }) => id),
    );
  };

  return (
    <>
      <button
        {...props}
        type="button"
        onClick={handlePrint}
        title={label}
        aria-label={label}
        data-print-hidden
        className={cn(
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700",
          className,
        )}
      >
        <Printer aria-hidden="true" size={14} />
      </button>

      {sections && (
        <PrintSectionsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          sections={availableSections}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onConfirm={handleConfirm}
          onClosed={handleDialogClosed}
        />
      )}
    </>
  );
}
