import { User } from "lucide-react";

export default function SpcMaxiResultadoPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Relatório SPC MAXI</h1>
      </div>

      {/* Identificação do Consumidor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#EAECF0" }}
          >
            <User size={18} style={{ color: "#243871" }} strokeWidth={1.5} />
          </div>

          {/* Col 1: documento + nome */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-xs text-gray-400">CPF: 529.982.247-25</span>
            <span className="text-sm font-semibold text-gray-800 truncate">Maria Helena Santos da Silva</span>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Col 2: status + complementar */}
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Status:</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "#DCFCE7", color: "#15803D" }}
              >
                REGULAR
              </span>
            </div>
            <span className="text-xs text-gray-400">41 anos · Feminino · São Paulo/SP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
