import { ShieldCheck, Building2, TrendingUp, Wallet, FileText } from "lucide-react";
import type { InsumoGroup } from "./types";

export const CNPJ_INSUMO_GROUPS: InsumoGroup[] = [
  {
    id: "risco-credito",
    title: "Score / Risco de Crédito",
    icon: ShieldCheck,
    items: [
      { id: "5229", label: "Score PJ" },
      { id: "78", label: "Score 12 meses" },
      { id: "77", label: "Score 3 meses" },
      { id: "5247", label: "Score PJ MEI" },
    ],
  },
  {
    id: "cadastral",
    title: "Cadastral",
    icon: Building2,
    items: [
      { id: "5265", label: "Participação no Mercado de Capitais" },
      { id: "5267", label: "Quantidade de funcionários" },
      { id: "24", label: "Participação Empresa" },
      { id: "49", label: "Quadro administrativo" },
      { id: "23", label: "Controle Societário" },
      { id: "5186", label: "Quadro Social Mais Completo PJ" },
    ],
  },
  {
    id: "informacoes-positivas",
    title: "Informações do Cadastro Positivo",
    icon: TrendingUp,
    items: [
      { id: "5224", label: "Índice de Comportamento de Gastos" },
      { id: "5227", label: "Índice Pontualidade de Pagamento" },
    ],
  },
  {
    id: "capacidade-pagamento",
    title: "Capacidade de Pagamento",
    icon: Wallet,
    items: [
      { id: "5179", label: "Limite de Crédito PJ" },
      { id: "5185", label: "Gasto Financeiro Estimado PJ " },
      { id: "5178", label: "Faturamento Presumido" },
    ],
  },
  {
    id: "informacoes-scr",
    title: "SCR",
    icon: FileText,
    items: [
      { id: "5256", label: "Operações no SCR" },
      { id: "5257", label: "Histórico de Operações no SCR" },
    ],
  },
];
