import { ScoreIndicator, AnimatedScoreIndicator } from "@/components/ScoreIndicator";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { PrintCover } from "@/components/PrintCover";
import { Eye, Search } from "lucide-react";
import {
  PercentageProgressIndicatorComponent,
} from "@/components";
import { ConsultasRealizadasSection } from "@/containers/SpcMaxiResultado/components/ConsultasRealizadasSection";
import { GovernancaSection } from "@/containers/SpcMaxiResultado/components/GovernancaSection";
import { HeaderSection } from "@/containers/SpcMaxiResultado/components/HeaderSection";
import { HistoricoOperacoesScrSection } from "@/containers/SpcMaxiResultado/components/HistoricoOperacoesScrSection";
import { InformacoesCadastraisSection } from "@/containers/SpcMaxiResultado/components/InformacoesCadastraisSection";
import { InformacoesPositivasSection } from "@/containers/SpcMaxiResultado/components/InformacoesPositivasSection";
import { QuickNavigationSection } from "@/containers/SpcMaxiResultado/components/QuickNavigationSection";
import { ReloadConfirmationDialog } from "@/containers/SpcMaxiResultado/components/ReloadConfirmationDialog";
import { ConsultarInsumoDialog } from "@/containers/SpcMaxiResultado/components/ConsultarInsumoDialog";
import { ResumoFinanceiroSection } from "@/containers/SpcMaxiResultado/components/ResumoFinanceiroSection";
import { ScrSummarySection } from "@/containers/SpcMaxiResultado/components/ScrSummarySection";
import { NegativosConsolidadosSection } from "@/containers/SpcMaxiResultado/components/NegativosConsolidadosSection";
import { AlertasSection } from "@/containers/SpcMaxiResultado/components/AlertasSection";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { getCompanyAge } from "@/utils/getCompanyAge";

const API_URL = import.meta.env.VITE_API_URL;

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
  | "fonte"
  | "data"
  | "cartorio";
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

function normalizeContactValues(values: unknown, fallback: string): string[] {
  if (!Array.isArray(values) || values.length === 0) return [fallback];

  return values.map((value) =>
    typeof value === "string" && value.trim().length > 0 ? value : "-",
  );
}

interface SpcMaxiRequest {
  document: string;
  typeDocument: "CPF" | "CNPJ";
  telefone?: string;
  insumos: string[];
  consultedAt?: string;
}

function getConsultationContext() {
  const storedCompany = localStorage.getItem("credits-platform-selected-company");
  const company = storedCompany ? JSON.parse(storedCompany) : null;
  const accessToken = localStorage.getItem("credits-platform-auth-token");

  if (!accessToken || !company?.id) {
    throw new Error("Sessão ou empresa selecionada não encontrada.");
  }

  return {
    companyId: company.id,
    authorization: `Bearer ${accessToken}`,
  };
}

function formatConsultaDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
    .format(date)
    .replace(", ", " às ");
}

const EXTRA_CONSULTATION_WINDOW_MS = 5 * 60 * 1000;

function isExtraConsultationExpired(value?: string): boolean {
  if (!value) return false;

  const consultedAt = new Date(value).getTime();
  return (
    !Number.isNaN(consultedAt) &&
    Date.now() - consultedAt >= EXTRA_CONSULTATION_WINDOW_MS
  );
}

function ExtraInsumoButton({
  label,
  consultingLabel,
  disabled = false,
  onConsultar,
}: {
  label: string;
  consultingLabel?: string;
  disabled?: boolean;
  onConsultar: () => void;
}) {
  const isConsulting = consultingLabel === label;

  return (
    <button
      type="button"
      onClick={onConsultar}
      disabled={Boolean(consultingLabel) || disabled}
      className="flex items-center gap-2 self-start rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      style={{ backgroundColor: "#C7D2FE", color: "#243871" }}
    >
      {isConsulting ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#243871] border-t-transparent" />
      ) : (
        <Search size={11} style={{ color: "#243871" }} />
      )}
      {isConsulting ? "Consultando..." : "Consultar"}
    </button>
  );
}

interface SpcMaxiResultadoPageProps {
  product?: {
    slug: string;
    name: string;
    endpoint: string;
    excludedInsumos?: string[];
    excludedInsumosByDocType?: Partial<Record<"CPF" | "CNPJ", string[]>>;
    defaultInsumos?: string[];
  };
}

export default function SpcMaxiResultadoPage({
  product,
}: SpcMaxiResultadoPageProps = {}) {
  const productKey = product?.slug ?? "325-spc-maxi";
  const productName = product?.name ?? "325 SPC MAXI";
  const endpoint = product?.endpoint ?? "/api/325-spc-maxi";
  const defaultInsumos = product?.defaultInsumos ?? [];
  const searchPath = `/credito-risco/${productKey}`;
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();

  // Subscribes to the cache entry so it isn't garbage-collected (default gcTime)
  // while this page is mounted without any other active observer, which was
  // causing an unwanted redirect back to the query screen after a few minutes.
  const { data: requestData } = useQuery<SpcMaxiRequest | undefined>({
    queryKey: [`${productKey}-request`],
    queryFn: () =>
      queryClient.getQueryData<SpcMaxiRequest>([`${productKey}-request`]),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const excludedInsumos = [
    ...(product?.excludedInsumos ?? []),
    ...(requestData
      ? product?.excludedInsumosByDocType?.[requestData.typeDocument] ?? []
      : []),
  ];
  const canConsultInsumo = (id: string) =>
    !excludedInsumos.includes(id) && !defaultInsumos.includes(id);
  const getRequestedInsumos = (insumos: string[]) =>
    Array.from(new Set([
      ...insumos.filter(canConsultInsumo),
      "5228",
    ]));

  const [extraConsultationExpired, setExtraConsultationExpired] = useState(() =>
    isExtraConsultationExpired(requestData?.consultedAt),
  );

  useEffect(() => {
    if (!requestData?.consultedAt) {
      setExtraConsultationExpired(false);
      return;
    }

    const consultedAt = new Date(requestData.consultedAt).getTime();
    if (Number.isNaN(consultedAt)) {
      setExtraConsultationExpired(false);
      return;
    }

    const remainingTime =
      consultedAt + EXTRA_CONSULTATION_WINDOW_MS - Date.now();

    if (remainingTime <= 0) {
      setExtraConsultationExpired(true);
      setPendingExtraInsumo(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setExtraConsultationExpired(true);
      setPendingExtraInsumo(null);
    }, remainingTime);

    return () => window.clearTimeout(timeoutId);
  }, [requestData?.consultedAt]);

  const {
    data: spcData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      productKey,
      requestData?.document,
      requestData?.typeDocument,
      requestData?.insumos,
    ],

    queryFn: async () => {
      if (!requestData) {
        throw new Error("Parâmetros da consulta não encontrados.");
      }

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getConsultationContext().authorization,
          },
          body: JSON.stringify({
            companyId: getConsultationContext().companyId,
            document: requestData.document,
            typeDocument: requestData.typeDocument,
            telefone: product ? undefined : requestData.telefone,
            insumos: product
              ? getRequestedInsumos(requestData.insumos).map(Number)
              : getRequestedInsumos(requestData.insumos),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || `Erro ao realizar a consulta ${productName}.`,
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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  const initialScoreInsumos = useRef(
    (requestData?.insumos ?? []).map(String),
  );
  const hasSelectedInsumos = initialScoreInsumos.current.length > 0;
  const selectedScoreIds = ["5228", "78", "77", "5229", "5247"].filter((id) =>
    initialScoreInsumos.current.includes(id) && !excludedInsumos.includes(id),
  );
  const selectedPrimaryScoreId = selectedScoreIds[0] ?? "5228";
  const primaryScores: Record<string, { label: string; value: unknown; probability?: unknown }> = {
    "5228": { label: "Score + Positivo", value: spcData?.["score-cadastro-positivo"]?.["detalhe-score-cadastro-positivo"]?.score, probability: spcData?.["score-cadastro-positivo"]?.["detalhe-score-cadastro-positivo"]?.probabilidadeInadimplencia },
    "78": { label: "Score 12 meses", value: spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.score, probability: spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.probabilidade },
    "77": { label: "Score 3 meses", value: spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.score, probability: spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.probabilidade },
    "5229": { label: "Score PJ", value: spcData?.["score-pj"]?.["detalhe-score-pj"]?.score },
    "5247": { label: "Score PJ MEI", value: spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]?.score },
  };
  const primaryScore = primaryScores[selectedPrimaryScoreId];
  const primaryScoreValue = primaryScore.value == null || String(primaryScore.value).trim() === ""
    ? NaN
    : Number(primaryScore.value);
  const hasPositiveScore = Number.isFinite(primaryScoreValue);
  const [scoreRevealed, setScoreRevealed] = useState(() =>
    initialScoreInsumos.current.some((id) => ["5228", "78", "77", "5229", "5247"].includes(id)),
  );
  const [animatedPositiveScore, setAnimatedPositiveScore] = useState(0);
  const positiveScoreTarget = Number.isFinite(primaryScoreValue)
    ? Math.min(Math.max(primaryScoreValue, 0), 1000)
    : 0;

  useEffect(() => {
    setAnimatedPositiveScore(0);
    if (!scoreRevealed) return;

    const start = performance.now();
    let frameId = 0;
    const animate = (now: number) => {
      const progress = Math.min(Math.max((now - start) / 900, 0), 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedPositiveScore(positiveScoreTarget * easedProgress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [scoreRevealed, positiveScoreTarget]);

  const [activeGroup, setActiveGroup] = useState("SPC");
  const [expanded, setExpanded] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [consultasExpanded, setConsultasExpanded] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingExtraInsumo, setPendingExtraInsumo] = useState<{
    label: string;
    insumoId: string;
  } | null>(null);
  const [consultingExtraInsumo, setConsultingExtraInsumo] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [extraInsumoErrorLabel, setExtraInsumoErrorLabel] = useState<
    string | null
  >(null);
  const [unavailableExtraInsumos, setUnavailableExtraInsumos] = useState<
    string[]
  >([]);
  const extraInsumoErrorMessage = "Não há dados disponíveis.";
  const hasExtraInsumoInProgress = Boolean(
    pendingExtraInsumo || consultingExtraInsumo,
  );

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
    navigate(searchPath);
  };

  const openExtraInsumoConfirmation = (item: {
    label: string;
    insumoId: string;
  }) => {
    if (
      extraConsultationExpired ||
      hasExtraInsumoInProgress ||
      !canConsultInsumo(item.insumoId)
    ) {
      return;
    }
    setPendingExtraInsumo(item);
  };

  const handleConfirmExtraInsumo = () => {
    if (!pendingExtraInsumo || extraConsultationExpired) return;

    const item = pendingExtraInsumo;
    setPendingExtraInsumo(null);
    void handleConsultarInsumoExtra(item);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
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

  const dadosAdicionaisContato =
    spcData?.["dados-adicionais-contato"] ??
    spcData?.["dados-adicionais-de-contato"];
  const detalhesContato =
    dadosAdicionaisContato?.["detalhe-dados-adicionais-de-contato"] ??
    dadosAdicionaisContato?.["detalhe-dados-adicionais-contato"];

  const body = Array.isArray(detalhesContato)
    ? detalhesContato
        .filter((row) => row && typeof row === "object" && !Array.isArray(row))
        .flatMap((row) => {
          const enderecos = normalizeContactValues(
            [row.enderecosPF, row.enderecosPJ].find(
              (values) => Array.isArray(values) && values.length > 0,
            ),
            row.endereco ?? row["endereco-completo"] ?? "-",
          );
          const emails = normalizeContactValues(row.emails, row.email ?? "-");
          const telefones = normalizeContactValues(
            row.telefones,
            row.telefone ?? "-",
          );
          const celulares = normalizeContactValues(
            row.celulares,
            row.celular ?? row["telefone-celular"] ?? "-",
          );
          const rowCount = Math.max(
            enderecos.length,
            emails.length,
            telefones.length,
            celulares.length,
          );

          return Array.from({ length: rowCount }, (_, index) => ({
            endereco: enderecos[index] ?? "-",
            email: emails[index] ?? "-",
            telefone: telefones[index] ?? "-",
            celular: celulares[index] ?? "-",
          }));
        })
    : [];

     console.log("body", body)

  const situacao = String(
    (spcData?.consumidor?.cpf
      ? spcData?.consumidor?.["situacao-cpf"]?.description
      : spcData?.consumidor?.["situacao-cnpj"]?.description) ?? "",
  ).trim();

  const situacaoNormalizada = situacao.toUpperCase();
  const isPendenteRegularizacao = situacaoNormalizada === "PENDENTE DE REGULARIZACAO";
  const isRegular = ["REGULAR", "ATIVO", "ATIVA"].includes(situacaoNormalizada);

  const GROUPS = [
    {
      key: "SPC",
      label: "SPC",
      count: Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0),
      valor: formatCurrency(spcData?.spc?.resumo?.["valor-total"]),
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
      valor: formatCurrency(
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
      valor: formatCurrency(spcData?.protesto?.resumo?.["valor-total"]),
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
    spcData?.spc?.["detalhe-spc"]?.map((item: any) => ({
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
      (item: any) => ({
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
    spcData?.protesto?.["detalhe-protesto"]?.map((item: any) => ({
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

    const grouped: Record<string, { data: string; valor: number }> = {};
    records.forEach((item: any) => {
      const data = item.vencimento || item.inclusao || item.data;
      const valor = parseBRValue(String(item.valor ?? ""));
      if (!data || !parseBRDate(data) || !Number.isFinite(valor)) return;
      grouped[data] ??= { data, valor: 0 };
      grouped[data].valor += valor;
    });
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
  const alertaDocumento =
    spcData?.["alerta-documento"]?.["detalhe-alerta-documento"]?.[0];
  const participacaoMercadoCapitais =
    spcData?.["insumo-participacao-mercado-capitais"]?.[
      "detalhe-insumo-participacao-mercado-capitais"
    ];
  const participaMercadoCapitaisRaw =
    participacaoMercadoCapitais?.["participante-mercado-capital"];
  const participaMercadoCapitais =
    participaMercadoCapitaisRaw === true ||
    String(participaMercadoCapitaisRaw).toLowerCase() === "true";

  const alertas = [
    ...(participacaoMercadoCapitais
      ? [
          {
            severidade: participaMercadoCapitais ? "medio" : "baixo",
            titulo: "Participação no Mercado de Capitais",
            descricao: participaMercadoCapitais
              ? "Há participação registrada no mercado de capitais."
              : "Não há participação registrada no mercado de capitais.",
            fonte: "SPC Brasil",
            tipo: "Mercado de Capitais",
          },
        ]
      : []),
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
    ...(alertaDocumento
      ? [
          {
            severidade: "alto",
            titulo: "Alerta de documento",
            descricao: "Foi identificado um alerta de documento na consulta.",
            fonte: alertaDocumento?.["entidade-origem"] ?? "SPC Brasil",
            tipo: alertaDocumento?.["tipo-documento-alerta"] ?? "Documento",
            detalhes: [
              {
                label: "Data Inclusão",
                value: formatDate(alertaDocumento?.["data-inclusao"]),
              },
              {
                label: "Data Ocorrência",
                value: formatDate(alertaDocumento?.["data-ocorrencia"]),
              },
              {
                label: "Motivo",
                value: alertaDocumento?.motivo ?? "-",
              },
            ],
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
            tipo: spcData?.consumidor?.cpf ? "CPF" : "CNPJ",
          },
        ]
      : []),
  ];

  const resumoTabela = (() => {
    const datas = base
      .map((item: any) => item.inclusao || item.data || item.vencimento)
      .filter((data: string) => Boolean(parseBRDate(data)))
      .sort((a: string, b: string) => parseBRDate(a) - parseBRDate(b));
    const valores = base
      .map((item: any) => parseBRValue(String(item.valor ?? "")))
      .filter(Number.isFinite);
    return {
      count: base.length,
      valor: valores.length ? formatCurrency(valores.reduce((total: number, value: number) => total + value, 0)) : "?",
      antiga: datas[0] ?? "-",
      recente: datas.at(-1) ?? "-",
    };
  })();

  useEffect(() => {
    if (!requestData) {
      navigate(searchPath);
    }
  }, [navigate, requestData]);

  if (!requestData) {
    return null;
  }

  const isPessoaFisica = Boolean(spcData?.consumidor?.cpf);
  const idade = isPessoaFisica
    ? String(spcData?.consumidor?.idade ?? "").trim()
    : getCompanyAge(spcData?.consumidor?.["data-fundacao"]);
  const idadeText = idade !== "" && idade !== "-" ? `${idade} anos` : "";
  const sexoText = isPessoaFisica
    ? String(spcData?.consumidor?.sexo ?? "").trim()
    : "";
  const localizacaoText = [
    spcData?.consumidor?.endereco?.cidade,
    spcData?.consumidor?.endereco?.estado,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join("/");
  const metadataText = [idadeText, sexoText, localizacaoText]
    .filter(Boolean)
    .join(" · ");

  const scoreCadastroPositivoRaw = spcData?.["score-cadastro-positivo"]?.["detalhe-score-cadastro-positivo"]?.score;
  const scoreCadastroPositivo = scoreCadastroPositivoRaw == null || String(scoreCadastroPositivoRaw).trim() === ""
    ? NaN
    : Number(scoreCadastroPositivoRaw);
  const score12MesesRaw =
    spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.score;
  const score12Meses = score12MesesRaw == null || String(score12MesesRaw).trim() === ""
    ? NaN
    : Number(score12MesesRaw);
  const score3Meses = Number(
    spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.score,
  );
  const scorePj = Number(spcData?.["score-pj"]?.["detalhe-score-pj"]?.score);
  const scorePjMei = Number(
    spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]?.score,
  );
  const scoreCandidates = [
    {
      source: "cadastro",
      label: "Score + Positivo",
      score: scoreCadastroPositivo,
      probability: primaryScores["5228"].probability,
      insumoId: "5228",
      message:
        "Avalia o risco de crédito a partir do histórico de pagamentos e do comportamento financeiro do consumidor.\nCombina informações positivas e históricas para gerar uma análise mais completa do perfil de crédito.\nApoia decisões de concessão de crédito de forma mais segura e assertiva.",
    },
    {
      source: "12-meses",
      label: "Score 12 meses",
      score: score12Meses,
      probability: primaryScores["78"].probability,
      insumoId: "78",
      message:
        spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "3-meses",
      label: "Score 3 meses",
      score: score3Meses,
      probability: primaryScores["77"].probability,
      insumoId: "77",
      message:
        spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "pj",
      label: "Score PJ",
      score: scorePj,
      insumoId: "5229",
      message:
        spcData?.["score-pj"]?.["detalhe-score-pj"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "pj-mei",
      label: "Score PJ MEI",
      score: scorePjMei,
      insumoId: "5247",
      message:
        spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
  ].filter((candidate) =>
    !excludedInsumos.includes(candidate.insumoId) &&
    (candidate.source !== "cadastro" || scoreRevealed),
  );

  const remainingScoreCandidates = scoreCandidates.filter((candidate) =>
    selectedScoreIds.slice(1).includes(candidate.insumoId),
  );
  const scoreGridClassName = remainingScoreCandidates.length > 1
    ? "md:grid-cols-2"
    : "grid-cols-1";

  const getScoreColor = (value: number) => {
    if (value >= 675) return "#259f58";
    if (value >= 467) return "#ffca39";
    return "#f6a020";
  };

  const rendaPresumidaValue = isPessoaFisica
    ? spcData?.["renda-presumida-spc"]?.resumo?.["valor-total"]
    : (spcData?.["faturamento-presumido"]?.["detalhe-faturamento-presumido"]?.[
        "valor-faturamento"
      ] ?? spcData?.["faturamento-presumido"]?.resumo?.["valor-total"]);

  const limiteSugeridoValue = isPessoaFisica
    ? spcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"]
    : spcData?.["limite-credito-pj"]?.["detalhe-limite-credito-pj"]?.[
        "valor-limite-credito"
      ];

  const gastoEstimadoPjValue = isPessoaFisica
    ? null
    : (spcData?.["gasto-estimado-pj"]?.["detalhe-gasto-estimado-pj"]?.[
        "valor"
      ] ?? spcData?.["gasto-estimado-pj"]?.resumo?.["valor-total"]);

  const quantidadeFuncionariosValue = isPessoaFisica
    ? null
    : spcData?.["quantidade-funcionario"]?.resumo?.["quantidade-total"];

  const limiteSugeridoIndisponivel = Boolean(
    spcData?.["limite-credito-sugerido"] &&
    Array.isArray(
      spcData?.["limite-credito-sugerido"]?.["detalhe-limite-credito-sugerido"],
    ) &&
    spcData?.["limite-credito-sugerido"]?.resumo?.["quantidade-total"] &&
    !spcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"] &&
    !spcData?.["limite-credito-sugerido"]?.[
      "detalhe-limite-credito-sugerido"
    ]?.some(
      (item: any) =>
        item?.["valor-limite-credito"] !== undefined ||
        item?.valor !== undefined,
    ),
  );

  const hasUsableExtraInsumoResponse = (
    label: string,
    nextSpcData: Record<string, any>,
  ) => {
    switch (label) {
      case "Renda Presumida":
        return Boolean(
          nextSpcData?.["renda-presumida-spc"]?.resumo?.["valor-total"] ||
          nextSpcData?.["renda-presumida-spc"]?.[
            "detalhe-renda-presumida-spc"
          ]?.some(
            (item: any) =>
              item?.["valor-renda"] !== undefined || item?.valor !== undefined,
          ),
        );
      case "Limite Sugerido":
        return Boolean(
          nextSpcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"] ||
          nextSpcData?.["limite-credito-sugerido"]?.[
            "detalhe-limite-credito-sugerido"
          ]?.some(
            (item: any) =>
              item?.["valor-limite-credito"] !== undefined ||
              item?.valor !== undefined,
          ),
        );
      case "Comprometimento":
        return Boolean(
          nextSpcData?.["comprometimento-renda-mensal-pf"]?.[
            "detalhe-comprometimento-renda-mensal-pf"
          ]?.faixa ||
          nextSpcData?.["comprometimento-renda-mensal-pf"]?.resumo?.[
            "valor-total"
          ],
        );
      case "Alerta de Identidade à Fraude":
        return Boolean(
          nextSpcData?.["alerta-identidade-fraude"]?.[
            "detalhe-alerta-identidade-fraude"
          ]?.some(
            (item: any) =>
              item?.["alerta-fraude"] !== undefined ||
              item?.["tipo-alerta"] !== undefined ||
              item?.descricao !== undefined,
          ),
        );
      case "Operações no SCR":
        return Boolean(
          nextSpcData?.["insumo-operacao-scr"]?.["detalhe-insumo-operacao-scr"],
        );
      case "Pontualidade de Pagamento":
        return Boolean(
          nextSpcData?.["indice-pontualidade-pagamento-cadastro-positivo"]?.[
            "detalhe-indice-pontualidade-pagamento-cadastro-positivo"
          ],
        );
      case "Comportamento de Gastos":
        return Boolean(
          nextSpcData?.["indice-comportamento-gastos-cadastro-positivo"]?.[
            "detalhe-indice-comportamento-gastos-cadastro-positivo"
          ],
        );
      default:
        return true;
    }
  };

  const handleConsultarInsumoExtra = async (item: {
    label: string;
    insumoId?: string;
  }) => {
    if (!requestData || extraConsultationExpired) return;

    const insumoId =
      item.insumoId ??
      {
        "Renda Presumida": "5122",
        "Limite Sugerido": "5142",
        Comprometimento: "5194",
        "Alerta de Identidade à Fraude": "5262",
      }[item.label];

    if (!insumoId || !canConsultInsumo(insumoId)) return;

    const nextInsumos = getRequestedInsumos([...requestData.insumos, insumoId]);

    setConsultingExtraInsumo({ id: insumoId, label: item.label });
    setExtraInsumoErrorLabel(null);
    setUnavailableExtraInsumos((prev) =>
      prev.includes(item.label)
        ? prev
        : prev.filter((label) => label !== item.label),
    );

    try {
      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getConsultationContext().authorization,
          },
          body: JSON.stringify({
            companyId: getConsultationContext().companyId,
            document: requestData.document,
            typeDocument: requestData.typeDocument,
            telefone: product ? undefined : requestData.telefone,
            insumos: product ? nextInsumos.map(Number) : nextInsumos,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(extraInsumoErrorMessage);
      }

      const nextSpcData = payload?.spc ?? payload;
      const hasUsableData =
        nextSpcData &&
        typeof nextSpcData === "object" &&
        hasUsableExtraInsumoResponse(item.label, nextSpcData);

      if (!hasUsableData) {
        setUnavailableExtraInsumos((prev) =>
          prev.includes(item.label) ? prev : [...prev, item.label],
        );
        throw new Error(extraInsumoErrorMessage);
      }

      setUnavailableExtraInsumos((prev) =>
        prev.filter((label) => label !== item.label),
      );

      const nextRequest = {
        ...requestData,
        insumos: nextInsumos,
      };

      queryClient.setQueryData([`${productKey}-request`], nextRequest);
      queryClient.setQueryData(
        [
          productKey,
          nextRequest.document,
          nextRequest.typeDocument,
          nextInsumos,
        ],
        nextSpcData,
      );
      queryClient.invalidateQueries({ queryKey: [productKey] });
    } catch (error) {
      setUnavailableExtraInsumos((prev) =>
        prev.includes(item.label) ? prev : [...prev, item.label],
      );
      setExtraInsumoErrorLabel(item.label);
    } finally {
      setConsultingExtraInsumo(null);
    }
  };

  const resumoFinanceiroItens = [
    {
      label: isPessoaFisica ? "Renda Presumida" : "Faturamento Presumido",
      insumoId: isPessoaFisica ? "5122" : "5178",
      value: rendaPresumidaValue ? formatCurrency(rendaPresumidaValue) : "",
    },
    {
      label: isPessoaFisica ? "Limite Sugerido" : "Limite de Crédito PJ",
      insumoId: isPessoaFisica ? "5142" : "5179",
      value: limiteSugeridoValue ? formatCurrency(limiteSugeridoValue) : "",
    },
    ...(isPessoaFisica
      ? [
          {
            label: "Comprometimento",
            insumoId: "5194",
            value:
              spcData?.["comprometimento-renda-mensal-pf"]?.[
                "detalhe-comprometimento-renda-mensal-pf"
              ]?.faixa ?? "",
          },
          {
            label: "Alerta de Identidade à Fraude",
            insumoId: "5262",
            value:
              spcData?.["alerta-identidade-fraude"]?.[
                "detalhe-alerta-identidade-fraude"
              ]?.[0]?.["alerta-fraude"] === "true" ? (
                <span
                  className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                  }}
                >
                  Alerta ativo
                </span>
              ) : spcData?.["alerta-identidade-fraude"]?.[
                  "detalhe-alerta-identidade-fraude"
                ]?.[0]?.["alerta-fraude"] === "false" ? (
                <span
                  className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "#DCFCE7",
                    color: "#15803D",
                  }}
                >
                  Sem alertas
                </span>
              ) : (
                ""
              ),
          },
        ]
      : [
          {
            label: "Gasto Estimado PJ",
            insumoId: "5185",
            value: gastoEstimadoPjValue
              ? formatCurrency(gastoEstimadoPjValue)
              : "",
          },
          {
            label: "Quantidade de Funcionários",
            insumoId: "5267",
            value:
              quantidadeFuncionariosValue !== undefined &&
              quantidadeFuncionariosValue !== null
                ? Number(quantidadeFuncionariosValue ?? 0).toLocaleString(
                    "pt-BR",
                  )
                : "",
          },
        ]),
  ].filter((item) => !excludedInsumos.includes(item.insumoId));

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
    const dados = spcData?.["insumo-operacao-scr"] ?? {};
    const detalhes = dados?.["detalhe-insumo-operacao-scr"] ?? [];
    const primeiro = (Array.isArray(detalhes) ? detalhes[0] : detalhes) ?? {};

    return {
      quantidade: primeiro?.quantidade ?? "0",
      resumoQuantidadeTotal: primeiro?.quantidade ?? "0",
      "data-inicio-relacionamento":
        primeiro?.["data-inicio-relacionamento"] ?? null,
      "valor-total-contratado-inicial": Number(
        primeiro?.["valor-total-contratado-inicial"] ?? 0,
      ),
      "valor-total-contratado-final": Number(
        primeiro?.["valor-total-contratado-final"] ?? 0,
      ),
      "quantidade-instituicao-scr":
        primeiro?.["quantidade-instituicao-scr"] ?? null,
    };
  })();

  const historicoScrScoreData =
    spcData?.["insumo-historico-operacao-scr"]?.[
      "detalhe-insumo-historico-operacao-scr"
    ];

  const hasScrData = spcData?.["insumo-operacao-scr"];
  const hasComportamentoFinanceiroData =
    Boolean(hasPontualidadeData) ||
    Boolean(hasComprometimentoData) ||
    Boolean(hasScrData) ||
    Boolean(historicoScrScoreData);




  console.log("spcData", spcData);
  console.log("spcData?.consumidor", spcData?.consumidor);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#243871]" />

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Consultando {productName}
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
              : "Não há dados disponíveis."}
          </p>

          <button
            type="button"
            onClick={() => navigate(searchPath)}
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
      <ReloadConfirmationDialog
        open={showRedirectModal}
        onOpenChange={setShowRedirectModal}
        onCancel={handleCancelReload}
        onConfirm={handleConfirmReload}
      />

      <ConsultarInsumoDialog
        open={Boolean(pendingExtraInsumo)}
        label={pendingExtraInsumo?.label}
        disabled={extraConsultationExpired}
        onOpenChange={(open) => {
          if (!open) setPendingExtraInsumo(null);
        }}
        onCancel={() => setPendingExtraInsumo(null)}
        onConfirm={handleConfirmExtraInsumo}
      />

      <div className="w-full" data-print-document>
        <PrintCover />

        <HeaderSection
          productName={productName}
          protocol={spcData?.protocolo?.numero ?? ""}
          dateTime={formatConsultaDateTime(requestData.consultedAt)}
          operator={spcData.operador?.nome ?? ""}
          documentLabel={
            spcData?.consumidor?.cpf
              ? `CPF: ${formatCPF(spcData?.consumidor?.cpf)}`
              : `CNPJ: ${formatCNPJ(spcData?.consumidor?.cnpj)}`
          }
          documentCopyValue={
            spcData?.consumidor?.cpf ?? spcData?.consumidor?.cnpj
          }
          consumerName={
            spcData?.consumidor?.cpf
              ? spcData?.consumidor?.nome
              : spcData?.consumidor?.["razao-social"]
          }
          consumerNameCopyValue={
            spcData?.consumidor?.nome ?? spcData?.consumidor?.["razao-social"]
          }
          documentTypeLabel={spcData?.consumidor?.cpf ? "CPF" : "CNPJ"}
          situacao={situacao}
          isRegular={isRegular}
          isPendenteRegularizacao={isPendenteRegularizacao}
          metadataText={metadataText}
          onReload={handleOpenReloadModal}
          onNewQuery={() => navigate(searchPath)}
        />


        <div id="section-score-positivo" className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#243871" }}>{primaryScore.label}</h2>
          </div>

          <div className="grid grid-cols-[2fr_3fr_5fr] items-center gap-8">
            <div className="relative isolate col-span-2">
              {!scoreRevealed && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setScoreRevealed(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#243871] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1b2b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#243871] focus-visible:ring-offset-2"
                  >
                    <Eye size={14} aria-hidden="true" />
                    Ver Score
                  </button>
                </div>
              )}
              {scoreRevealed && !hasPositiveScore && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <span className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-600">
                    Não há dados disponíveis
                  </span>
                </div>
              )}
                <div
                  className={`relative z-0 ${scoreRevealed && hasPositiveScore ? "" : "pointer-events-none select-none blur-[10px]"}`}
                  aria-hidden={!scoreRevealed || !hasPositiveScore}
                >
                  <ScoreIndicator score={primaryScoreValue} animatedScore={animatedPositiveScore} probability={primaryScore.probability} />

                </div>
            </div>
            {/* Financial indicators */}
            <div className="grid grid-cols-2 gap-1">
              {resumoFinanceiroItens.filter((item) => ["5122", "5178", "5142", "5179", "5194", "5185"].includes(item.insumoId)).map((item) => {
                const hasValue = item.value !== "" && item.value != null;
                const wasRequested = requestData.insumos.includes(item.insumoId) ||
                  defaultInsumos.includes(item.insumoId);
                const isUnavailable = unavailableExtraInsumos.includes(item.label) ||
                  (item.label === "Limite Sugerido" && limiteSugeridoIndisponivel) ||
                  (!hasValue && wasRequested);
                const title = item.label === "Limite Sugerido"
                  ? "Limite de Crédito Sugerido"
                  : item.label === "Comprometimento"
                    ? "Comprometimento de Renda"
                    : item.label;

                return (
                  <div
                    key={item.insumoId}
                    className={`${["5194", "5185"].includes(item.insumoId) ? "col-span-2 " : ""}rounded-lg border border-gray-100 bg-gray-50 p-3`}
                  >
                    <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
                    {isUnavailable ? (
                      <p className="mt-2 text-xs font-medium text-gray-500">N?o h? dados dispon?veis</p>
                    ) : hasValue ? (
                      <p className="mt-2 text-lg font-bold text-gray-600">{item.value}</p>
                    ) : (
                      <div className="relative isolate mt-2 min-h-7">
                        <p aria-hidden="true" className="relative z-0 pointer-events-none select-none text-lg font-bold text-gray-600 blur-[4px]">
                          {item.label === "Comprometimento" ? "00%" : "R$ 0.000,00"}
                        </p>
                        <div className="absolute inset-0 z-10 flex items-center justify-end">
                          <ExtraInsumoButton
                            label={item.label}
                            consultingLabel={consultingExtraInsumo?.label}
                            disabled={extraConsultationExpired || hasExtraInsumoInProgress || !canConsultInsumo(item.insumoId)}
                            onConsultar={() => openExtraInsumoConfirmation({ label: item.label, insumoId: item.insumoId })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {remainingScoreCandidates.length > 0 && (
          <div id="section-additional-scores" className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2">
            <div className={`grid items-center gap-6 ${scoreGridClassName}`}>
              {remainingScoreCandidates.map((scoreItem) => {
                if (!Number.isFinite(scoreItem.score)) {
                  return (
                    <div key={scoreItem.source} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-gray-700">{scoreItem.label}</p>
                      <p className="mt-2 text-xs text-gray-500">Não há dados disponíveis</p>
                    </div>
                  );
                }
                const value = Math.min(Math.max(scoreItem.score, 0), 1000);
                return (
                  <div key={scoreItem.source} className="min-w-0">
                    <h3 className="mb-4 text-sm font-semibold text-[#243871]">{scoreItem.label}</h3>
                    <AnimatedScoreIndicator score={value} probability={scoreItem.probability} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!excludedInsumos.includes("5256") && (
        <div id="section-operacoes-scr" className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700">Operações no SCR</h2>
            {hasScrData && !unavailableExtraInsumos.includes("Opera??es no SCR") ? (
            <div className="mt-4 grid grid-cols-4 divide-x divide-gray-100">
              <div className="pr-4">
                <h3 className="text-xs font-semibold text-gray-600">Quantidade</h3>
                <p className="mt-2 text-base font-bold text-gray-600">{scrOperacao.resumoQuantidadeTotal ?? scrOperacao.quantidade ?? "-"}</p>
              </div>
              <div className="px-4">
                <h3 className="text-xs font-semibold text-gray-600">Início de Relacionamento</h3>
                <p className="mt-2 text-base font-bold text-gray-600">{formatDate(String(scrOperacao["data-inicio-relacionamento"] ?? ""))}</p>
              </div>
              <div className="px-4">
                <h3 className="text-xs font-semibold text-gray-600">Valor Contratado</h3>
                <p className="mt-2 text-base font-bold text-gray-600">{formatCurrency(scrOperacao["valor-total-contratado-inicial"])} a {formatCurrency(scrOperacao["valor-total-contratado-final"])}</p>
              </div>
              <div className="pl-4">
                <h3 className="text-xs font-semibold text-gray-600">Instituições</h3>
                <p className="mt-2 text-base font-bold text-gray-600">{scrOperacao["quantidade-instituicao-scr"] ?? "-"}</p>
              </div>
            </div>
            ) : (
              <div className="mt-4">
                {defaultInsumos.includes("5256") || unavailableExtraInsumos.includes("Operações no SCR") ? (
                  <span className="text-xs font-semibold text-gray-500">Não há dados disponíveis</span>
                ) : (
                  <ExtraInsumoButton
                    label="Operações no SCR"
                    consultingLabel={consultingExtraInsumo?.label}
                    disabled={extraConsultationExpired || hasExtraInsumoInProgress || !canConsultInsumo("5256")}
                    onConsultar={() => openExtraInsumoConfirmation({ label: "Operações no SCR", insumoId: "5256" })}
                  />
                )}
              </div>
            )}
            {extraInsumoErrorLabel === "Operações no SCR" && (
              <p className="mt-4 text-xs text-red-700">{extraInsumoErrorMessage}</p>
            )}
          </div>
        )}

        {hasSelectedInsumos && (
          <>
        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Comportamento Financeiro
          </h2>

          <div className="flex items-stretch gap-4">
            <div className="flex h-full w-full flex-col justify-center self-stretch">
              {hasPontualidadeData &&
              !unavailableExtraInsumos.includes("Pontualidade de Pagamento") ? (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Pontualidade de Pagamento
                  </p>

                  <PercentageProgressIndicatorComponent
                    title="Pontualidade de Pagamento"
                    percentage={pontualidadePagamentoPercent}
                    barColor="#7EC8E3"
                    className="flex w-full flex-col justify-between rounded-lg bg-[#F8F9FB] shadow-none"
                  />
                </>
              ) : defaultInsumos.includes("5227") ||
                unavailableExtraInsumos.includes(
                  "Pontualidade de Pagamento",
                ) ? (
                <span className="inline-flex min-h-[65px] items-center rounded-lg bg-[#F8F9FB] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                  Não há dados disponíveis
                </span>
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Pontualidade de Pagamento
                  </p>

                  <div className="w-full">
                    <div className="flex items-center justify-center w-[20%] rounded-xl bg-slate-50 p-3">
                      <ExtraInsumoButton
                        label="Pontualidade de Pagamento"
                        consultingLabel={consultingExtraInsumo?.label}
                        disabled={
                          extraConsultationExpired || hasExtraInsumoInProgress
                        }
                        onConsultar={() =>
                          openExtraInsumoConfirmation({
                            label: "Pontualidade de Pagamento",
                            insumoId: "5227",
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex h-full w-full flex-col justify-center self-stretch">
              {hasComprometimentoData &&
              !unavailableExtraInsumos.includes("Comportamento de Gastos") ? (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {spcData?.consumidor?.cpf
                      ? "Comprometimento de Gastos"
                      : "Comportamento de Gastos"}
                  </p>

                  <PercentageProgressIndicatorComponent
                    title={
                      spcData?.consumidor?.cpf
                        ? "Comprometimento de Gastos"
                        : "Comportamento de Gastos"
                    }
                    percentage={comprometimentoGastos.percentual}
                    barColor="#5B8DB8"
                    className="flex w-full flex-col justify-between rounded-lg bg-[#F8F9FB] shadow-none"
                    footer={
                      <span className="text-[8px] text-gray-500">
                        Maior concentração:{" "}
                        <strong className="text-[8px] text-gray-700">
                          {comprometimentoGastos.nome}
                        </strong>
                      </span>
                    }
                  />
                </>
              ) : defaultInsumos.includes("5224") ||
                unavailableExtraInsumos.includes(
                  "Comportamento de Gastos",
                ) ? (
                <span className="inline-flex min-h-[65px] items-center rounded-lg bg-[#F8F9FB] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                  Não há dados disponíveis
                </span>
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {spcData?.consumidor?.cpf
                      ? "Comprometimento de Gastos"
                      : "Comportamento de Gastos"}
                  </p>

                  <div className="w-full">
                    <div className="flex items-center justify-center rounded-xl w-[20%] bg-slate-50 p-3">
                      <ExtraInsumoButton
                        label={
                          spcData?.consumidor?.cpf
                            ? "Comprometimento de Gastos"
                            : "Comportamento de Gastos"
                        }
                        consultingLabel={consultingExtraInsumo?.label}
                        disabled={
                          extraConsultationExpired || hasExtraInsumoInProgress
                        }
                        onConsultar={() =>
                          openExtraInsumoConfirmation({
                            label: spcData?.consumidor?.cpf
                              ? "Comprometimento de Gastos"
                              : "Comportamento de Gastos",
                            insumoId: "5224",
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {consultingExtraInsumo &&
            [
              "Pontualidade de Pagamento",
              "Comprometimento de Gastos",
              "Comportamento de Gastos",
            ].includes(consultingExtraInsumo.label) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

          {extraInsumoErrorLabel &&
            ["Pontualidade de Pagamento", "Comportamento de Gastos"].includes(
              extraInsumoErrorLabel,
            ) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
        </div>

        {/* {!excludedInsumos.includes("5256") && (
          <div
            id="section-score"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
          >
            <h2 className="text-sm font-semibold text-gray-700 mb-4">SCR</h2>

            <div className="h-full min-w-0 w-full">
              <ScrSummarySection
                hasScrData={Boolean(hasScrData)}
                scrOperacao={scrOperacao}
                onConsultar={
                  canConsultInsumo("5256")
                    ? () =>
                        handleConsultarInsumoExtra({
                          label: "Operações no SCR",
                          insumoId: "5256",
                        })
                    : undefined
                }
                isConsulting={consultingExtraInsumo?.label === "Operações no SCR"}
                consultationDisabled={
                  extraConsultationExpired || hasExtraInsumoInProgress
                }
                isUnavailable={
                  (!hasScrData && defaultInsumos.includes("5256")) ||
                  unavailableExtraInsumos.includes("Operações no SCR")
                }
              />
            </div>

            {consultingExtraInsumo?.label === "Operações no SCR" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

            {extraInsumoErrorLabel === "Operações no SCR" && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
          </div>
        )} */}

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Resumo Financeiro
          </h2>

          <ResumoFinanceiroSection
            items={resumoFinanceiroItens}
            onConsultar={handleConsultarInsumoExtra}
            isConsulting={Boolean(consultingExtraInsumo)}
            loadingItemLabel={consultingExtraInsumo?.label ?? null}
            unavailableLabels={[
              ...unavailableExtraInsumos,
              ...(limiteSugeridoIndisponivel ? ["Limite Sugerido"] : []),
            ]}
            consultationDisabled={
              extraConsultationExpired || hasExtraInsumoInProgress
            }
          />

          {consultingExtraInsumo &&
            resumoFinanceiroItens.some(
              (item) => item.label === consultingExtraInsumo.label,
            ) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

          {extraInsumoErrorLabel &&
            resumoFinanceiroItens.some(
              (item) => item.label === extraInsumoErrorLabel,
            ) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
        </div>

        <NegativosConsolidadosSection
          groups={GROUPS}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          expanded={expanded}
          setExpanded={setExpanded}
          resumoTabela={resumoTabela}
          visible={visible}
          remaining={remaining}
          shouldShowChart={shouldShowChart}
          chartData={chartData}
          handleSort={handleSort}
          sortKey={sortKey}
          sortDir={sortDir}
          expandedRowKey={expandedRowKey}
          setExpandedRowKey={setExpandedRowKey}
          spcData={spcData}
        />

        <AlertasSection alertas={alertas} />

        <InformacoesCadastraisSection spcData={spcData} body={body} />

        <GovernancaSection
          spcData={spcData}
          showParticipacaoEmpresa={!excludedInsumos.includes("24")}
        />

        <InformacoesPositivasSection spcData={spcData} />

        <ConsultasRealizadasSection
          spcData={spcData}
          consultasExpanded={consultasExpanded}
          setConsultasExpanded={setConsultasExpanded}
        />

        <HistoricoOperacoesScrSection
          spcData={spcData}
          scorePj={scorePj}
          getScoreColor={getScoreColor}
        />

        <QuickNavigationSection />
          </>
        )}
      </div>
    </>
  );
}
