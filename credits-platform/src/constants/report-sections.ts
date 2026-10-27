import type { PrintSection } from "@/components/PrintSectionsDialog";

/** Report sections in display order, keyed by the id of their DOM element. */
export const REPORT_SECTIONS: PrintSection[] = [
  { id: "section-identificacao", label: "Identificação" },
  { id: "section-score-positivo", label: "Score" },
  { id: "section-additional-scores", label: "Outros Scores" },
  { id: "section-cadastrais", label: "Dados Cadastrais" },
  { id: "section-governanca", label: "Governança" },
  { id: "section-negativos", label: "Negativos Consolidados" },
  { id: "section-antifraude", label: "Antifraude" },
  { id: "section-cadastro-positivo", label: "Comportamento Financeiro" },
  { id: "section-informacoes-positivas", label: "Informações Positivas" },
  { id: "section-capacidade-pagamento", label: "Capacidade de Pagamento" },
  { id: "section-operacoes-scr", label: "Operações SCR" },
  { id: "section-historico-scr", label: "Histórico SCR" },
  { id: "section-consultas", label: "Consultas Realizadas" },
];
