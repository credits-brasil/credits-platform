import { ShieldAlert } from "lucide-react";

export interface AlertaItem {
  titulo: string;
  severidade: "alto" | "medio" | "baixo" | "padrao";
  descricao: string;
  detalhes?: Array<{ label: string; value: string | number }>;
  fonte: string;
  tipo: string;
}

/** Text colors for the light cards; the dark "padrao" card needs its own. */
const LIGHT_CARD_TEXT = {
  title: "#1F2937",
  description: "#6B7280",
  value: "#374151",
  meta: "#9CA3AF",
};

interface AlertasSectionProps {
  alertas: AlertaItem[];
  sectionId?: string;
}

export function AlertasSection({ alertas, sectionId = "section-alertas" }: AlertasSectionProps) {
  if (!alertas.length) return null;

  return (
    <div
      id={sectionId}
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Alertas</h2>

      <div className="grid grid-cols-3 gap-3">
        {alertas.map((a, i) => {
          const cfg =
            a.severidade === "alto"
              ? {
                  bg: "#FEF2F2",
                  border: "#FECACA",
                  icon: "#DC2626",
                  badge: { bg: "#FEE2E2", color: "#DC2626" },
                  text: LIGHT_CARD_TEXT,
                }
              : a.severidade === "medio"
                ? {
                    bg: "#FFFBEB",
                    border: "#FDE68A",
                    icon: "#D97706",
                    badge: { bg: "#FEF3C7", color: "#D97706" },
                    text: LIGHT_CARD_TEXT,
                  }
                : a.severidade === "padrao"
                  ? {
                      // rgb(36, 56, 113)
                      bg: "#243871",
                      border: "#1B2B58",
                      icon: "#C7D2FE",
                      badge: { bg: "#1B2B58", color: "#E0E7FF" },
                      text: {
                        title: "#FFFFFF",
                        description: "#E0E7FF",
                        value: "#FFFFFF",
                        meta: "#A5B4FC",
                      },
                    }
                  : {
                      bg: "#F0FDF4",
                      border: "#BBF7D0",
                      icon: "#16A34A",
                      badge: { bg: "#DCFCE7", color: "#16A34A" },
                      text: LIGHT_CARD_TEXT,
                    };

          return (
            <div
              key={`${a.titulo}-${i}`}
              className="rounded-xl border p-4"
              style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert
                  size={18}
                  style={{ color: cfg.icon, flexShrink: 0, marginTop: 1 }}
                />

                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: cfg.text.title }}
                    >
                      {a.titulo}
                    </span>


                  </div>

                  <p
                    className="mb-2 text-xs"
                    style={{ color: cfg.text.description }}
                  >
                    {a.descricao}
                  </p>

                  {a.detalhes?.length ? (
                    <div className="mb-2 flex items-center justify-between gap-6">
                      {a.detalhes.map((detalhe) => (
                        <div key={`${a.titulo}-${detalhe.label}`}>
                          <p
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: cfg.text.description }}
                          >
                            {detalhe.label}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: cfg.text.value }}
                          >
                            {detalhe.value || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className="flex items-center gap-3 text-[11px]"
                    style={{ color: cfg.text.meta }}
                  >
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
  );
}
