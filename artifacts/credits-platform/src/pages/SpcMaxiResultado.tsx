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

          {/* Left: Gauge + info */}
          <div className="flex items-center justify-center gap-5 w-1/2">
            {/* Circular gauge */}
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 140, height: 140 }}>
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
                <span className="text-[10px] text-gray-400 mt-1">de 1000</span>
              </div>
            </div>

            {/* Info ao lado do gauge */}
            <div className="flex flex-col gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
              >
                Risco Médio
              </span>
              <p className="text-xs text-gray-500">
                Inadimplência: <span className="font-semibold text-gray-700">18.5%</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Right: Resumo Financeiro */}
          <div className="w-1/2 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 mb-1">Resumo Financeiro</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Renda Presumida", value: "R$ 4.200" },
                { label: "Limite Sugerido", value: null },
                { label: "Comprometimento", value: "42%" },
                { label: "Valor SCR", value: "R$ 3.800" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
                  {value !== null ? (
                    <span className="text-base font-bold text-gray-800">{value}</span>
                  ) : (
                    <button
                      type="button"
                      className="self-start rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors"
                      style={{ backgroundColor: "#C7D2FE", color: "#243871" }}
                    >
                      Consultar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Divisor */}
        <div className="border-t border-gray-100 my-4" />

        {/* Comportamento Financeiro */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-4">Comportamento Financeiro</p>
          <div className="grid grid-cols-3 gap-10 pb-5">

            {/* Col 1: Pontualidade de Pagamento */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">Pontualidade de Pagamento</span>
              {/* Progress bar */}
              <div className="relative">
                {/* Track */}
                <div className="h-3 w-full rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                  {/* Fill */}
                  <div
                    className="h-3 rounded-full"
                    style={{ width: "93%", backgroundColor: "#7EC8E3" }}
                  />
                </div>
                {/* Dashed indicator + label */}
                <div className="absolute top-0 flex flex-col items-center" style={{ left: "93%" }}>
                  <div
                    className="mt-3.5"
                    style={{
                      borderLeft: "1.5px dashed #7EC8E3",
                      height: "14px",
                    }}
                  />
                  <span className="text-[11px] font-semibold mt-0.5" style={{ color: "#7EC8E3" }}>
                    93%
                  </span>
                </div>
              </div>
            </div>

            {/* Col 2: Comprometimento de Gastos */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">Comprometimento de Gastos</span>
              <div className="relative">
                <div className="h-3 w-full rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                  <div
                    className="h-3 rounded-full"
                    style={{ width: "72%", backgroundColor: "#5B8DB8" }}
                  />
                </div>
                <div className="absolute top-0 flex flex-col items-center" style={{ left: "72%" }}>
                  <div className="mt-3.5" style={{ borderLeft: "1.5px dashed #5B8DB8", height: "14px" }} />
                  <span className="text-[11px] font-semibold mt-0.5" style={{ color: "#5B8DB8" }}>72%</span>
                </div>
              </div>
            </div>

            {/* Col 3: placeholder */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">—</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
