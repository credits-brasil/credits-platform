import { useState } from "react";
import { Search } from "lucide-react";

type DocType = "cpf" | "cnpj";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export default function SpcMaxiPage() {
  const [docType, setDocType] = useState<DocType>("cpf");
  const [documento, setDocumento] = useState("");

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setDocumento("");
  };

  const handleDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDocumento(docType === "cpf" ? formatCpf(raw) : formatCnpj(raw));
  };

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">SPC MAXI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta completa de crédito e risco para pessoas físicas. Detalhes a definir.
        </p>
      </div>

      {/* Query block */}
      <form onSubmit={handleConsultar} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <p className="text-sm font-medium text-gray-700 mb-2">Documento</p>

        {/* Single row: toggle | input | button */}
        <div className="flex items-center gap-2">

          {/* CPF / CNPJ toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 flex-shrink-0">
            {(["cpf", "cnpj"] as DocType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDocTypeChange(type)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: docType === type ? "#243871" : "transparent",
                  color: docType === type ? "white" : "#6b7280",
                }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Input */}
          <input
            type="text"
            value={documento}
            onChange={handleDocumento}
            placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            className="w-56 rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* Consultar */}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: "#243871" }}
          >
            <Search size={14} />
            Consultar
          </button>

        </div>
      </form>
    </div>
  );
}
