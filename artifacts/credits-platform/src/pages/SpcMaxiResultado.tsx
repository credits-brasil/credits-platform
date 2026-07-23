import { useState } from "react";
import { useLocation } from "wouter";
import {
  User,
  Printer,
  Search,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  BarChart2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

type SortKey =
  | "inclusao"
  | "vencimento"
  | "valor"
  | "credor"
  | "cidade"
  | "origem"
  | "fonte";
type SortDir = "asc" | "desc";

function parseBRDate(s: string): number {
  if (!s || s === "–") return 0;
  const [d, m, y] = s.split("/");
  return new Date(`${y}-${m}-${d}`).getTime();
}

function parseBRValue(s: string): number {
  if (!s || s === "–") return -Infinity;
  return parseFloat(
    s.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
}

function FonteBadge({ fonte }: { fonte: string }) {
  if (fonte === "PROTESTOS")
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: "#D97706", color: "#FFF" }}
      >
        {fonte}
      </span>
    );

  if (fonte === "SERASA")
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: "#E3006F", color: "#FFF" }}
      >
        {fonte}
      </span>
    );

  if (fonte === "CCF")
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: "#7C3AED", color: "#FFF" }}
      >
        {fonte}
      </span>
    );

  if (fonte === "SPC")
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: "#173FB9", color: "#FFF" }}
      >
        {fonte}
      </span>
    );
}

export default function SpcMaxiResultadoPage() {
  const { data: spcData } = useQuery({
    queryKey: ["spc-maxi"],
    queryFn: async () => {
      return null;
    },
    enabled: false,
  });

  console.log("SPC DATA:", spcData);

  const [, navigate] = useLocation();

  const [activeGroup, setActiveGroup] = useState("TODOS");
  const [expanded, setExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [singleDate, setSingleDate] = useState(false);
  const [consultasExpanded, setConsultasExpanded] = useState(false);

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const [year, month, day] = date.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const parseDate = (date?: string) => {
    if (!date) return null;
    return new Date(date);
  };

  const primeiraOcorrenciaSpc =
    Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0) <= 1
      ? spcData?.spc?.resumo?.["data-ultima-ocorrencia"]
      : spcData?.spc?.["detalhe-spc"]?.reduce((oldest, current) =>
          new Date(current["data-inclusao"]) < new Date(oldest["data-inclusao"])
            ? current
            : oldest,
        )?.["data-inclusao"];

  const antigas = [
    primeiraOcorrenciaSpc,
    spcData?.["pendencia-financeira"]?.["ocorrencia-mais-antiga-chequenet"],
    spcData?.protesto?.resumo?.["data-primeira-ocorrencia"],
  ].filter(Boolean) as string[];

  const recentes = [
    spcData?.spc?.resumo?.["data-ultima-ocorrencia"],
    spcData?.["pendencia-financeira"]?.["ocorrencia-mais-recente-chequenet"],
    spcData?.protesto?.resumo?.["data-ultima-ocorrencia"],
  ].filter(Boolean) as string[];

  const GROUPS = [
    {
      key: "TODOS",
      label: "TODOS",
      count:
        Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0) +
        Number(
          spcData?.["pendencia-financeira"]?.resumo?.["quantidade-total"] ?? 0,
        ) +
        Number(spcData?.protesto?.resumo?.["quantidade-total"] ?? 0),

      valor: `R$ ${(
        Number(spcData?.spc?.resumo?.["valor-total"] ?? 0) +
        Number(
          spcData?.["pendencia-financeira"]?.resumo?.["valor-total"] ?? 0,
        ) +
        Number(spcData?.protesto?.resumo?.["valor-total"] ?? 0)
      ).toFixed(2)}`,

      antiga: formatDate(
        antigas.sort(
          (a, b) => parseDate(a)!.getTime() - parseDate(b)!.getTime(),
        )[0],
      ),

      recente: formatDate(
        recentes.sort(
          (a, b) => parseDate(b)!.getTime() - parseDate(a)!.getTime(),
        )[0],
      ),
    },
    {
      key: "SPC",
      label: "SPC",
      count: spcData?.spc?.resumo?.["quantidade-total"],
      valor: `R$ ${spcData?.spc?.resumo?.["valor-total"]}`,
      antiga:
        Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0) <= 1
          ? formatDate(spcData?.spc?.resumo?.["data-ultima-ocorrencia"])
          : formatDate(
              spcData?.spc?.["detalhe-spc"]?.reduce((oldest, current) =>
                new Date(current["data-inclusao"]) <
                new Date(oldest["data-inclusao"])
                  ? current
                  : oldest,
              )?.["data-inclusao"],
            ),
      recente: formatDate(spcData?.spc?.resumo?.["data-ultima-ocorrencia"]),
    },
    {
      key: "SERASA",
      label: "SERASA",
      count: spcData?.["pendencia-financeira"]?.resumo?.["quantidade-total"],
      valor: `R$ ${spcData?.["pendencia-financeira"]?.resumo?.["valor-total"]}`,
      antiga: formatDate(
        spcData?.["pendencia-financeira"]?.["ocorrencia-mais-antiga-chequenet"],
      ),
      recente: formatDate(
        spcData?.["pendencia-financeira"]?.[
          "ocorrencia-mais-recente-chequenet"
        ],
      ),
    },
    {
      key: "PROTESTOS",
      label: "PROTESTOS",
      count: spcData?.protesto?.resumo?.["quantidade-total"],
      valor: `R$ ${spcData?.protesto?.resumo?.["valor-total"] ?? 0}`,
      antiga: formatDate(
        spcData?.protesto?.resumo?.["data-primeira-ocorrencia"],
      ),
      recente: formatDate(
        spcData?.protesto?.resumo?.["data-ultima-ocorrencia"],
      ),
    },
    {
      key: "CCF",
      label: "CCF",
      count: spcData?.ccf,
      valor: "–",
      antiga: "-",
      recente: "-",
    },
  ];

  const spcRecords =
    spcData?.spc?.["detalhe-spc"]?.map((item) => ({
      tipo: item["comprador-fiador-avalista"],
      inclusao: new Date(item["data-inclusao"]).toLocaleDateString("pt-BR"),
      vencimento: new Date(item["data-vencimento"]).toLocaleDateString("pt-BR"),
      valor: Number(item.valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      contrato: item.contrato,
      "comprador-fiador-avalista": item["comprador-fiador-avalista"],
      credor: item["nome-associado"],
      cidade: `${item["cidade-associado"]}/${item.estado}`,
      origem: item["nome-entidade"],
      telefone: item["telefone-associado"],
      fonte: "SPC",
      grupo: "SPC",
    })) ?? [];

  const serasaRecords =
    spcData?.["pendencia-financeira"]?.["detalhe-pendencia-financeira"]?.map(
      (item) => ({
        tipo: Boolean(item.avalista) ? "AVALISTA" : "COMPRADOR",
        inclusao: new Date(item["data-ocorrencia"]).toLocaleDateString("pt-BR"),
        vencimento: new Date(item["data-ocorrencia"]).toLocaleDateString(
          "pt-BR",
        ),
        valor: Number(item["valor-pendencia"]).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        contrato: item.contrato,
        credor: item.origem,
        cidade: `${item.cidade}/${item.estado}`,
        origem: item["titulo-ocorrencia"],
        fonte: "SERASA",
        grupo: "SERASA",
      }),
    ) ?? [];

  const protestoRecords =
    spcData?.protesto?.["detalhe-protesto"]?.map((item) => ({
      tipo: "",
      inclusao: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
      origem: "Protesto",
      data: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
      cartorio: item.cartorio,
      cidade: `${item.cidade}/${item.estado}`,
      valor: Number(item.valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      fonte: "PROTESTOS",
      grupo: "PROTESTOS",
    })) ?? [];

  const ALL_RECORDS = [...spcRecords, ...serasaRecords, ...protestoRecords];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const base =
    activeGroup === "TODOS"
      ? ALL_RECORDS
      : ALL_RECORDS.filter((r) => r.grupo === activeGroup);
  const filtered = sortKey
    ? [...base].sort((a, b) => {
        let va: string | number = a[sortKey];
        let vb: string | number = b[sortKey];
        if (sortKey === "inclusao" || sortKey === "vencimento") {
          va = parseBRDate(a[sortKey]);
          vb = parseBRDate(b[sortKey]);
        } else if (sortKey === "valor") {
          va = parseBRValue(a[sortKey]);
          vb = parseBRValue(b[sortKey]);
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : base;

  const PAGE = 5;
  const visible = expanded ? filtered : filtered.slice(0, PAGE);
  const remaining = filtered.length - PAGE;

  const chartData = (() => {
    const rows = [...ALL_RECORDS]
      .filter((r) => r.vencimento !== "–" && r.valor !== "–")
      .sort((a, b) => parseBRDate(a.vencimento) - parseBRDate(b.vencimento))
      .map((r) => ({ data: r.vencimento, valor: parseBRValue(r.valor) }));
    const capped = singleDate ? rows.slice(0, 1) : rows;
    let acc = 0;
    return capped.map((r) => {
      acc += r.valor;
      return { ...r, acumulado: acc };
    });
  })();

  const activeGroupData = GROUPS.find((g) => g.key === activeGroup);

  const normalize = (value?: string) =>
    (value ?? "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\bRUA\b/g, "R")
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const enderecoAtual = spcData?.consumidor?.endereco;

  const ultimoEndereco =
    spcData?.["ultimo-endereco-informado"]?.[
      "detalhe-ultimo-endereco-informado"
    ]?.[0];

  const enderecoDiferente =
    !!enderecoAtual &&
    !!ultimoEndereco &&
    (normalize(enderecoAtual.logradouro) !==
      normalize(ultimoEndereco.logradouro) ||
      normalize(enderecoAtual.cep) !== normalize(ultimoEndereco.cep));

  const consultas =
    spcData?.["consulta-realizada"]?.["detalhe-consulta-realizada"] ?? [];

  const hoje = new Date();
  const umMesAtras = new Date();
  umMesAtras.setDate(hoje.getDate() - 30);

  const consultasUltimos30Dias = consultas.filter((consulta) => {
    const dataConsulta = new Date(consulta["data-consulta"]);
    return dataConsulta >= umMesAtras && dataConsulta <= hoje;
  });

  const possuiAltoVolumeConsultas = consultasUltimos30Dias.length > 10;

  const alertas = [
    ...(enderecoDiferente
      ? [
          {
            severidade: "baixo",
            titulo: "Endereço desatualizado",
            descricao:
              "O endereço informado difere do último endereço registrado nas bases consultadas.",
            fonte: "SPC Brasil",
            tipo: "Endereço",
          },
        ]
      : []),
    ...(possuiAltoVolumeConsultas
      ? [
          {
            severidade: "alto",
            titulo: "Alto volume de consultas recentes",
            descricao: `${consultasUltimos30Dias.length} consultas nos últimos 30 dias — possível busca intensiva por crédito.`,
            data: consultasUltimos30Dias.sort(
              (a, b) =>
                new Date(b["data-consulta"]).getTime() -
                new Date(a["data-consulta"]).getTime(),
            )[0]["data-consulta"],
            fonte: "SPC Brasil",
            tipo: "CPF",
          },
        ]
      : []),
  ];

  const situacao = spcData?.consumidor?.cpf
    ? spcData?.consumidor?.["situacao-cpf"]?.description
    : spcData?.consumidor?.["situacao-cnpj"]?.description;

  const isRegular = situacao === "REGULAR" || situacao === "ATIVA";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Relatório SPC MAXI
        </h1>
      </div>

      {/* Protocolo */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>
            <span className="text-gray-500 font-medium">Protocolo:</span>{" "}
            2026060900042
          </span>
          <span className="text-gray-200">|</span>
          <span>
            <span className="text-gray-500 font-medium">Data/Hora:</span>{" "}
            09/06/2026 às 14:32
          </span>
          <span className="text-gray-200">|</span>
          <span>
            <span className="text-gray-500 font-medium">Operador:</span>{" "}
            Leonardo Lima
          </span>
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
            onClick={() => navigate("/verticais/credito-risco/spc-maxi")}
          >
            <Search size={12} />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Identificação do Consumidor */}
      <div
        id="section-identificacao"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
      >
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
            <span className="text-xs text-gray-400">
              {spcData?.consumidor?.cpf
                ? `CPF: ${spcData?.consumidor?.cpf}`
                : `CNPJ: ${spcData?.consumidor?.cnpj}`}
            </span>
            <span className="text-sm font-semibold text-gray-800 truncate">
              {spcData?.consumidor?.cpf
                ? spcData?.consumidor?.nome
                : spcData?.consumidor?.["razao-social"]}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* Col 2: status + complementar */}
          <div className="flex flex-col gap-1.5 flex-1">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
              style={{
                backgroundColor: isRegular ? "#DCFCE7" : "#FEE2E2",
                color: isRegular ? "#15803D" : "#DC2626",
              }}
            >
              {situacao}
            </span>

            <span className="text-xs text-gray-400 whitespace-nowrap">
              {spcData?.consumidor?.idade} anos · {spcData?.consumidor?.sexo} ·{" "}
              {spcData?.consumidor?.endereco?.cidade}/
              {spcData?.consumidor?.endereco?.estado}
            </span>
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
            <span className="text-xs text-gray-400">
              Perfil com histórico de atrasos pontuais, sem restrições ativas.
            </span>
          </div>
        </div>
      </div>

      {/* Score & Capacidade */}
      {/* <div
        id="section-score"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
      >
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Score &amp; Capacidade
        </h2>

        <div className="flex gap-6">
          <div className="flex items-center justify-center gap-5 w-1/2">
            <div
              className="relative flex items-center justify-center flex-shrink-0"
              style={{ width: 140, height: 140 }}
            >
              <svg viewBox="0 0 120 120" width="140" height="140">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="9"
                  strokeDasharray="235.62 78.54"
                  strokeLinecap="round"
                  transform="rotate(135 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#ED884A"
                  strokeWidth="9"
                  strokeDasharray="151.27 163"
                  strokeLinecap="round"
                  transform="rotate(135 60 60)"
                />
              </svg>
              <div className="absolute flex flex-col items-center leading-none">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "#ED884A" }}
                >
                  642
                </span>
                <span className="text-[10px] text-gray-400 mt-1">de 1000</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
              >
                Risco Médio
              </span>
              <p className="text-xs text-gray-500">
                Inadimplência:{" "}
                <span className="font-semibold text-gray-700">18.5%</span>
              </p>
            </div>
          </div>

          <div className="w-px self-stretch bg-gray-100" />

          <div className="w-1/2 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Resumo Financeiro
            </p>
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
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    {label}
                  </span>
                  {value !== null ? (
                    <span className="text-base font-bold text-gray-800">
                      {value}
                    </span>
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

        <div className="border-t border-gray-100 my-4" />

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-4">
            Comportamento Financeiro
          </p>
          <div className="grid grid-cols-3 gap-16 pb-1">
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Pontualidade de Pagamento
              </span>

              <div className="relative">
                <div
                  className="h-3 w-full rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                >
                  <div
                    className="h-3 rounded-full"
                    style={{ width: "93%", backgroundColor: "#7EC8E3" }}
                  />
                </div>
                <span className="absolute right-0 text-[11px] font-semibold text-gray-700 mt-1">
                  93%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Comprometimento de Gastos
              </span>
              <div className="relative">
                <div
                  className="h-3 w-full rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                >
                  <div
                    className="h-3 rounded-full"
                    style={{ width: "72%", backgroundColor: "#5B8DB8" }}
                  />
                </div>
                <span className="absolute right-0 text-[11px] font-semibold text-gray-700 mt-1">
                  72%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-500 font-medium">SCR</span>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "40% 60%" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    Operações
                  </span>
                  <span className="text-base font-bold text-gray-800">4</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    Contratado
                  </span>
                  <span className="text-base font-bold text-gray-800">
                    R$ 45.000,00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Negativos Consolidados */}
      <div
        id="section-negativos"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
      >
        <div className="flex items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Negativos Consolidados
          </h2>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-5">
          {GROUPS.map((g) => {
            const isActive = activeGroup === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => {
                  setActiveGroup(g.key);
                  setExpanded(false);
                }}
                className="text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: isActive ? "#ED884A" : "#E5E7EB",
                  backgroundColor: isActive ? "#FFFBF7" : "#fff",
                }}
              >
                <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {g.label}
                </p>
                <hr className="border-gray-200 mb-2" />
                <div className="flex items-baseline justify-between mb-2">
                  <span
                    className="text-xl font-bold"
                    style={{ color: isActive ? "#ED884A" : "#1F2937" }}
                  >
                    {g.count}
                  </span>
                  <span
                    className="text-lg font-semibold"
                    style={{ color: isActive ? "#ED884A" : "#374151" }}
                  >
                    {g.valor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                      Antiga
                    </p>
                    <p className="text-xs font-medium text-gray-600">
                      {g.antiga}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                      Recente
                    </p>
                    <p className="text-xs font-medium text-gray-600">
                      {g.recente}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-10 mb-3 pb-3 border-b border-gray-100">
          <span>
            Total:{" "}
            <span className="font-semibold text-gray-800">
              {activeGroupData?.count ?? "0"} registros
            </span>
          </span>
          <span className="text-gray-300">|</span>

          <span>
            Mais antiga:{" "}
            <span className="font-semibold text-gray-700">
              {activeGroupData?.antiga ?? "-"}
            </span>
          </span>

          <span className="text-gray-300">|</span>

          <span>
            Mais recente:{" "}
            <span className="font-semibold text-gray-700">
              {" "}
              {activeGroupData?.recente ?? "-"}
            </span>
          </span>
        </div>

        <table className="w-full text-xs table-fixed">
          {/* <colgroup>
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "104px" }} />
            <col />
            <col style={{ width: "112px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "116px" }} />
            <col style={{ width: "28px" }} />
          </colgroup> */}

          <thead>
            <tr className="border-b border-gray-100">
              {(activeGroup === "TODOS"
                ? [
                    { label: "Tipo", key: "tipo" },
                    { label: "Inclusão", key: "inclusao" },
                    { label: "Vencimento", key: "vencimento" },
                    { label: "Valor", key: "valor" },
                    { label: "Credor", key: "credor" },
                    { label: "Cidade", key: "cidade" },
                    { label: "Origem", key: "origem" },
                    { label: "Telefone", key: "telefone" },
                    { label: "Fonte", key: "fonte" },
                    { label: "", key: null },
                  ]
                : activeGroup === "PROTESTOS"
                  ? [
                      { label: "Data", key: "data" },
                      { label: "Cartório", key: "cartorio" },
                      { label: "Cidade", key: "cidade" },
                      { label: "Valor", key: "valor" },
                    ]
                  : ([
                      { label: "Inclusão", key: "inclusao" },
                      { label: "Vencimento", key: "vencimento" },
                      { label: "Valor", key: "valor" },
                      { label: "Credor", key: "credor" },
                      { label: "Cidade", key: "cidade" },
                      { label: "Origem", key: "origem" },
                      { label: "", key: null },
                    ] as { label: string; key: SortKey | null }[])
              ).map(({ label, key }) => (
                <th key={label} className="text-left pb-2 pr-4 last:pr-0">
                  {key ? (
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-colors"
                      style={{ color: sortKey === key ? "#243871" : "#9CA3AF" }}
                    >
                      {label}
                      {sortKey === key ? (
                        sortDir === "asc" ? (
                          <ArrowUp size={10} />
                        ) : (
                          <ArrowDown size={10} />
                        )
                      ) : (
                        <ArrowUpDown size={10} className="text-gray-300" />
                      )}
                    </button>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {activeGroup === "TODOS" && (
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.tipo}
                  </td>
                )}

                {activeGroup === "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.data}
                  </td>
                )}

                {activeGroup === "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.cartorio}
                  </td>
                )}

                {activeGroup !== "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.inclusao}
                  </td>
                )}

                {activeGroup !== "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.vencimento}
                  </td>
                )}

                <td className="py-2.5 pr-4 text-gray-800 font-medium whitespace-nowrap">
                  {r.valor}
                </td>

                {activeGroup !== "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-700">{r.credor}</td>
                )}

                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                  {r.cidade}
                </td>

                {activeGroup !== "PROTESTOS" && (
                  <td className="py-2.5 pr-4 text-gray-600">{r.origem}</td>
                )}

                {activeGroup === "TODOS" && (
                  <td className="py-2.5 pr-4 text-gray-600">{r.telefone}</td>
                )}

                {activeGroup === "TODOS" && (
                  <td className="py-2.5 pr-4">
                    <FonteBadge fonte={r.fonte} />
                  </td>
                )}

                <td className="py-2.5">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!expanded && remaining > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-xs font-medium transition-colors"
            style={{ color: "#243871" }}
          >
            Exibir mais {remaining} {remaining === 1 ? "registro" : "registros"}
            ...
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

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Variação de Endividamento
            </p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
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
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                }}
                cursor={{ fill: "#F9FAFB" }}
              />
              <Bar
                dataKey="valor"
                fill="#ED884A"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
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

      {alertas.length ? (
        <div
          id="section-alertas"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Alertas</h2>
          <div className="grid grid-cols-2 gap-3">
            {alertas.map((a, i) => {
              const cfg =
                a.severidade === "alto"
                  ? {
                      bg: "#FEF2F2",
                      border: "#FECACA",
                      icon: "#DC2626",
                      badge: { bg: "#FEE2E2", color: "#DC2626" },
                    }
                  : a.severidade === "medio"
                    ? {
                        bg: "#FFFBEB",
                        border: "#FDE68A",
                        icon: "#D97706",
                        badge: { bg: "#FEF3C7", color: "#D97706" },
                      }
                    : {
                        bg: "#F0FDF4",
                        border: "#BBF7D0",
                        icon: "#16A34A",
                        badge: { bg: "#DCFCE7", color: "#16A34A" },
                      };
              return (
                <div
                  key={i}
                  className="rounded-xl border p-4"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert
                      size={18}
                      style={{ color: cfg.icon, flexShrink: 0, marginTop: 1 }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {a.titulo}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap"
                          style={{
                            backgroundColor: cfg.badge.bg,
                            color: cfg.badge.color,
                          }}
                        >
                          {a.severidade}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        {a.descricao}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
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
      ) : (
        <></>
      )}

      {/* Dados Cadastrais */}
      <div
        id="section-cadastrais"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
      >
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Dados Cadastrais
        </h2>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="dados-pessoais" className="border-gray-100">
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Dados Pessoais
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  {
                    label: "Nome completo",
                    value: spcData?.consumidor?.nome,
                  },
                  { label: "CPF", value: spcData?.consumidor?.cpf },
                  {
                    label: "Data de nascimento",
                    value: formatDate(spcData?.consumidor?.["data-nascimento"]),
                  },
                  { label: "Sexo", value: spcData?.consumidor?.sexo },
                  {
                    label: "Nacionalidade",
                    value: !Boolean(spcData?.consumidor?.["pessoa-estrangeira"])
                      ? "Estrangeira"
                      : "Brasileira",
                  },
                  {
                    label: "Nome da mãe",
                    value: spcData?.consumidor?.["nome-mae"] ?? "-",
                  },
                  {
                    label: "Nome do pai",
                    value: spcData?.consumidor?.["nome-pai"] ?? "-",
                  },
                  {
                    label: "RG",
                    value: spcData?.consumidor?.["numero-rg"]
                      ? `${spcData?.consumidor?.["numero-rg"]} SSP/SP`
                      : "-",
                  },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="grafia-pessoal-fisica-spc-brasil"
            className="border-gray-100 last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Grafia - Pessoal Fisica - SPC Brasil
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  {
                    label: "Telefone principal",
                    value: spcData?.consumidor?.["telefone-celular"],
                  },
                  {
                    label: "Telefone secundário",
                    value: spcData?.consumidor?.["telefone-residencial"],
                  },
                  { label: "E-mail", value: spcData?.consumidor?.email },
                  { label: "CEP", value: spcData?.consumidor?.endereco?.cep },
                  {
                    label: "Logradouro",
                    value: `${spcData?.consumidor?.endereco?.logradouro}, ${spcData?.consumidor?.endereco?.numero} — ${spcData?.consumidor?.endereco?.complemento}`,
                  },
                  {
                    label: "Bairro",
                    value: spcData?.consumidor?.endereco?.bairro,
                  },
                  {
                    label: "Cidade",
                    value: spcData?.consumidor?.endereco?.cidade,
                  },
                  {
                    label: "Estado",
                    value: spcData?.consumidor?.endereco?.estado,
                  },
                  { label: "País", value: "Brasil" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contato e Endereço */}
          <AccordionItem
            value="contato-endereco"
            className="border-gray-100 last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Contato e Endereço
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  {
                    label: "Telefone principal",
                    value: spcData?.consumidor?.["telefone-celular"],
                  },
                  {
                    label: "Telefone secundário",
                    value: spcData?.consumidor?.["telefone-residencial"],
                  },
                  { label: "E-mail", value: spcData?.consumidor?.email },
                  { label: "CEP", value: spcData?.consumidor?.endereco?.cep },
                  {
                    label: "Logradouro",
                    value: `${spcData?.consumidor?.endereco?.logradouro}, ${spcData?.consumidor?.endereco?.numero} — ${spcData?.consumidor?.endereco?.complemento}`,
                  },
                  {
                    label: "Bairro",
                    value: spcData?.consumidor?.endereco?.bairro,
                  },
                  {
                    label: "Cidade",
                    value: spcData?.consumidor?.endereco?.cidade,
                  },
                  {
                    label: "Estado",
                    value: spcData?.consumidor?.endereco?.estado,
                  },
                  { label: "País", value: "Brasil" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="ultimos-enderecos-informados-spc-brasil"
            className="border-gray-100 last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Ultimos Endereços Informados - SPC Brasil
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  {
                    label: "Telefone principal",
                    value: spcData?.consumidor?.["telefone-celular"],
                  },
                  {
                    label: "Telefone secundário",
                    value: spcData?.consumidor?.["telefone-residencial"],
                  },
                  { label: "E-mail", value: spcData?.consumidor?.email },
                  { label: "CEP", value: spcData?.consumidor?.endereco?.cep },
                  {
                    label: "Logradouro",
                    value: `${spcData?.consumidor?.endereco?.logradouro}, ${spcData?.consumidor?.endereco?.numero} — ${spcData?.consumidor?.endereco?.complemento}`,
                  },
                  {
                    label: "Bairro",
                    value: spcData?.consumidor?.endereco?.bairro,
                  },
                  {
                    label: "Cidade",
                    value: spcData?.consumidor?.endereco?.cidade,
                  },
                  {
                    label: "Estado",
                    value: spcData?.consumidor?.endereco?.estado,
                  },
                  { label: "País", value: "Brasil" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="agencia-bancaria"
            className="border-gray-100 last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Agencia Bancaria
            </AccordionTrigger>

            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                  { label: "País", value: "Brasil" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="dados-adicionais-contato-spc-brasil"
            className="border-gray-100 last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
              Dados Adicionais de Contato - SPC Brasil
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                {[
                  {
                    label: "Telefone principal",
                    value: spcData?.consumidor?.["telefone-celular"],
                  },
                  {
                    label: "Telefone secundário",
                    value: spcData?.consumidor?.["telefone-residencial"],
                  },
                  { label: "E-mail", value: spcData?.consumidor?.email },
                  { label: "CEP", value: spcData?.consumidor?.endereco?.cep },
                  {
                    label: "Logradouro",
                    value: `${spcData?.consumidor?.endereco?.logradouro}, ${spcData?.consumidor?.endereco?.numero} — ${spcData?.consumidor?.endereco?.complemento}`,
                  },
                  {
                    label: "Bairro",
                    value: spcData?.consumidor?.endereco?.bairro,
                  },
                  {
                    label: "Cidade",
                    value: spcData?.consumidor?.endereco?.cidade,
                  },
                  {
                    label: "Estado",
                    value: spcData?.consumidor?.endereco?.estado,
                  },
                  { label: "País", value: "Brasil" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>
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
        const consultas =
          spcData?.["consulta-realizada"]?.["detalhe-consulta-realizada"] ?? [];

        const agora = new Date();

        const ultimos30 = consultas.filter((consulta: any) => {
          const data = new Date(consulta["data-consulta"]);
          return (
            (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 30
          );
        }).length;

        const ultimos60 = consultas.filter((consulta: any) => {
          const data = new Date(consulta["data-consulta"]);
          return (
            (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 60
          );
        }).length;

        const ultimos90 = consultas.filter((consulta: any) => {
          const data = new Date(consulta["data-consulta"]);
          return (
            (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 90
          );
        }).length;

        const total = consultas.length;

        const consultasMes = Object.values(
          consultas.reduce(
            (
              acc: Record<string, { mes: string; total: number }>,
              consulta: any,
            ) => {
              const data = new Date(consulta["data-consulta"]);

              const chave = `${String(data.getMonth() + 1).padStart(
                2,
                "0",
              )}/${data.getFullYear()}`;

              if (!acc[chave]) {
                acc[chave] = {
                  mes: chave,
                  total: 0,
                };
              }

              acc[chave].total++;

              return acc;
            },
            {},
          ),
        ).sort((a, b) => {
          const [ma, aa] = a.mes.split("/");
          const [mb, ab] = b.mes.split("/");

          return (
            new Date(Number(aa), Number(ma) - 1).getTime() -
            new Date(Number(ab), Number(mb) - 1).getTime()
          );
        });

        const todasConsultas = consultas.map((consulta: any) => ({
          data: formatDate(consulta["data-consulta"]),
          associado: consulta["nome-associado"],
          entidade: consulta["nome-entidade-origem"],
          cidade: `${consulta["origem-associado"]}/${consulta["estado"]}`,
        }));

        const visibleConsultas = consultasExpanded
          ? todasConsultas
          : todasConsultas.slice(0, 5);

        return (
          <div
            id="section-consultas"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
          >
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Consultas Realizadas
            </h2>

            <div className="grid grid-cols-4 divide-x divide-gray-100 border border-gray-100 rounded-xl mb-5 overflow-hidden">
              {[
                { valor: ultimos30, label: "Últimos 30 dias" },
                { valor: ultimos60, label: "Últimos 60 dias" },
                { valor: ultimos90, label: "Últimos 90 dias" },
                { valor: total, label: "Total" },
              ].map((k) => (
                <div key={k.label} className="flex flex-col items-center py-4">
                  <span className="text-2xl font-bold text-gray-800">
                    {k.valor}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {k.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Evolução de Consultas por Mês
            </p>

            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart
                data={consultasMes}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />

                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />

                <Tooltip
                  formatter={(v: number) => [v, "Consultas"]}
                  labelStyle={{
                    fontSize: 11,
                    color: "#374151",
                  }}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
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

            <div className="mt-5 border-t border-gray-100 pt-4">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Data", "Associado", "Nome da Entidade", "Cidade"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {visibleConsultas.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                        {r.data}
                      </td>

                      <td className="py-2.5 pr-4 text-gray-700 font-medium">
                        {r.associado}
                      </td>

                      <td className="py-2.5 pr-4 text-gray-600">
                        {r.entidade}
                      </td>

                      <td className="py-2.5 pr-4 text-gray-600">{r.cidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setConsultasExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: "#243871" }}
                >
                  {consultasExpanded ? "Recolher" : "Expandir"}

                  <span className="text-[10px]">
                    {consultasExpanded ? "▲" : "▼"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating section nav */}
      <div className="fixed bottom-10 right-6 z-50 flex flex-col gap-2.5">
        {[
          {
            id: "section-identificacao",
            icon: <User size={16} />,
            label: "Identificação",
          },
          {
            id: "section-score",
            icon: <BarChart2 size={16} />,
            label: "Score & Capacidade",
          },
          {
            id: "section-negativos",
            icon: <AlertTriangle size={16} />,
            label: "Negativos Consolidados",
          },
          {
            id: "section-alertas",
            icon: <ShieldAlert size={16} />,
            label: "Alertas",
          },
          {
            id: "section-cadastrais",
            icon: <ClipboardList size={16} />,
            label: "Dados Cadastrais",
          },
          {
            id: "section-consultas",
            icon: <Search size={16} />,
            label: "Consultas Realizadas",
          },
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
              onClick={() => {
                const el = document.getElementById(id);
                if (el) {
                  const y =
                    el.getBoundingClientRect().top + window.scrollY - 68 - 16;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
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
