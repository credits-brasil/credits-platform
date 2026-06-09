import { useState } from "react";
import { User, Printer, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

type SortKey = "inclusao" | "vencimento" | "valor" | "credor" | "cidade" | "origem" | "fonte";
type SortDir = "asc" | "desc";

function parseBRDate(s: string): number {
  if (!s || s === "–") return 0;
  const [d, m, y] = s.split("/");
  return new Date(`${y}-${m}-${d}`).getTime();
}

function parseBRValue(s: string): number {
  if (!s || s === "–") return -Infinity;
  return parseFloat(s.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
}

const ALL_RECORDS = [
  { inclusao: "15/08/2025", vencimento: "10/06/2025", valor: "R$ 3.450,00", credor: "Magazine Luiza S/A",           cidade: "São Paulo/SP", origem: "CDL SP",   fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "20/07/2025", vencimento: "20/07/2025", valor: "R$ 2.890,00", credor: "Banco Itaú",                  cidade: "São Paulo/SP", origem: "São Paulo", fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "12/06/2025", vencimento: "12/06/2025", valor: "R$ 4.200,00", credor: "3° Tabelionato de Protestos", cidade: "São Paulo/SP", origem: "Protesto",  fonte: "Protesto",     grupo: "PROTESTOS"    },
  { inclusao: "22/05/2025", vencimento: "01/04/2025", valor: "R$ 1.280,50", credor: "Casas Bahia",                 cidade: "São Paulo/SP", origem: "São Paulo", fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "05/03/2025", vencimento: "05/03/2025", valor: "R$ 7.500,00", credor: "Banco Santander",             cidade: "São Paulo/SP", origem: "São Paulo", fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "15/02/2025", vencimento: "15/02/2025", valor: "R$ 2.100,00", credor: "Claro S/A",                   cidade: "São Paulo/SP", origem: "São Paulo", fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "28/01/2025", vencimento: "28/01/2025", valor: "R$ 1.850,00", credor: "3° Tabelionato de Protestos", cidade: "São Paulo/SP", origem: "Protesto",  fonte: "Protesto",     grupo: "PROTESTOS"    },
  { inclusao: "05/11/2025", vencimento: "–",          valor: "–",           credor: "Tim S/A",                     cidade: "São Paulo/SP", origem: "São Paulo", fonte: "CCF",          grupo: "CCF"          },
  { inclusao: "10/01/2026", vencimento: "–",          valor: "–",           credor: "Vivo S/A",                    cidade: "São Paulo/SP", origem: "São Paulo", fonte: "CCF",          grupo: "CCF"          },
  { inclusao: "10/09/2024", vencimento: "03/09/2024", valor: "R$ 9.960,00", credor: "Banco Bradesco",              cidade: "São Paulo/SP", origem: "CDL SP",   fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
  { inclusao: "03/09/2024", vencimento: "03/09/2024", valor: "R$ 7.000,00", credor: "Banco do Brasil",             cidade: "São Paulo/SP", origem: "São Paulo", fonte: "SPC + Serasa", grupo: "SPC + SERASA" },
];

const GROUPS = [
  { key: "TODOS",       label: "TODOS",        count: 11, valor: "R$ 40.130,50", antiga: "03/09/2024", recente: "10/01/2026" },
  { key: "SPC + SERASA", label: "SPC + SERASA", count: 7,  valor: "R$ 34.080,50", antiga: "03/09/2024", recente: "15/08/2025" },
  { key: "PROTESTOS",  label: "PROTESTOS",    count: 2,  valor: "R$ 6.050,00",  antiga: "28/01/2025", recente: "12/06/2025" },
  { key: "CCF",        label: "CCF",          count: 2,  valor: "–",            antiga: "05/11/2025", recente: "10/01/2026" },
];

function FonteBadge({ fonte }: { fonte: string }) {
  if (fonte === "Protesto")
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>{fonte}</span>;
  if (fonte === "CCF")
    return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}>{fonte}</span>;
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{fonte}</span>;
}

export default function SpcMaxiResultadoPage() {
  const [activeGroup, setActiveGroup] = useState("TODOS");
  const [expanded, setExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [singleDate, setSingleDate] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const base = activeGroup === "TODOS" ? ALL_RECORDS : ALL_RECORDS.filter(r => r.grupo === activeGroup);
  const filtered = sortKey ? [...base].sort((a, b) => {
    let va: string | number = a[sortKey];
    let vb: string | number = b[sortKey];
    if (sortKey === "inclusao" || sortKey === "vencimento") {
      va = parseBRDate(a[sortKey]); vb = parseBRDate(b[sortKey]);
    } else if (sortKey === "valor") {
      va = parseBRValue(a[sortKey]); vb = parseBRValue(b[sortKey]);
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  }) : base;

  const PAGE = 5;
  const visible = expanded ? filtered : filtered.slice(0, PAGE);
  const remaining = filtered.length - PAGE;

  const chartData = (() => {
    const rows = [...ALL_RECORDS]
      .filter(r => r.vencimento !== "–" && r.valor !== "–")
      .sort((a, b) => parseBRDate(a.vencimento) - parseBRDate(b.vencimento))
      .map(r => ({ data: r.vencimento, valor: parseBRValue(r.valor) }));
    const capped = singleDate ? rows.slice(0, 1) : rows;
    let acc = 0;
    return capped.map(r => { acc += r.valor; return { ...r, acumulado: acc }; });
  })();

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
          <div className="grid grid-cols-3 gap-16 pb-1">

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
                <span className="absolute right-0 text-[11px] font-semibold text-gray-700 mt-1">93%</span>
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
                <span className="absolute right-0 text-[11px] font-semibold text-gray-700 mt-1">72%</span>
              </div>
            </div>

            {/* Col 3: SCR */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">SCR</span>
              <div className="grid gap-3" style={{ gridTemplateColumns: "40% 60%" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Operações</span>
                  <span className="text-base font-bold text-gray-800">4</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Contratado</span>
                  <span className="text-base font-bold text-gray-800">R$ 45.000,00</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
      {/* Negativos Consolidados */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Negativos Consolidados</h2>
        </div>

        {/* Group cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {GROUPS.map(g => {
            const isActive = activeGroup === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => { setActiveGroup(g.key); setExpanded(false); }}
                className="text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: isActive ? "#ED884A" : "#E5E7EB",
                  backgroundColor: isActive ? "#FFFBF7" : "#fff",
                }}
              >
                <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-2">{g.label}</p>
                <hr className="border-gray-200 mb-2" />
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold" style={{ color: isActive ? "#ED884A" : "#1F2937" }}>{g.count}</span>
                  <span className="text-lg font-semibold" style={{ color: isActive ? "#ED884A" : "#374151" }}>{g.valor}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Antiga</p>
                    <p className="text-xs font-medium text-gray-600">{g.antiga}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Recente</p>
                    <p className="text-xs font-medium text-gray-600">{g.recente}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Table summary bar */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-10 mb-3 pb-3 border-b border-gray-100">
          <span>Total: <span className="font-semibold text-gray-800">{filtered.length} registros</span></span>
          <span className="text-gray-300">|</span>
          <span>Valor: <span className="font-semibold" style={{ color: "#ED884A" }}>R$ 40.130,50</span></span>
          <span className="text-gray-300">|</span>
          <span>Mais antiga: <span className="font-semibold text-gray-700">03/09/2024</span></span>
          <span className="text-gray-300">|</span>
          <span>Mais recente: <span className="font-semibold text-gray-700">15/08/2025</span></span>
        </div>

        {/* Table */}
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "104px" }} />
            <col />
            <col style={{ width: "112px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "116px" }} />
            <col style={{ width: "28px" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100">
              {([ 
                { label: "Inclusão",   key: "inclusao"   },
                { label: "Vencimento", key: "vencimento" },
                { label: "Valor",      key: "valor"      },
                { label: "Credor",     key: "credor"     },
                { label: "Cidade",     key: "cidade"     },
                { label: "Origem",     key: "origem"     },
                { label: "Fonte",      key: "fonte"      },
                { label: "",           key: null         },
              ] as { label: string; key: SortKey | null }[]).map(({ label, key }) => (
                <th key={label} className="text-left pb-2 pr-4 last:pr-0">
                  {key ? (
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-colors"
                      style={{ color: sortKey === key ? "#243871" : "#9CA3AF" }}
                    >
                      {label}
                      {sortKey === key
                        ? sortDir === "asc"
                          ? <ArrowUp size={10} />
                          : <ArrowDown size={10} />
                        : <ArrowUpDown size={10} className="text-gray-300" />}
                    </button>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{r.inclusao}</td>
                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{r.vencimento}</td>
                <td className="py-2.5 pr-4 text-gray-800 font-medium whitespace-nowrap">{r.valor}</td>
                <td className="py-2.5 pr-4 text-gray-700">{r.credor}</td>
                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{r.cidade}</td>
                <td className="py-2.5 pr-4 text-gray-600">{r.origem}</td>
                <td className="py-2.5 pr-4"><FonteBadge fonte={r.fonte} /></td>
                <td className="py-2.5">
                  <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Expand / collapse */}
        {!expanded && remaining > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-xs font-medium transition-colors"
            style={{ color: "#243871" }}
          >
            Exibir mais {remaining} {remaining === 1 ? "registro" : "registros"}...
          </button>
        )}
        {expanded && filtered.length > PAGE && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-3 text-xs font-medium transition-colors"
            style={{ color: "#243871" }}
          >
            Recolher
          </button>
        )}

        {/* Debt trend chart */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Variação de Endividamento</p>
            <button
              type="button"
              onClick={() => setSingleDate(v => !v)}
              className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors"
              style={{
                borderColor: singleDate ? "#ED884A" : "#E5E7EB",
                backgroundColor: singleDate ? "#FFFBF7" : "#F9FAFB",
                color: singleDate ? "#ED884A" : "#6B7280",
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: singleDate ? "#ED884A" : "#D1D5DB" }}
              />
              {singleDate ? "1 data (simulando)" : "Todas as datas"}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 88, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                }
                width={80}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "#243871" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                }
                width={88}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  name === "acumulado" ? "Acumulado" : "Valor",
                ]}
                labelStyle={{ fontSize: 11, color: "#374151" }}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                cursor={{ fill: "#F9FAFB" }}
              />
              <Bar yAxisId="left" dataKey="valor" fill="#ED884A" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                stroke="#243871"
                strokeWidth={2}
                dot={{ r: 3, fill: "#243871", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
