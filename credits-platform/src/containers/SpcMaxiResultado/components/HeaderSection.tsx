import { RefreshCw, Search, User } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { CopyButton } from "@/components/ui/copy-button";
import { useStickyIdentification } from "@/hooks/useStickyIdentification";

type HeaderSectionProps = {
  productName?: string;
  protocol: string;
  dateTime: string;
  operator: string;
  documentLabel: string;
  documentCopyValue: string;
  consumerName: string;
  consumerNameCopyValue: string;
  documentTypeLabel: "CPF" | "CNPJ";
  situacao: string;
  isRegular: boolean;
  isPendenteRegularizacao: boolean;
  metadataText: string;
  onReload: () => void;
  onNewQuery: () => void;
};

export function HeaderSection({
  productName = "SPC MAXI",
  protocol,
  dateTime,
  operator,
  documentLabel,
  documentCopyValue,
  consumerName,
  consumerNameCopyValue,
  documentTypeLabel,
  situacao,
  isRegular,
  isPendenteRegularizacao,
  metadataText,
  onReload,
  onNewQuery,
}: HeaderSectionProps) {
  const { isIdentificationFixed, registerIdentificationAnchor } =
    useStickyIdentification();

  return (
    <div className="bg-background pb-2 print:break-inside-avoid">
      <div
        className={
          isIdentificationFixed ? "invisible mb-6 print:visible" : "mb-6"
        }
      >
        <h1 className="text-xl font-semibold text-gray-800">
          Relatório {productName}
        </h1>
      </div>

      <div
        className={
          isIdentificationFixed
            ? "invisible flex items-center justify-between mb-3 px-1 print:visible"
            : "flex items-center justify-between mb-3 px-1"
        }
      >
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {protocol && (
            <>
              <span className="flex items-center">
                <span className="text-gray-500 font-medium mr-1">
                  Protocolo:
                </span>

                <div className="flex items-center gap-2">
                  {protocol}
                  <CopyButton value={protocol} title="Copiar Protocolo" />
                </div>
              </span>
              <span className="text-gray-200">|</span>
            </>
          )}

          <span>
            <span className="text-gray-500 font-medium">Data/Hora:</span>{" "}
            {dateTime}
          </span>

          {operator && (
            <>
              <span className="text-gray-200">|</span>

              <span>
                <span className="text-gray-500 font-medium">Operador:</span>{" "}
                {operator}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2" data-print-hidden>
          <PrintButton />

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#243871" }}
            onClick={onNewQuery}
          >
            <Search size={12} />
            Nova Consulta
          </button>
        </div>
      </div>

      <div ref={registerIdentificationAnchor} aria-hidden="true" />
      <div
        className={
          isIdentificationFixed
            ? "h-19.5 mb-4 print:h-auto print:mb-0"
            : undefined
        }
      >
        <div
          id="section-identificacao"
          className={`bg-white border border-gray-200 print:static print:rounded-xl print:shadow-none ${
            isIdentificationFixed
              ? "fixed top-0 right-0 left-(--layout-sidebar-width) z-50 rounded-none px-5 py-3 shadow-md"
              : "rounded-xl p-5 mb-4"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#EAECF0" }}
            >
              <User size={18} style={{ color: "#243871" }} strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-0.5 min-w-0 basis-[25%] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{documentLabel}</span>

                <CopyButton
                  value={documentCopyValue}
                  title={
                    documentTypeLabel === "CPF" ? "Copiar CPF" : "Copiar CNPJ"
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">
                  {consumerName}
                </span>

                <CopyButton
                  value={consumerNameCopyValue}
                  title={
                    documentTypeLabel === "CPF"
                      ? "Copiar Nome"
                      : "Copiar Razão Social"
                  }
                />
              </div>
            </div>

            <div className="w-px self-stretch bg-gray-100" />

            <div className="flex flex-col gap-1.5 flex-1">
              {situacao && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                  style={{
                    backgroundColor: isRegular
                      ? "#DCFCE7"
                      : isPendenteRegularizacao
                        ? "#FEF3C7"
                        : "#FEE2E2",
                    color: isRegular
                      ? "#15803D"
                      : isPendenteRegularizacao
                        ? "#D97706"
                        : "#DC2626",
                  }}
                >
                  {situacao}
                </span>
              )}

              {metadataText && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {metadataText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
