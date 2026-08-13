import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DocTypeToggleComponent,
  FilterCheckboxComponent,
  InputComponent,
} from "@/components";
import { InsumoGroupCard } from "@/containers/SpcMaxi/components/InsumoGroupCard";
import {
  CNPJ_INSUMO_GROUPS,
  CPF_INSUMO_GROUPS,
} from "@/constants/insumo-groups";
import type { DocType } from "@/types/docType";
import {
  detectDocTypeByInput,
  formatCnpj,
  formatCpf,
  formatPhone,
  validateCNPJ,
  validateCPF,
} from "@/utils";

const DEFAULT_SELECTED = new Set<string>([]);

export default function SpcMaxiPage() {
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState<DocType>("CPF");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [touched, setTouched] = useState(false);
  const [touchedTelefone, setTouchedTelefone] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED),
  );

  const insumoGroups = useMemo(
    () => (docType === "CPF" ? CPF_INSUMO_GROUPS : CNPJ_INSUMO_GROUPS),
    [docType],
  );

  const allSelectableIds = useMemo(
    () => insumoGroups.flatMap((group) => group.items.map((item) => item.id)),
    [insumoGroups],
  );

  const isAllSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selected.has(id));

  const rawClean =
    docType === "CPF"
      ? documento.replace(/\D/g, "")
      : documento.replace(/[^a-zA-Z0-9]/g, "");
  const telefoneClean = telefone.replace(/\D/g, "");
  const shouldRequireTelefone = docType === "CPF" && selected.has("5268");
  const isComplete =
    docType === "CPF" ? rawClean.length === 11 : rawClean.length === 14;
  const isValid = useMemo(() => {
    if (!isComplete) return null;
    return docType === "CPF" ? validateCPF(documento) : validateCNPJ(documento);
  }, [documento, docType, isComplete]);
  const isTelefoneComplete =
    !shouldRequireTelefone || telefoneClean.length === 11;
  const showTelefoneError =
    shouldRequireTelefone && touchedTelefone && !isTelefoneComplete;
  const showTelefoneSuccess = shouldRequireTelefone && isTelefoneComplete;

  const showError = touched && isComplete && isValid === false;
  const showSuccess = isComplete && isValid === true;
  const canSubmit = showSuccess && isTelefoneComplete;

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setDocumento((prev) =>
      type === "CPF" ? formatCpf(prev, "input") : formatCnpj(prev, "input"),
    );

    if (type === "CNPJ") {
      setTelefone("");
      setTouchedTelefone(false);
    }
  };

  const handleDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const detectedType = detectDocTypeByInput(raw);

    setDocType(detectedType);
    setDocumento(
      detectedType === "CPF"
        ? formatCpf(raw, "input")
        : formatCnpj(raw, "input"),
    );

    if (detectedType === "CNPJ") {
      setTelefone("");
      setTouchedTelefone(false);
    }

    if (!touched) setTouched(true);
  };

  const handleTelefone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
    if (!touchedTelefone) setTouchedTelefone(true);
  };

  const toggleInsumo = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFilters = () => {
    setSelected(new Set(allSelectableIds));
  };

  const handleClearAllFilters = () => {
    setSelected(new Set());
  };

  const [, navigate] = useLocation();

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      queryClient.setQueryData(["spc-maxi-request"], {
        document: rawClean,
        typeDocument: docType,
        telefone: shouldRequireTelefone ? telefoneClean : undefined,
        insumos: Array.from(selected),
      });

      navigate("/verticais/credito-risco/spc-maxi/resultado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">SPC MAXI</h1>

        <p className="mt-1 text-sm text-gray-500">
          Consulta completa de crédito e risco para pessoas físicas. Detalhes a
          definir.
        </p>
      </div>

      <form
        onSubmit={handleConsultar}
        className="bg-white rounded-xl border border-gray-200 p-5 mb-6"
      >
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 basis-1/2">
            <p className="text-sm font-medium text-gray-700 mb-2">Documento</p>

            <div className="flex flex-wrap items-center gap-2">
              <DocTypeToggleComponent
                value={docType}
                disabled={loading}
                onChange={handleDocTypeChange}
              />

              <InputComponent
                value={documento}
                onChange={handleDocumento}
                onBlur={() => setTouched(true)}
                placeholder={
                  docType === "CPF" ? "000.000.000-00" : "AB.CDE.FGH/0001-00"
                }
                autoComplete="on"
                disabled={loading}
                showError={showError}
                showSuccess={showSuccess}
              />

              {shouldRequireTelefone && (
                <InputComponent
                  value={telefone}
                  onChange={handleTelefone}
                  onBlur={() => setTouchedTelefone(true)}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  disabled={loading}
                  required
                  showError={showTelefoneError}
                  showSuccess={showTelefoneSuccess}
                />
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition whitespace-nowrap"
                style={{
                  backgroundColor: canSubmit ? "#243871" : "#9ca3af",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  opacity: canSubmit ? 1 : 0.7,
                }}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Consultar
                  </>
                )}
              </button>
            </div>

            {showError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} />
                {docType === "CPF"
                  ? "CPF inválido. Verifique os dígitos informados."
                  : "CNPJ inválido. Verifique os dígitos informados."}
              </p>
            )}
          </div>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Insumos Opcionais
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <FilterCheckboxComponent
            checked={isAllSelected}
            onChange={() => {
              if (isAllSelected) {
                handleClearAllFilters();
              } else {
                handleSelectAllFilters();
              }
            }}
            label="Selecionar todos"
            labelFirst
            className="px-3 py-1.5"
          />

          <span className="px-3 py-1 text-xs font-semibold text-gray-600">
            {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insumoGroups.map((group) => {
          return (
            <InsumoGroupCard
              key={group.id}
              group={group}
              selected={selected}
              onToggleInsumo={toggleInsumo}
            />
          );
        })}
      </div>
    </div>
  );
}
