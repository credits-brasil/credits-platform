import { useLayoutEffect, useState } from "react";
import {
  User,
  Search,
  ShieldAlert,
  BarChart2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

interface QuickNavigationItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export function QuickNavigationSection({
  showAdditionalScores = false,
  showFinancialBehavior = false,
  showGovernanca = false,
}: {
  showAdditionalScores?: boolean;
  showFinancialBehavior?: boolean;
  showGovernanca?: boolean;
}) {
  const [availableSectionIds, setAvailableSectionIds] = useState<string[]>([]);
  const items: QuickNavigationItem[] = [
    {
      id: "section-identificacao",
      icon: <User size={16} />,
      label: "Identificação",
    },
    {
      id: "section-score-positivo",
      icon: <BarChart2 size={16} />,
      label: "Score",
    },
    ...(showAdditionalScores ? [{ id: "section-additional-scores", icon: <BarChart2 size={16} />, label: "Outros Scores" }] : []),
    {
      id: "section-cadastrais",
      icon: <ClipboardList size={16} />,
      label: "Dados Cadastrais",
    },
    ...(showGovernanca ? [{ id: "section-governanca", icon: <ClipboardList size={16} />, label: "Governança" }] : []),
    {
      id: "section-negativos",
      icon: <AlertTriangle size={16} />,
      label: "Negativos Consolidados",
    },
    { id: "section-antifraude", icon: <ShieldAlert size={16} />, label: "Antifraude" },
    ...(showFinancialBehavior ? [
      { id: "section-cadastro-positivo", icon: <BarChart2 size={16} />, label: "Comportamento Financeiro" },
      { id: "section-informacoes-positivas", icon: <BarChart2 size={16} />, label: "Informações Positivas" },
    ] : []),
    { id: "section-capacidade-pagamento", icon: <BarChart2 size={16} />, label: "Capacidade de Pagamento" },
    { id: "section-operacoes-scr", icon: <ClipboardList size={16} />, label: "Operações SCR" },
    { id: "section-historico-scr", icon: <ClipboardList size={16} />, label: "Histórico SCR" },
    { id: "section-consultas", icon: <Search size={16} />, label: "Consultas Realizadas" },
  ];

  // Check after the layout is committed: some sections return null without data.
  useLayoutEffect(() => {
    const availableIds = items
      .filter(({ id }) => document.getElementById(id) !== null)
      .map(({ id }) => id);

    setAvailableSectionIds((previous) =>
      previous.length === availableIds.length &&
      previous.every((id, index) => id === availableIds[index])
        ? previous
        : availableIds,
    );
  });

  return (
    <div className="pointer-events-none print:hidden fixed bottom-2 right-2 z-50 flex flex-col gap-2">
      {items.filter(({ id }) => availableSectionIds.includes(id)).map(({ id, icon, label }) => (
        <div key={id} className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(id);
              if (el) {
                if (id === "section-identificacao") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }
                const identification = document.getElementById("section-identificacao");
                const offset = Math.max(68, identification?.getBoundingClientRect().height ?? 0);
                const y =
                  el.getBoundingClientRect().top + window.scrollY - offset - 16;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }}
            className="pointer-events-auto group relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg active:scale-95"
            style={{ backgroundColor: "#ED884A" }}
            aria-label={label}
          >
            {icon}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              style={{ backgroundColor: "#243871" }}
            >
              {label}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
