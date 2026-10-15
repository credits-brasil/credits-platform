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

export function QuickNavigationSection() {
  const items: QuickNavigationItem[] = [
    {
      id: "section-identificacao",
      icon: <User size={16} />,
      label: "Identificação",
    },
    {
      id: "section-score-positivo",
      icon: <BarChart2 size={16} />,
      label: "Score + Positivo",
    },
    {
      id: "section-cadastrais",
      icon: <ClipboardList size={16} />,
      label: "Dados Cadastrais",
    },
    {
      id: "section-antifraude",
      icon: <ShieldAlert size={16} />,
      label: "Antifraude",
    },
    {
      id: "section-negativos",
      icon: <AlertTriangle size={16} />,
      label: "Negativos Consolidados",
    },
    { id: "section-cadastro-positivo", icon: <BarChart2 size={16} />, label: "Cadastro Positivo" },
    { id: "section-capacidade-pagamento", icon: <BarChart2 size={16} />, label: "Capacidade de Pagamento" },
    { id: "section-operacoes-scr", icon: <ClipboardList size={16} />, label: "Operações SCR" },
    { id: "section-historico-scr", icon: <ClipboardList size={16} />, label: "Histórico SCR" },
    { id: "section-consultas", icon: <Search size={16} />, label: "Consultas Realizadas" },
  ];

  return (
    <div className="print:hidden fixed bottom-2 right-2 z-50 flex flex-col gap-2">
      {items.map(({ id, icon, label }) => (
        <div key={id} className="group flex items-center justify-end gap-2">
          <span
            className="pointer-events-none translate-x-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
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
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg active:scale-95"
            style={{ backgroundColor: "#ED884A" }}
            aria-label={label}
          >
            {icon}
          </button>
        </div>
      ))}
    </div>
  );
}
