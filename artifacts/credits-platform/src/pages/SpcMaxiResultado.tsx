import { useState } from "react";
import { User, Printer, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, ShieldAlert, BarChart2, AlertTriangle, ClipboardList } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  const [consultasExpanded, setConsultasExpanded] = useState(false);

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
      <div id="section-identificacao" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
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
      <div id="section-score" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
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
      <div id="section-negativos" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
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
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                }
                width={80}
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
              <Bar dataKey="valor" fill="#ED884A" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Line
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

      {/* Alertas */}
      <div id="section-alertas" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Alertas</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              severidade: "medio",
              titulo: "Documento com divergência cadastral",
              descricao: "RG informado diverge da base da Receita Federal.",
              data: "10/01/2026",
              fonte: "Receita Federal",
              tipo: "RG",
            },
            {
              severidade: "alto",
              titulo: "Alto volume de consultas recentes",
              descricao: "14 consultas nos últimos 30 dias — possível busca intensiva por crédito.",
              data: "05/11/2025",
              fonte: "SPC Brasil",
              tipo: "CPF",
            },
            {
              severidade: "baixo",
              titulo: "Endereço desatualizado",
              descricao: "Endereço cadastral difere do informado em consultas anteriores.",
              data: "03/09/2024",
              fonte: "CDL SP",
              tipo: "Endereço",
            },
            {
              severidade: "alto",
              titulo: "CPF com restrição administrativa",
              descricao: "CPF consta em lista de restrição da Receita Federal.",
              data: "28/01/2025",
              fonte: "Receita Federal",
              tipo: "CPF",
            },
          ].map((a, i) => {
            const cfg =
              a.severidade === "alto"
                ? { bg: "#FEF2F2", border: "#FECACA", icon: "#DC2626", badge: { bg: "#FEE2E2", color: "#DC2626" } }
                : a.severidade === "medio"
                ? { bg: "#FFFBEB", border: "#FDE68A", icon: "#D97706", badge: { bg: "#FEF3C7", color: "#D97706" } }
                : { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A", badge: { bg: "#DCFCE7", color: "#16A34A" } };
            return (
              <div
                key={i}
                className="rounded-xl border p-4"
                style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} style={{ color: cfg.icon, flexShrink: 0, marginTop: 1 }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-800">{a.titulo}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap"
                        style={{ backgroundColor: cfg.badge.bg, color: cfg.badge.color }}
                      >
                        {a.severidade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{a.descricao}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{a.data}</span>
                      <span>{a.fonte}</span>
                      <span>{a.tipo}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dados Cadastrais */}
      <div id="section-cadastrais" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Dados Cadastrais</h2>
        <Accordion type="multiple" className="w-full">

          {/* Dados Pessoais */}
          <AccordionItem value="dados-pessoais" className="border-gray-100">
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Dados Pessoais
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  { label: "Nome completo",      value: "Maria Helena Santos da Silva" },
                  { label: "CPF",                value: "529.982.247-25" },
                  { label: "Data de nascimento", value: "12/03/1985" },
                  { label: "Sexo",               value: "Feminino" },
                  { label: "Nacionalidade",      value: "Brasileira" },
                  { label: "Nome da mãe",        value: "Ana Lúcia Santos" },
                  { label: "Nome do pai",        value: "José Carlos da Silva" },
                  { label: "RG",                 value: "12.345.678-9 SSP/SP" },
                  { label: "Estado civil",       value: "Casada" },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contato e Endereço */}
          <AccordionItem value="contato-endereco" className="border-gray-100 last:border-b-0">
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Contato e Endereço
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  { label: "Telefone principal", value: "(11) 98765-4321" },
                  { label: "Telefone secundário", value: "(11) 3456-7890" },
                  { label: "E-mail",             value: "maria.helena@email.com" },
                  { label: "CEP",                value: "01310-100" },
                  { label: "Logradouro",         value: "Av. Paulista, 1234 — Apto 52" },
                  { label: "Bairro",             value: "Bela Vista" },
                  { label: "Cidade",             value: "São Paulo" },
                  { label: "Estado",             value: "SP" },
                  { label: "País",               value: "Brasil" },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* Consultas Realizadas */}
      {(() => {
        const consultasMes = [
          { mes: "12/2025", total: 1 },
          { mes: "01/2026", total: 9 },
          { mes: "02/2026", total: 15 },
          { mes: "03/2026", total: 12 },
        ];
        const todasConsultas = [
          { data: "20/03/2026", associado: "SUPPLIERCAR",                 entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "20/03/2026", associado: "ZEUS DO BRASIL",              entidade: "SAO PAULO / SP", cidade: "BLUMENAU",  estado: "SC" },
          { data: "18/03/2026", associado: "SUPPLIERCAR",                 entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "14/03/2026", associado: "FEDERAL EXPRESS CORPORATI",   entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "13/03/2026", associado: "FEDERAL EXPRESS CORPORATI",   entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "10/03/2026", associado: "BANCO BRADESCO S/A",          entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "05/03/2026", associado: "ITAU UNIBANCO S/A",           entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "28/02/2026", associado: "MAGAZINE LUIZA S/A",          entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "20/02/2026", associado: "CLARO S/A",                   entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
          { data: "14/02/2026", associado: "SUPPLIERCAR",                 entidade: "SAO PAULO / SP", cidade: "SAO PAULO", estado: "SP" },
        ];
        const visibleConsultas = consultasExpanded ? todasConsultas : todasConsultas.slice(0, 5);
        return (
          <div id="section-consultas" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Consultas Realizadas</h2>

            {/* KPIs */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl mb-5 overflow-hidden">
              {[
                { valor: 12, label: "Mês atual" },
                { valor: 37, label: "Últimos 90 dias" },
                { valor: 37, label: "Total" },
              ].map(k => (
                <div key={k.label} className="flex flex-col items-center py-4">
                  <span className="text-2xl font-bold text-gray-800">{k.valor}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{k.label}</span>
                </div>
              ))}
            </div>

            {/* Line chart */}
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Evolução de Consultas por Mês</p>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={consultasMes} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  formatter={(v: number) => [v, "Consultas"]}
                  labelStyle={{ fontSize: 11, color: "#374151" }}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#243871"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#243871", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <table className="w-full text-xs table-fixed">
                <colgroup>
                  <col style={{ width: "96px" }} />
                  <col />
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "56px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Data", "Associado", "Nome da Entidade", "Cidade", "Estado"].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleConsultas.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{r.data}</td>
                      <td className="py-2.5 pr-4 text-gray-700 font-medium">{r.associado}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{r.entidade}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{r.cidade}</td>
                      <td className="py-2.5 text-gray-600">{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setConsultasExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: "#243871" }}
                >
                  {consultasExpanded ? "Recolher" : `Expandir`}
                  <span className="text-[10px]">{consultasExpanded ? "▲" : "▼"}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Floating section nav */}
      <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-2.5">
        {[
          { id: "section-identificacao", icon: <User size={16} />,          label: "Identificação"         },
          { id: "section-score",         icon: <BarChart2 size={16} />,      label: "Score & Capacidade"    },
          { id: "section-negativos",     icon: <AlertTriangle size={16} />,  label: "Negativos Consolidados"},
          { id: "section-alertas",       icon: <ShieldAlert size={16} />,    label: "Alertas"               },
          { id: "section-cadastrais",    icon: <ClipboardList size={16} />,  label: "Dados Cadastrais"      },
          { id: "section-consultas",     icon: <Search size={16} />,         label: "Consultas Realizadas"  },
        ].map(({ id, icon, label }) => (
          <div key={id} className="group flex items-center justify-end gap-2">
            {/* Tooltip label */}
            <span
              className="pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
              style={{ backgroundColor: "#243871" }}
            >
              {label}
            </span>
            {/* Circle button */}
            <button
              type="button"
              onClick={() =>
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "#ED884A" }}
              aria-label={label}
            >
              {icon}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
