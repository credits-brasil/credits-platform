import { useState } from "react";
import { Search } from "lucide-react";

export default function SpcMaxiPage() {
  const [documento, setDocumento] = useState("");

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
      <div className="w-full lg:max-w-5xl xl:max-w-6xl">
        <form
          onSubmit={handleConsultar}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label
                htmlFor="documento"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Documento
              </label>
              <input
                id="documento"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="CPF ou CNPJ"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: "#243871" }}
            >
              <Search size={15} />
              Consultar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
