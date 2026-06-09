import { UserCircle } from "lucide-react";

export default function SpcMaxiResultadoPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Relatório SPC MAXI</h1>
      </div>

      {/* Identificação do Consumidor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            <UserCircle size={28} style={{ color: "#243871" }} />
          </div>

          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-gray-800">
              Maria Helena Santos da Silva
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">CPF: 529.982.247-25</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "#DCFCE7", color: "#15803D" }}
              >
                REGULAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
