import type { ButtonHTMLAttributes } from "react";
import { Printer } from "lucide-react";

import { cn } from "@/lib/utils";

type PrintButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  label?: string;
  onBeforePrint?: () => void;
};

export function PrintButton({
  className,
  label = "Imprimir relatório",
  onBeforePrint,
  ...props
}: PrintButtonProps) {
  const handlePrint = () => {
    onBeforePrint?.();
    window.print();
  };

  return (
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
  );
}
