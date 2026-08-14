import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GraphScoreComponent } from "@/components";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface HistoricoOperacoesScrSectionProps {
  spcData: any;
  scorePj: number;
  getScoreColor: (value: number) => string;
}

export function HistoricoOperacoesScrSection({
  spcData,
  scorePj,
  getScoreColor,
}: HistoricoOperacoesScrSectionProps) {
  const historicoScr =
    spcData?.["insumo-historico-operacao-scr"]?.[
      "detalhe-insumo-historico-operacao-scr"
    ];

  if (!historicoScr) return null;

  const grupoGarantia = historicoScr?.["grupo-garantia"] ?? [];
  const grupoModalidade = historicoScr?.["grupo-modalidade"] ?? [];
  const grupoCarteiraAtiva = historicoScr?.["grupo-carteira-ativa"] ?? [];

  const grupoCarteiraAtivaLabels: Record<string, string> = {
    ATE90DIAS: "Até 90 dias",
    DE91ATE360DIAS: "De 91 até 360 dias",
    DE361ATE1080DIAS: "De 361 até 1080 dias",
    DE1081ATE1800DIAS: "De 1081 até 1800 dias",
    DE1801ATE5400DIAS: "De 1801 até 5400 dias",
    ACIMA5400DIAS: "Acima de 5400 dias",
  };

  const grupoCarteiraAtivaColors: Record<string, string> = {
    ATE90DIAS: "#648FD0",
    DE91ATE360DIAS: "#4A5FA6",
    DE361ATE1080DIAS: "#313D77",
    DE1081ATE1800DIAS: "#E2A742",
    DE1801ATE5400DIAS: "#E1C12E",
    ACIMA5400DIAS: "#9B9B9B",
  };

  const grupoCarteiraAtivaChartData: Array<{
    key: string;
    label: string;
    percentual: number;
    color: string;
  }> = grupoCarteiraAtiva.map(
    (row: { agrupamento?: string; percentual?: string }) => ({
      key: row?.agrupamento ?? "-",
      label:
        grupoCarteiraAtivaLabels[row?.agrupamento ?? ""] ??
        row?.agrupamento ??
        "-",
      percentual: Number(row?.percentual ?? 0),
      color: grupoCarteiraAtivaColors[row?.agrupamento ?? ""] ?? "#9B9B9B",
    }),
  );

  const renderGrupoTable = (
    title: string,
    rows: Array<{ agrupamento?: string; percentual?: string }>,
  ) => (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
        {title}
      </p>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Agrupamento
            </th>
            <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Percentual
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${title}-${row?.agrupamento ?? "item"}-${idx}`}
              className="border-b border-gray-50 last:border-b-0"
            >
              <td className="py-2 pr-3 text-gray-700">
                {row?.agrupamento ?? "-"}
              </td>
              <td className="py-2 text-right font-medium text-gray-700">
                {row?.percentual ?? "0"}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const scoreScr = Number(historicoScr?.score ?? scorePj ?? 0);
  const normalizedScoreScr = Math.min(Math.max(scoreScr, 0), 1000);
  const scoreScrColor = getScoreColor(normalizedScoreScr);

  const scoreScrRisco = (() => {
    if (normalizedScoreScr >= 675) {
      return {
        label: "Risco Baixo",
        badge: { backgroundColor: "#DCFCE7", color: "#15803D" },
      };
    }

    if (normalizedScoreScr >= 467) {
      return {
        label: "Risco Médio",
        badge: { backgroundColor: "#FEF3C7", color: "#D97706" },
      };
    }

    return {
      label: "Risco Alto",
      badge: { backgroundColor: "#FEE2E2", color: "#DC2626" },
    };
  })();

  const scoreArcLength = 2 * Math.PI * 50 * 0.75;
  const scoreCircumference = 2 * Math.PI * 50;

  return (
    <div
      id="section-historico-scr"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Historico de Operações no SCR
      </h2>

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-100 bg-[#F8FAFC] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-center md:justify-start">
          <GraphScoreComponent
            className="flex items-center gap-5"
            normalizedScore={normalizedScoreScr}
            scoreColor={scoreScrColor}
            radius={50}
            arcLength={scoreArcLength}
            circumference={scoreCircumference}
            progressLength={(normalizedScoreScr / 1000) * scoreArcLength}
            badgeStyle={scoreScrRisco.badge}
            badgeLabel={scoreScrRisco.label}
            headerContent={
              <span className="text-xs text-gray-500">
                Fonte: <strong className="text-xs text-gray-700">SCR</strong>
              </span>
            }
            message={historicoScr?.mensagem ?? ""}
            secondaryBadge={{
              label: "Probabilidade de inadimplência",
              value: `${Number(
                historicoScr?.["probabilidade-inadimplencia"] ?? 0,
              ).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`,
              style:
                Number(historicoScr?.["probabilidade-inadimplencia"] ?? 0) <= 5
                  ? {
                      backgroundColor: "#DCFCE7",
                      borderColor: "#86EFAC",
                      color: "#166534",
                    }
                  : Number(
                        historicoScr?.["probabilidade-inadimplencia"] ?? 0,
                      ) <= 10
                    ? {
                        backgroundColor: "#FEF3C7",
                        borderColor: "#FCD34D",
                        color: "#92400E",
                      }
                    : {
                        backgroundColor: "#FEE2E2",
                        borderColor: "#FCA5A5",
                        color: "#991B1B",
                      },
            }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Quantidade
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.quantidade ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Instituições no SCR
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-instituicao-scr"] ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Quantidade Garantias
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-garantia"] ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Início Relacionamento
          </span>
          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["data-inicio-relacionamento"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Venc. Última Parcela
          </span>
          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["vencimento-ultima-parcela"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Atualização Base
          </span>
          
          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["data-atualizacao-base"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Contratado
          </span>

          <span className="text-base font-bold text-gray-800">
            {formatCurrency(historicoScr?.["valor-total-contratado-inicial"])} a{" "}
            {formatCurrency(historicoScr?.["valor-total-contratado-final"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Carteira Ativa Inicial
          </span>

          <span className="text-base font-bold text-gray-800">
            {formatCurrency(
              historicoScr?.["valor-total-carteira-ativa-inicial"],
            )}{" "}
            a{" "}
            {formatCurrency(historicoScr?.["valor-total-carteira-ativa-final"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Ativa a Vencer
          </span>

          <span className="text-base font-bold text-gray-800">
            {formatCurrency(
              historicoScr?.["valor-total-carteira-ativa-vencer-inicial"],
            )}{" "}
            a{" "}
            {formatCurrency(
              historicoScr?.["valor-total-carteira-ativa-vencer-final"],
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {renderGrupoTable("Grupo Garantia", grupoGarantia)}
        {renderGrupoTable("Grupo Modalidade", grupoModalidade)}

        <div className="rounded-lg border border-gray-100 p-3 lg:col-span-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Carteira ativa a vencer por modalidade
          </p>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={grupoCarteiraAtivaChartData}
                margin={{ top: 4, right: 16, left: 8, bottom: 55 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
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
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value}%`,
                    item?.payload?.label ?? "Faixa",
                  ]}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.label ?? "Faixa"
                  }
                  labelStyle={{ fontSize: 11, color: "#374151" }}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <Bar
                  dataKey="percentual"
                  fill="#ED884A"
                  maxBarSize={18}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-[13px] text-gray-600">
              Valor estimado total entre{" "}
              <strong className="text-[#2D4F91]">
                {formatCurrency(
                  historicoScr?.["valor-total-carteira-ativa-vencer-inicial"],
                )}
              </strong>{" "}
              a{" "}
              <strong className="text-[#2D4F91]">
                {formatCurrency(
                  historicoScr?.["valor-total-carteira-ativa-vencer-final"],
                )}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
