import { User, Printer, Search } from "lucide-react";

export default function SpcMaxiResultadoPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Relatório SPC MAXI</h1>
      </div>

      {/* Protocolo */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span><span className="text-gray-500 font-medium">Protocolo:</span> 2026060900042</span>
          <span className="text-gray-200">|</span>
          <span><span className="text-gray-500 font-medium">Data/Hora:</span> 09/06/2026 às 14:32</span>
          <span className="text-gray-200">|</span>
          <span><span className="text-gray-500 font-medium">Operador:</span> Leonardo Lima</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <Printer size={14} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: "#243871" }}
          >
            <Search size={12} />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Identificação do Consumidor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#EAECF0" }}
          >
            <User size={18} style={{ color: "#243871" }} strokeWidth={1.5} />
          </div>

          {/* Col 1: documento + nome */}
          <div className="flex flex-col gap-0.5 min-w-0 basis-[25%] flex-shrink-0">
            <span className="text-xs text-gray-400">CPF: 529.982.247-25</span>
            <span className="text-sm font-semibold text-gray-800 truncate">Maria Helena Santos da Silva</span>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Col 2: status + complementar */}
          <div className="flex flex-col gap-1.5 flex-1">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
              style={{ backgroundColor: "#DCFCE7", color: "#15803D" }}
            >
              Regular
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap">41 anos · Feminino · São Paulo/SP</span>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Col 3: risco */}
          <div className="flex flex-col gap-1.5 basis-[44%] flex-shrink-0">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
              style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
            >
              Risco Médio
            </span>
            <span className="text-xs text-gray-400">Perfil com histórico de atrasos pontuais, sem restrições ativas.</span>
          </div>
        </div>
      </div>
      {/* Score & Capacidade */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Score &amp; Capacidade</h2>
        <div className="flex gap-6">

          {/* Left: Gauge */}
          <div className="flex flex-col items-center gap-3 basis-[50%]">
            {/* Circular gauge */}
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg viewBox="0 0 120 120" width="140" height="140">
                {/* Track */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="9"
                  strokeDasharray="235.62 78.54"
                  strokeLinecap="round"
                  transform="rotate(135 60 60)"
                />
                {/* Fill — 642/1000 = 64.2% of 235.62 = 151.27 */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#ED884A"
                  strokeWidth="9"
                  strokeDasharray="151.27 163"
                  strokeLinecap="round"
                  transform="rotate(135 60 60)"
                />
              </svg>
              {/* Center label */}
              <div className="absolute flex flex-col items-center leading-none">
                <span className="text-3xl font-bold" style={{ color: "#ED884A" }}>642</span>
              </div>
            </div>

            <span className="text-xs text-gray-400 -mt-2">de 1000</span>

            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
            >
              Risco Médio
            </span>

            <p className="text-xs text-gray-500">
              Inadimplência: <span className="font-semibold text-gray-700">18.5%</span>
            </p>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Right: placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-gray-300">— em breve —</span>
          </div>

        </div>
      </div>
    </div>
  );
}
