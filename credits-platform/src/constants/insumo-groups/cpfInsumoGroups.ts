import { ShieldCheck, HatGlasses, ShieldAlert, TrendingUp, Wallet, FileText } from "lucide-react";
import type { InsumoGroup } from "./types";

export const CPF_INSUMO_GROUPS: InsumoGroup[] = [
  {
    id: "risco-credito",
    title: "Score / Risco de Crédito",
    icon: ShieldCheck,
    items: [
      { id: "78", label: "Score 12 meses" },
      { id: "77", label: "Score 3 meses" },
      { id: "5228", label: "Score + Positivo" },
    ],
  },
  {
    id: "solucoes-antifraude",
    title: "Antifraude",
    icon: HatGlasses,
    items: [
      { id: "5264", label: "Alerta de CPF suspeito" },
      { id: "5262", label: "Alerta de Identidade à Fraude" },
    ],
  },
  {
    id: "restritivo",
    title: "Restritivo",
    icon: ShieldAlert,
    items: [
      { id: "5239", label: "Classificação de Risco dos Débitos Ativos" },
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
      { id: "5122", label: "Renda Presumida + Positivo" },
      { id: "5142", label: "Limite de Crédito Sugerido" },
      { id: "5194", label: "Comprometimento de Renda Mensal" },
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
