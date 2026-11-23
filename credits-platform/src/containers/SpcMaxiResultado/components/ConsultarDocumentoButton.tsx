import { Search } from "lucide-react";
import type { DocumentoConsulta } from "./ConsultarDocumentoDialog";

/** PF or PJ comes from the document itself: 11 digits is a CPF, 14 a CNPJ. */
export function getTypeDocument(
  documento?: string,
): DocumentoConsulta["typeDocument"] | null {
  const digits = String(documento ?? "").replace(/\D/g, "");
  if (digits.length === 11) return "CPF";
  if (digits.length === 14) return "CNPJ";
  return null;
}

/** Magnifier that starts a new consultation for a person listed in the report. */
export function ConsultarDocumentoButton({
  documento,
  nome,
  onConsultarDocumento,
}: {
  documento?: unknown;
  nome?: string;
  onConsultarDocumento?: (consulta: DocumentoConsulta) => void;
}) {
  const value = documento ? String(documento) : undefined;
  const typeDocument = getTypeDocument(value);

  if (!onConsultarDocumento || !value || !typeDocument) return null;

  return (
    <button
      type="button"
      data-print-hidden
      onClick={() => onConsultarDocumento({ documento: value, nome, typeDocument })}
      className="text-primary hover:text-primary/80 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
      aria-label={`Consultar ${typeDocument} ${value}`}
      title={`Consultar ${typeDocument}`}
    >
      <Search size={13} />
    </button>
  );
}
