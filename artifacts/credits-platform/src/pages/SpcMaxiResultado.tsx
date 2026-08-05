import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  User,
  Printer,
  Search,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  ShieldAlert,
  BarChart2,
  AlertTriangle,
  ClipboardList,
  Copy,
  Check,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

type SortKey =
  | "inclusao"
  | "vencimento"
  | "valor"
  | "credor"
  | "cidade"
  | "origem"
  | "motivo"
  | "banco"
  | "agencia"
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

interface SpcMaxiRequest {
  document: string;
  typeDocument: "CPF" | "CNPJ";
  insumos: string[];
}

export default function SpcMaxiResultadoPage() {
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();

  const requestData = queryClient.getQueryData<SpcMaxiRequest>([
    "spc-maxi-request",
  ]);

  const {
    data: spcData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "spc-maxi",
      requestData?.document,
      requestData?.typeDocument,
      requestData?.insumos,
    ],

    queryFn: async () => {
      if (!requestData) {
        throw new Error("Parâmetros da consulta não encontrados.");
      }

      const response = await fetch(
        "http://localhost:3333/api/325-spc-maxi",
        // "https://credits-core.onrender.com/api/325-spc-maxi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: requestData.document,
            typeDocument: requestData.typeDocument,
            insumos: requestData.insumos,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Erro ao realizar a consulta SPC MAXI.",
        );
      }

      return data?.spc;
    },

    enabled: Boolean(requestData),
    retry: false,
    staleTime: Infinity,
  });

  const isKeyboardReloadRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isReloadShortcut =
        event.key === "F5" ||
        (event.ctrlKey && event.key.toLowerCase() === "r") ||
        (event.metaKey && event.key.toLowerCase() === "r");

      if (isReloadShortcut) {
        event.preventDefault();
        isKeyboardReloadRef.current = true;
        setShowRedirectModal(true);
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isKeyboardReloadRef.current) {
        event.preventDefault();
        event.returnValue = "";
        return;
      }

      sessionStorage.setItem("spc-maxi-redirect-after-reload", "true");
    };

    const pendingRedirect = sessionStorage.getItem(
      "spc-maxi-redirect-after-reload",
    );
    if (pendingRedirect === "true") {
      sessionStorage.removeItem("spc-maxi-redirect-after-reload");
      navigate("/verticais/credito-risco/spc-maxi");
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate]);

  console.log("SPC DATA:", spcData);

  const [activeGroup, setActiveGroup] = useState("SPC");
  const [expanded, setExpanded] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [consultasExpanded, setConsultasExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  useEffect(() => {
    setExpandedRowKey(null);
  }, [activeGroup, expanded, sortKey, sortDir]);

  const handleOpenReloadModal = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(true);
  };

  const handleCancelReload = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(false);
  };

  const handleConfirmReload = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(false);
    navigate("/verticais/credito-risco/spc-maxi");
  };

  const copyToClipboard = async (value: string, field: string) => {
    if (!value) return;

    await navigator.clipboard.writeText(value);

    setCopiedField(field);

    setTimeout(() => setCopiedField(null), 1500);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const [year, month, day] = date.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const getCompanyAge = (foundationDate?: string): number | string => {
    if (!foundationDate) return "-";

    const date = new Date(foundationDate);

    if (Number.isNaN(date.getTime())) return "-";

    const today = new Date();

    let years = today.getFullYear() - date.getFullYear();

    const hasNotHadBirthdayThisYear =
      today.getMonth() < date.getMonth() ||
      (today.getMonth() === date.getMonth() &&
        today.getDate() < date.getDate());

    if (hasNotHadBirthdayThisYear) {
      years--;
    }

    return years;
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return "-";

    const value = cpf.replace(/\D/g, "");

    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "-";

    const value = cnpj.replace(/\D/g, "");

    return value.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  };

  const formatCEP = (cep?: string) => {
    if (!cep) return "-";

    const value = cep.replace(/\D/g, "").padStart(8, "0");

    return value.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";

    const value = phone.replace(/\D/g, "");

    if (value.length === 11) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (value.length === 10) {
      return value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return phone;
  };

  const formatValor = (valor?: string | number) => {
    const numero = Number(valor ?? 0);

    return numero === 0
      ? "R$ 0"
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(numero);
  };

  const ccfSource = (() => {
    const payload = spcData?.ccf;
    const detalhes = payload?.["detalhe-ccf"];

    if (Array.isArray(detalhes)) return detalhes;
    if (detalhes) return [detalhes];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.ccf)) return payload.ccf;
    if (Array.isArray(payload?.dados)) return payload.dados;

    return [];
  })();

  const ccfRecords =
    ccfSource.map((item: any) => {
      const inclusao =
        item?.$?.["data-ultimo-cheque"] ??
        item?.["data-ultimo-cheque"] ??
        item?.["data-inclusao"] ??
        item?.["data-ocorrencia"] ??
        item?.data;
      const dataExibicao = inclusao
        ? inclusao.includes("/")
          ? inclusao
          : (() => {
              const [year, month, day] = String(inclusao)
                .split("T")[0]
                .split("-");
              return `${day}/${month}/${year}`;
            })()
        : "-";

      return {
        tipo: item?.$?.["tipo-ocorrencia"] ?? item?.tipo ?? "",
        inclusao: dataExibicao,
        vencimento: "–",
        valor: "–",
        contrato: item?.contrato ?? "",
        credor: item?.$?.origem,
        cidade: item?.cidade ? `${item.cidade}/${item.estado ?? ""}` : "-",
        origem: item?.origem,
        motivo: `${item?.motivo?.codigo} - ${item?.motivo?.descricao}`,
        banco: item?.["ultimo-cheque"]?.banco?.nome,
        agencia: item?.["ultimo-cheque"]?.["numero-agencia"],
        fonte: "CCF",
        grupo: "CCF",
      };
    }) ?? [];

  const GROUPS = [
    {
      key: "SPC",
      label: "SPC",
      count: Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0),
      valor: formatValor(spcData?.spc?.resumo?.["valor-total"]),
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
      count: Number(
        spcData?.["pendencia-financeira"]?.resumo?.["quantidade-total"] ?? 0,
      ),
      valor: formatValor(
        spcData?.["pendencia-financeira"]?.resumo?.["valor-total"],
      ),
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
      count: Number(spcData?.protesto?.resumo?.["quantidade-total"] ?? 0),
      valor: formatValor(spcData?.protesto?.resumo?.["valor-total"]),
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
      count: ccfRecords.length,
      valor: "–",
      antiga: ccfRecords.length
        ? [...ccfRecords].sort(
            (a, b) => parseBRDate(a.inclusao) - parseBRDate(b.inclusao),
          )[0].inclusao
        : "-",
      recente: ccfRecords.length
        ? ([...ccfRecords]
            .sort((a, b) => parseBRDate(a.inclusao) - parseBRDate(b.inclusao))
            .at(-1)?.inclusao ?? "-")
        : "-",
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
      vencimento: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
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

  const ALL_RECORDS = [
    ...spcRecords,
    ...serasaRecords,
    ...protestoRecords,
    ...ccfRecords,
  ];

  const chartData = (() => {
    const records =
      activeGroup === "TODOS"
        ? ALL_RECORDS
        : ALL_RECORDS.filter((r) => r.grupo === activeGroup);

    const grouped = records
      .filter((r) => r.vencimento && r.vencimento !== "–" && r.valor !== "–")
      .reduce(
        (acc, item) => {
          const data = item.vencimento;
          const valor = parseBRValue(item.valor);

          if (!acc[data]) {
            acc[data] = {
              data,
              valor: 0,
            };
          }

          acc[data].valor += valor;

          return acc;
        },
        {} as Record<string, { data: string; valor: number }>,
      );

    const rows = Object.values(grouped).sort(
      (a, b) => parseBRDate(a.data) - parseBRDate(b.data),
    );

    let acumulado = 0;

    return rows.map((item) => {
      acumulado += item.valor;

      return {
        ...item,
        acumulado,
      };
    });
  })();

  const activeGroupData = GROUPS.find((g) => g.key === activeGroup);
  const shouldShowChart =
    (activeGroupData?.count ?? 0) > 0 && chartData.length > 0;

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
          va = parseBRDate(String(a[sortKey] ?? ""));
          vb = parseBRDate(String(b[sortKey] ?? ""));
        } else if (sortKey === "valor") {
          va = parseBRValue(String(a[sortKey] ?? ""));
          vb = parseBRValue(String(b[sortKey] ?? ""));
        } else {
          va = String(a[sortKey] ?? "");
          vb = String(b[sortKey] ?? "");
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : base;

  const PAGE = 5;
  const visible = expanded ? filtered : filtered.slice(0, PAGE);
  const remaining = filtered.length - PAGE;

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

  const detalhes =
    spcData?.["dados-adicionais-de-contato"]?.[
      "detalhe-dados-adicionais-de-contato"
    ] ?? [];

  const body = detalhes.flatMap((item: any) => {
    if (!item || typeof item !== "object") return [];

    const enderecos = spcData?.consumidor?.cpf
      ? (item.enderecosPF ?? [])
      : (item.enderecosPJ ?? []);
    const emails = item.emails ?? [];
    const telefones = item.telefones ?? [];
    const celulares = item.celulares ?? [];

    const maxLength = Math.max(
      enderecos.length,
      emails.length,
      telefones.length,
      celulares.length,
    );

    return Array.from({ length: maxLength }, (_, index) => ({
      endereco: enderecos[index] ?? "-",
      email: emails[index] ?? "-",
      telefone: telefones[index] ?? "-",
      celular: celulares[index] ?? "-",
    })).filter(
      (row) =>
        !(
          (row.endereco === "-" || row.endereco === " ") &&
          (row.email === "-" || row.email === " ") &&
          (row.telefone === "-" || row.telefone === " ") &&
          (row.celular === "-" || row.celular === " ")
        ),
    );
  });

  const resumoTabela = (() => {
    if (!base.length) {
      return {
        count: 0,
        antiga: "-",
        recente: "-",
      };
    }

    const datas = base
      .map((item) => item.vencimento || item.inclusao || item.data)
      .filter(
        (data): data is string => Boolean(data) && data !== "-" && data !== "–",
      );

    if (!datas.length) {
      return {
        count: base.length,
        antiga: "-",
        recente: "-",
      };
    }

    const datasOrdenadas = [...datas].sort(
      (a, b) => parseBRDate(a) - parseBRDate(b),
    );

    return {
      count: base.length,
      antiga: datasOrdenadas[0],
      recente: datasOrdenadas[datasOrdenadas.length - 1],
    };
  })();

  useEffect(() => {
    if (!requestData) {
      navigate("/verticais/credito-risco/spc-maxi");
    }
  }, [navigate, requestData]);

  if (!requestData) {
    return null;
  }

  const scoreCadastroPositivo = Number(spcData?.["score-cadastro-positivo"]);
  const score12Meses = Number(
    spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.score,
  );
  const score3Meses = Number(
    spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.score,
  );

  const scoreSource = Number.isFinite(scoreCadastroPositivo)
    ? "cadastro"
    : Number.isFinite(score12Meses)
      ? "12-meses"
      : Number.isFinite(score3Meses)
        ? "3-meses"
        : "none";

  const mainScoreLabel =
    scoreSource === "cadastro"
      ? "Score + Positivo"
      : scoreSource === "12-meses"
        ? "Score 12 meses"
        : scoreSource === "3-meses"
          ? "Score 3 meses"
          : "Score";

  const mainScoreInterpretativeMessage =
    scoreSource === "12-meses"
      ? spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.[
          "mesagem-interpretativa-score"
        ]
      : scoreSource === "3-meses"
        ? spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.[
            "mesagem-interpretativa-score"
          ]
        : "";

  const score =
    [scoreCadastroPositivo, score12Meses, score3Meses].find((value) =>
      Number.isFinite(value),
    ) ?? 0;

  const normalizedScore = Math.min(Math.max(score, 0), 1000);
  const normalizedScore12Meses = Math.min(Math.max(score12Meses, 0), 1000);
  const normalizedScore3Meses = Math.min(Math.max(score3Meses, 0), 1000);
  const hasScore12Meses = Boolean(spcData?.["spc-score-12-meses"]);
  const hasScore3Meses = Boolean(spcData?.["spc-score-3-meses"]);
  const shouldShowScore12Meses = hasScore12Meses && scoreSource !== "12-meses";
  const shouldShowScore3Meses = hasScore3Meses && scoreSource !== "3-meses";
  const shouldShowDedicatedPeriodScores =
    shouldShowScore12Meses || shouldShowScore3Meses;
  const hasBothScorePeriods = shouldShowScore12Meses && shouldShowScore3Meses;

  const scoreColor = (() => {
    if (normalizedScore >= 675) return "#259f58";
    if (normalizedScore >= 467) return "#ffca39";
    return "#f6a020";
  })();

  const riscoInfo = (() => {
    if (normalizedScore >= 675) {
      return {
        label: "Risco Baixo",
        description:
          "Perfil com baixo risco de inadimplencia e bom historico de pagamento.",
        badge: { backgroundColor: "#DCFCE7", color: "#15803D" },
      };
    }

    if (normalizedScore >= 467) {
      return {
        label: "Risco Medio",
        badge: { backgroundColor: "#FEF3C7", color: "#D97706" },
      };
    }

    return {
      label: "Risco Alto",
      badge: { backgroundColor: "#FEE2E2", color: "#DC2626" },
    };
  })();

  const pontualidadePagamentoPercent = (() => {
    const segmentos =
      spcData?.["indice-pontualidade-pagamento-cadastro-positivo"]?.[
        "detalhe-indice-pontualidade-pagamento-cadastro-positivo"
      ]?.segmentos ?? [];

    const valores = segmentos.flatMap((segmento: any) =>
      (segmento?.periodos ?? [])
        .filter(
          (periodo: any) =>
            periodo?.descricao === "PAGAMENTO_EM_DIA" &&
            Number(periodo?.porcentual ?? 0) > 0,
        )
        .map((periodo: any) => Number(periodo?.porcentual ?? 0)),
    );

    if (!valores.length) return 0;

    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);

    if (ordenados.length % 2 === 0) {
      return (ordenados[meio - 1] + ordenados[meio]) / 2;
    }

    return ordenados[meio];
  })();

  const hasPontualidadeData =
    spcData?.["indice-pontualidade-pagamento-cadastro-positivo"];

  const comprometimentoGastos = (() => {
    const segmentos =
      spcData?.["indice-comportamento-gastos-cadastro-positivo"]?.[
        "detalhe-indice-comportamento-gastos-cadastro-positivo"
      ]?.segmentos ?? [];

    const maiorSegmento = [...segmentos]
      .filter(
        (segmento: any) =>
          Number(segmento?.["porcentual-representatividade"] ?? 0) > 0,
      )
      .sort(
        (a: any, b: any) =>
          Number(b?.["porcentual-representatividade"] ?? 0) -
          Number(a?.["porcentual-representatividade"] ?? 0),
      )[0];

    return {
      percentual: Number(maiorSegmento?.["porcentual-representatividade"] ?? 0),
      nome: maiorSegmento?.nome ?? "-",
    };
  })();

  const hasComprometimentoData =
    spcData?.["indice-comportamento-gastos-cadastro-positivo"];

  const scrOperacao = (() => {
    const detalhes =
      spcData?.["insumo-operacao-scr"]?.["detalhe-insumo-operacao-scr"] ?? [];
    const primeiro = detalhes[0] ?? {};

    return {
      quantidade: primeiro?.quantidade ?? "0",
      contratadoInicial: Number(
        primeiro?.["valor-total-contratado-inicial"] ?? 0,
      ),
      contratadoFinal: Number(primeiro?.["valor-total-contratado-final"] ?? 0),
    };
  })();

  const hasScrData = spcData?.["insumo-operacao-scr"];
  const hasComportamentoFinanceiroData =
    Boolean(hasPontualidadeData) ||
    Boolean(hasComprometimentoData) ||
    Boolean(hasScrData);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const arcPercentage = 0.75;
  const arcLength = circumference * arcPercentage;

  const progressLength = (normalizedScore / 1000) * arcLength;

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#243871]" />

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Consultando SPC MAXI
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Aguarde enquanto buscamos as informações.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Erro ao realizar consulta
          </p>

          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : "Não foi possível consultar os dados."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/verticais/credito-risco/spc-maxi")}
            className="mt-4 rounded-lg bg-[#243871] px-4 py-2 text-sm font-semibold text-white"
          >
            Voltar para consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showRedirectModal} onOpenChange={setShowRedirectModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar para a tela de consulta?</AlertDialogTitle>

            <AlertDialogDescription>
              Esta ação retornará para a tela de consulta SPC MAXI. Confirme
              abaixo se deseja continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <AlertDialogCancel onClick={handleCancelReload}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction onClick={handleConfirmReload}>
              Voltar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full">
        <div>
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-800">
              Relatório SPC MAXI
            </h1>
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center">
                <span className="text-gray-500 font-medium mr-1">
                  Protocolo:
                </span>

                <div className="flex items-center gap-2">
                  2026060900042
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard("2026060900042", "protocolo")
                    }
                    className="text-gray-400 hover:text-[#243871] hover:cursor-pointer"
                    title="Copiar Protocolo"
                  >
                    {copiedField === "protocolo" ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
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
                onClick={handleOpenReloadModal}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                <RefreshCw size={12} />
                Recarregar
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

          <div
            id="section-identificacao"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#EAECF0" }}
              >
                <User
                  size={18}
                  style={{ color: "#243871" }}
                  strokeWidth={1.5}
                />
              </div>

              <div className="flex flex-col gap-0.5 min-w-0 basis-[25%] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {spcData?.consumidor?.cpf
                      ? `CPF: ${formatCPF(spcData?.consumidor?.cpf)}`
                      : `CNPJ: ${formatCNPJ(spcData?.consumidor?.cnpj)}`}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        spcData?.consumidor?.cpf ?? spcData?.consumidor?.cnpj,
                        spcData?.consumidor?.cpf ? `CPF` : `CNPJ`,
                      )
                    }
                    className="text-gray-400 hover:text-[#243871] hover:cursor-pointer"
                    title={
                      spcData?.consumidor?.cpf ? "Copiar CPF" : "Copiar CNPJ"
                    }
                  >
                    {copiedField ===
                    (spcData?.consumidor?.cpf ? `CPF` : `CNPJ`) ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {spcData?.consumidor?.cpf
                      ? spcData?.consumidor?.nome
                      : spcData?.consumidor?.["razao-social"]}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        spcData?.consumidor?.nome ??
                          spcData?.consumidor?.["razao-social"],
                        spcData?.consumidor?.cpf ? "Nome" : "Razão Social",
                      )
                    }
                    className="text-gray-400 hover:text-[#243871] hover:cursor-pointer"
                    title={
                      spcData?.consumidor?.cpf
                        ? "Copiar Nome"
                        : "Copiar Razão Social"
                    }
                  >
                    {copiedField ===
                    (spcData?.consumidor?.cpf ? "Nome" : "Razão Social") ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              <div className="w-px self-stretch bg-gray-100" />

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

                {spcData?.consumidor?.cpf ? (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {spcData?.consumidor?.idade} anos ·{" "}
                    {spcData?.consumidor?.sexo} ·{" "}
                    {spcData?.consumidor?.endereco?.cidade}/
                    {spcData?.consumidor?.endereco?.estado}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {getCompanyAge(spcData?.consumidor?.["data-fundacao"])} anos
                    · {spcData?.consumidor?.endereco?.cidade}/
                    {spcData?.consumidor?.endereco?.estado}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Score + Positivo
          </h2>

          <div className="flex gap-6">
            <div className="flex items-center gap-5 w-1/2">
              <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{ width: 140, height: 140 }}
              >
                <svg viewBox="0 0 120 120" width="140" height="140">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="9"
                    strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                    strokeLinecap="round"
                    transform="rotate(135 60 60)"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="9"
                    strokeDasharray={`${progressLength} ${
                      circumference - progressLength
                    }`}
                    strokeLinecap="round"
                    transform="rotate(135 60 60)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center leading-none">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: scoreColor }}
                  >
                    {normalizedScore}
                  </span>

                  <span className="mt-1 text-[10px] text-gray-400">
                    de 1000
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                    style={riscoInfo.badge}
                  >
                    {riscoInfo.label}
                  </span>

                  <strong className="text-xs text-gray-700">
                    {mainScoreLabel}
                  </strong>
                </div>

                {mainScoreInterpretativeMessage && (
                  <p className="text-xs text-gray-500 text-justify">
                    {mainScoreInterpretativeMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="w-px self-stretch bg-gray-100" />

            <div className="w-1/2 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Resumo Financeiro
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ...(spcData?.["renda-presumida-spc"]
                    ? [
                        {
                          label: "Renda Presumida",
                          value: formatValor(
                            spcData?.["renda-presumida-spc"]?.resumo?.[
                              "valor-total"
                            ],
                          ),
                        },
                      ]
                    : []),
                  ...(spcData?.["limite-credito-sugerido"]
                    ? [
                        {
                          label: "Limite Sugerido",
                          value: formatValor(
                            spcData?.["limite-credito-sugerido"]?.resumo?.[
                              "valor-total"
                            ],
                          ),
                        },
                      ]
                    : []),
                  ...(spcData?.["comprometimento-renda-mensal-pf"]
                    ? [
                        {
                          label: "Comprometimento",
                          value:
                            spcData?.["comprometimento-renda-mensal-pf"]?.[
                              "detalhe-comprometimento-renda-mensal-pf"
                            ]?.faixa,
                        },
                      ]
                    : []),
                  ...(spcData?.["alerta-identidade-fraude"]
                    ? [
                        {
                          label: "Alerta de Identidade à Fraude",
                          value: (
                            <span
                              className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={
                                spcData?.["alerta-identidade-fraude"]?.[
                                  "detalhe-alerta-identidade-fraude"
                                ]?.[0]?.["alerta-fraude"] === "true"
                                  ? {
                                      backgroundColor: "#FEE2E2",
                                      color: "#DC2626",
                                    }
                                  : {
                                      backgroundColor: "#DCFCE7",
                                      color: "#15803D",
                                    }
                              }
                            >
                              {spcData?.["alerta-identidade-fraude"]?.[
                                "detalhe-alerta-identidade-fraude"
                              ]?.[0]?.["alerta-fraude"] === "true"
                                ? "Alerta ativo"
                                : "Sem alertas"}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: "#F8F9FB" }}
                  >
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                      {label}
                    </span>

                    {typeof value === "string" || typeof value === "number" ? (
                      <span className="text-base font-bold text-gray-800">
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {shouldShowDedicatedPeriodScores && (
            <div className="flex gap-6 mt-4">
              {shouldShowScore12Meses && (
                <>
                  {/* 12 Meses */}
                  <div
                    className={`flex items-center justify-center gap-5 ${
                      hasBothScorePeriods ? "w-1/2" : "w-full"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-5 w-full ${
                        hasBothScorePeriods ? "justify-center" : "justify-start"
                      }`}
                    >
                      <div
                        className="relative flex items-center justify-center flex-shrink-0"
                        style={{ width: 140, height: 140 }}
                      >
                        <svg viewBox="0 0 120 120" width="140" height="140">
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="9"
                            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                            strokeLinecap="round"
                            transform="rotate(135 60 60)"
                          />

                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth="9"
                            strokeDasharray={`${progressLength} ${
                              circumference - progressLength
                            }`}
                            strokeLinecap="round"
                            transform="rotate(135 60 60)"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>

                        <div className="absolute flex flex-col items-center leading-none">
                          <span
                            className="text-3xl font-bold"
                            style={{ color: scoreColor }}
                          >
                            {normalizedScore12Meses}
                          </span>

                          <span className="mt-1 text-[10px] text-gray-400">
                            de 1000
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                            style={riscoInfo.badge}
                          >
                            {riscoInfo.label}
                          </span>

                          <span className="text-xs text-gray-500">
                            Período:{" "}
                            <strong className="text-xs text-gray-700">
                              12 meses
                            </strong>
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 text-justify">
                          {
                            spcData?.["spc-score-12-meses"]?.[
                              "detalhe-spc-score-12-meses"
                            ]?.[0]?.["mesagem-interpretativa-score"]
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {shouldShowScore3Meses && (
                <>
                  {shouldShowScore12Meses && (
                    <div className="w-px self-stretch bg-gray-100" />
                  )}

                  {/* 3 Meses */}
                  <div
                    className={`flex items-center justify-center gap-5 ${
                      hasBothScorePeriods ? "w-1/2" : "w-full"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-5 w-full ${
                        hasBothScorePeriods ? "justify-center" : "justify-start"
                      }`}
                    >
                      <div
                        className="relative flex items-center justify-center flex-shrink-0"
                        style={{ width: 140, height: 140 }}
                      >
                        <svg viewBox="0 0 120 120" width="140" height="140">
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="9"
                            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                            strokeLinecap="round"
                            transform="rotate(135 60 60)"
                          />

                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth="9"
                            strokeDasharray={`${progressLength} ${
                              circumference - progressLength
                            }`}
                            strokeLinecap="round"
                            transform="rotate(135 60 60)"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>

                        <div className="absolute flex flex-col items-center leading-none">
                          <span
                            className="text-3xl font-bold"
                            style={{ color: scoreColor }}
                          >
                            {normalizedScore3Meses}
                          </span>

                          <span className="mt-1 text-[10px] text-gray-400">
                            de 1000
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
                            style={riscoInfo.badge}
                          >
                            {riscoInfo.label}
                          </span>

                          <span className="text-xs text-gray-500">
                            Período:{" "}
                            <strong className="text-xs text-gray-700">
                              3 meses
                            </strong>
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 text-justify">
                          {
                            spcData?.["spc-score-3-meses"]?.[
                              "detalhe-spc-score-3-meses"
                            ]?.["mesagem-interpretativa-score"]
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {hasComportamentoFinanceiroData && (
            <div className="border-t border-gray-100 my-4" />
          )}

          {hasComportamentoFinanceiroData && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 mb-4">
                Comportamento Financeiro
              </p>

              <div className="grid grid-cols-1 gap-3 pb-1 md:grid-cols-2 md:gap-3 xl:grid-cols-[0.85fr_0.85fr_1.3fr] xl:gap-4">
                {hasPontualidadeData && (
                  <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-100 p-4 xl:max-w-[320px]">
                    <span className="text-xs text-gray-500 font-medium">
                      Pontualidade de Pagamento
                    </span>

                    <div className="space-y-1.5">
                      <div
                        className="h-3 w-full rounded-full"
                        style={{ backgroundColor: "#E5E7EB" }}
                      >
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${Math.min(Math.max(pontualidadePagamentoPercent, 0), 100)}%`,
                            backgroundColor: "#7EC8E3",
                          }}
                        />
                      </div>

                      <div className="flex justify-end">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {pontualidadePagamentoPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {hasComprometimentoData && (
                  <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-100 p-4 xl:max-w-[320px]">
                    <span className="text-xs text-gray-500 font-medium">
                      Comprometimento de Gastos
                    </span>

                    <div className="space-y-1.5">
                      <div
                        className="h-3 w-full rounded-full"
                        style={{ backgroundColor: "#E5E7EB" }}
                      >
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${Math.min(Math.max(comprometimentoGastos.percentual, 0), 100)}%`,
                            backgroundColor: "#5B8DB8",
                          }}
                        />
                      </div>

                      <div className="flex justify-end">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {comprometimentoGastos.percentual.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-gray-500">
                      Maior concentração:{" "}
                      <strong className="text-xs text-gray-700">
                        {comprometimentoGastos.nome}
                      </strong>
                    </span>
                  </div>
                )}

                {hasScrData && (
                  <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-100 p-4 md:col-span-2 xl:col-span-1">
                    <span className="text-xs text-gray-500 font-medium">
                      SCR
                    </span>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          Operações
                        </span>

                        <span className="text-base font-bold text-gray-800">
                          {scrOperacao.quantidade}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          Contratado Inicial
                        </span>

                        <span className="text-base font-bold text-gray-800">
                          {formatValor(scrOperacao.contratadoInicial)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          Contratado Final
                        </span>

                        <span className="text-base font-bold text-gray-800">
                          {formatValor(scrOperacao.contratadoFinal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          id="section-negativos"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
        >
          <div className="flex items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Negativos Consolidados
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
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
                {resumoTabela.count} registros
              </span>
            </span>

            <span className="text-gray-300">|</span>

            <span>
              Mais antiga:{" "}
              <span className="font-semibold text-gray-700">
                {resumoTabela.antiga}
              </span>
            </span>

            <span className="text-gray-300">|</span>

            <span>
              Mais recente:{" "}
              <span className="font-semibold text-gray-700">
                {resumoTabela.recente}
              </span>
            </span>
          </div>

          <table className="w-full text-xs table-fixed">
            {activeGroup === "CCF" ? (
              <colgroup>
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col />
                <col />
              </colgroup>
            ) : activeGroup === "PROTESTOS" ? (
              <colgroup>
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col />
                <col />
                <col style={{ width: "30px" }} />
              </colgroup>
            ) : (
              <colgroup>
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col />
                <col />
                <col />
                <col />
                <col style={{ width: "30px" }} />
              </colgroup>
            )}

            <thead>
              <tr className="border-b border-gray-100">
                {(activeGroup === "CCF"
                  ? [
                      { label: "Inclusão", key: "inclusao" },
                      { label: "Motivo", key: "motivo" },
                      { label: "Agência", key: "agencia" },
                      { label: "Banco", key: "banco" },
                      { label: "Origem", key: "origem" },
                    ]
                  : activeGroup === "PROTESTOS"
                    ? [
                        { label: "Data", key: "data" },
                        { label: "Cartório", key: "cartorio" },
                        { label: "Valor", key: "valor" },
                        { label: "Cidade", key: "cidade" },
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
                        style={{
                          color: sortKey === key ? "#243871" : "#9CA3AF",
                        }}
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
              {visible.map((r, i) => {
                const rowKey = `${activeGroup}-${i}-${r.inclusao ?? r.data ?? ""}-${r.valor ?? ""}`;
                const isRowExpanded = expandedRowKey === rowKey;
                const detailColSpan =
                  activeGroup === "CCF"
                    ? 5
                    : activeGroup === "PROTESTOS"
                      ? 5
                      : 7;

                const detailFields =
                  activeGroup === "PROTESTOS"
                    ? [
                        { label: "Data", value: r.data ?? "-" },
                        { label: "Cartório", value: r.cartorio ?? "-" },
                        { label: "Valor", value: r.valor ?? "-" },
                        { label: "Cidade", value: r.cidade ?? "-" },
                      ]
                    : [
                        { label: "Inclusão", value: r.inclusao ?? "-" },
                        { label: "Vencimento", value: r.vencimento ?? "-" },
                        { label: "Valor", value: r.valor ?? "-" },
                        { label: "Credor", value: r.credor ?? "-" },
                        { label: "Cidade", value: r.cidade ?? "-" },
                        { label: "Origem", value: r.origem ?? "-" },
                      ];

                return (
                  <>
                    <tr
                      key={rowKey}
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

                      {activeGroup === "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.inclusao}
                        </td>
                      )}

                      {activeGroup === "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.motivo}
                        </td>
                      )}

                      {activeGroup === "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.agencia}
                        </td>
                      )}

                      {activeGroup === "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.banco}
                        </td>
                      )}

                      {activeGroup === "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.origem}
                        </td>
                      )}

                      {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.inclusao}
                        </td>
                      )}

                      {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.vencimento}
                        </td>
                      )}

                      {activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-800 font-medium whitespace-nowrap">
                          {r.valor}
                        </td>
                      )}

                      {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-700">
                          {r.credor}
                        </td>
                      )}

                      {activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                          {r.cidade}
                        </td>
                      )}

                      {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                        <td className="py-2.5 pr-4 text-gray-600">
                          {r.origem}
                        </td>
                      )}

                      {activeGroup !== "CCF" && (
                        <td className="py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRowKey((prev) =>
                                prev === rowKey ? null : rowKey,
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                            aria-label={
                              isRowExpanded
                                ? "Recolher detalhes"
                                : "Expandir detalhes"
                            }
                          >
                            <ChevronDown
                              size={13}
                              className={`transition-transform ${isRowExpanded ? "rotate-180" : "rotate-0"}`}
                            />
                          </button>
                        </td>
                      )}
                    </tr>

                    {activeGroup !== "CCF" && (
                      <tr
                        className={`bg-gray-50/50 transition-all ${
                          isRowExpanded
                            ? "border-b border-gray-50 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            : "border-b border-transparent duration-300 ease-in-out"
                        }`}
                      >
                        <td colSpan={detailColSpan} className="p-0">
                          <div
                            className={`overflow-hidden transition-[max-height,opacity] ${
                              isRowExpanded
                                ? "max-h-40 opacity-100 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                : "max-h-0 opacity-0 duration-300 ease-in-out"
                            }`}
                          >
                            <div
                              className={`grid grid-cols-2 gap-3 px-3 py-3 transition-all md:grid-cols-3 ${
                                isRowExpanded
                                  ? "translate-y-0 opacity-100 duration-500 delay-75"
                                  : "-translate-y-1 opacity-0 duration-200"
                              }`}
                            >
                              {detailFields.map((field) => (
                                <div
                                  key={`${rowKey}-${field.label}`}
                                  className="min-w-0"
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    {field.label}
                                  </p>
                                  <p className="truncate text-xs text-gray-700">
                                    {field.value || "-"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {!expanded && remaining > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-3 text-xs font-medium transition-colors"
              style={{ color: "#243871" }}
            >
              Exibir mais {remaining}{" "}
              {remaining === 1 ? "registro" : "registros"}
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

          {shouldShowChart && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Variação de Endividamento
                </p>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 55 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F3F4F6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="data"
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={65}
                    tickMargin={8}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      `R$ ${v.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`
                    }
                    width={80}
                  />

                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `R$ ${v.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`,
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
          )}
        </div>

        {alertas.length ? (
          <div
            id="section-alertas"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
          >
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Alertas
            </h2>
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

        <div
          id="section-cadastrais"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Informações Cadastrais
          </h2>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="dados-pessoais" className="border-gray-100">
              <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                Dados Cadastral
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
                  {[
                    {
                      label: spcData?.consumidor?.cpf
                        ? "Nome completo"
                        : "Razão Social",
                      value: spcData?.consumidor?.cpf
                        ? spcData?.consumidor?.nome
                        : spcData?.consumidor?.["razao-social"],
                    },
                    {
                      label: spcData?.consumidor?.cpf ? "CPF" : "CNPJ",
                      value: spcData?.consumidor?.cpf
                        ? formatCPF(spcData?.consumidor?.cpf)
                        : formatCNPJ(spcData?.consumidor?.cnpj),
                    },
                    {
                      label: spcData?.consumidor?.cpf
                        ? "Data de nascimento"
                        : "Data de fundação",
                      value: spcData?.consumidor?.cpf
                        ? formatDate(spcData?.consumidor?.["data-nascimento"])
                        : formatDate(spcData?.consumidor?.["data-fundacao"]),
                    },
                    ...(spcData?.consumidor?.cpf
                      ? [
                          { label: "Sexo", value: spcData?.consumidor?.sexo },
                          {
                            label: "Nacionalidade",
                            value: !Boolean(
                              spcData?.consumidor?.["pessoa-estrangeira"],
                            )
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
                        ]
                      : [
                          {
                            label: "CNAE",
                            value:
                              spcData?.["atividade-empresa"]?.[
                                "detalhe-atividade-empresa"
                              ]?.["ramo-atividade"]?.code,
                          },
                          {
                            label: "Descrição do CNAE",
                            value:
                              spcData?.["atividade-empresa"]?.[
                                "detalhe-atividade-empresa"
                              ]?.["ramo-atividade"]?.description,
                          },
                        ]),
                  ].map((f) => {
                    const COPYABLE_FIELDS = new Set([
                      "Nome completo",
                      "Razão Social",
                      "CPF",
                      "CNPJ",
                      "CNAE",
                      "Descrição do CNAE",
                    ]);
                    return (
                      <div key={f.label}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                          {f.label}
                        </p>

                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-800">
                            {f.value || "–"}
                          </p>

                          {COPYABLE_FIELDS.has(f.label) && f.value && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(String(f.value), f.label)
                              }
                              className="shrink-0 text-gray-400 transition-colors hover:cursor-pointer hover:text-[#243871]"
                              title={`Copiar ${f.label}`}
                              aria-label={`Copiar ${f.label}`}
                            >
                              {copiedField === f.label ? (
                                <Check size={14} aria-hidden="true" />
                              ) : (
                                <Copy size={14} aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

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
                      value: spcData?.consumidor?.cpf
                        ? formatPhone(spcData?.consumidor?.["telefone-celular"])
                        : formatPhone(spcData?.consumidor?.telefone),
                    },
                    ...(spcData?.consumidor?.cpf
                      ? [
                          {
                            label: "Telefone secundário",
                            value: formatPhone(
                              spcData?.consumidor?.["telefone-residencial"],
                            ),
                          },
                        ]
                      : []),
                    { label: "E-mail", value: spcData?.consumidor?.email },
                    {
                      label: "CEP",
                      value: formatCEP(spcData?.consumidor?.endereco?.cep),
                    },
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

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800">{f.value}</p>

                        {[
                          "Telefone principal",
                          "Telefone secundário",
                          "E-mail",
                          "CEP",
                          "Logradouro",
                        ].includes(f.label) &&
                          f.value && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(String(f.value), f.label)
                              }
                              className="text-gray-400 hover:text-[#243871] transition-colors hover:cursor-pointer"
                              title={`Copiar ${f.label}`}
                            >
                              {copiedField === f.label ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}
                      </div>
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
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <table className="w-full text-xs table-fixed">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Endereço", "Email", "Tel. fixo", "Tel. Celular"].map(
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
                      {body.map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                        >
                          <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                            {row.endereco}
                          </td>

                          <td className="py-2.5 pr-4 text-sm text-gray-800">
                            {row.email}
                          </td>

                          <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                            {row.telefone}
                          </td>

                          <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                            {row.celular}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            {spcData?.consumidor?.cpf ? (
              <></>
            ) : (
              <AccordionItem
                value="atividades-economicas-secundarias-spc-brasil"
                className="border-gray-100 last:border-b-0"
              >
                <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                  Atividades Econômicas Secundarias - SPC Brasil
                </AccordionTrigger>

                <AccordionContent>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["CNAE", "DESCRIÇÃO CNAE"].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {spcData?.["atividade-empresa"]?.[
                          "detalhe-atividade-empresa"
                        ]?.["atividades-economicas-secundarias"].map(
                          (row, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                            >
                              <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                                {row.code}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800">
                                {row.description}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>

        {(() => {
          const consultas =
            spcData?.["consulta-realizada"]?.["detalhe-consulta-realizada"] ??
            [];

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

              <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl mb-5 overflow-hidden">
                {[
                  { valor: ultimos30, label: "Últimos 30 dias" },
                  { valor: ultimos60, label: "Últimos 60 dias" },
                  { valor: ultimos90, label: "Últimos 90 dias" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="flex flex-col items-center py-4"
                  >
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

                        <td className="py-2.5 pr-4 text-gray-600">
                          {r.cidade}
                        </td>
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
              label: "Score + Positivo",
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
              <span
                className="pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
                style={{ backgroundColor: "#243871" }}
              >
                {label}
              </span>

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
    </>
  );
}
