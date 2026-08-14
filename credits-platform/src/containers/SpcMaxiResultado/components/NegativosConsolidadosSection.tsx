import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface GroupItem {
  key: string;
  label: string;
  count: number | string;
  valor: string;
  antiga: string;
  recente: string;
}

interface NegativosConsolidadosSectionProps {
  groups: GroupItem[];
  activeGroup: string;
  setActiveGroup: Dispatch<SetStateAction<string>>;
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  resumoTabela: {
    count: number | string;
    antiga: string;
    recente: string;
  };
  visible: any[];
  remaining: number;
  shouldShowChart: boolean;
  chartData: Array<{ data: string; valor: number; acumulado: number }>;
  handleSort: (key: SortKey) => void;
  sortKey: SortKey | null;
  sortDir: SortDir;
  expandedRowKey: string | null;
  setExpandedRowKey: Dispatch<SetStateAction<string | null>>;
  spcData: any;
}

export function NegativosConsolidadosSection({
  groups,
  activeGroup,
  setActiveGroup,
  expanded,
  setExpanded,
  resumoTabela,
  visible,
  remaining,
  shouldShowChart,
  chartData,
  handleSort,
  sortKey,
  sortDir,
  expandedRowKey,
  setExpandedRowKey,
  spcData,
}: NegativosConsolidadosSectionProps) {
  return (
    <div
      id="section-negativos"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center">
        <h2 className="text-sm font-semibold text-gray-700">
          Negativos Consolidados
        </h2>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        {groups.map((g) => {
          const isActive = activeGroup === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setActiveGroup(g.key);
                setExpanded(false);
              }}
              className="rounded-xl border p-3 text-left transition-all"
              style={{
                borderColor: isActive ? "#ED884A" : "#E5E7EB",
                backgroundColor: isActive ? "#FFFBF7" : "#fff",
              }}
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                {g.label}
              </p>
              <hr className="mb-2 border-gray-200" />
              <div className="mb-2 flex items-baseline justify-between">
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
                  <p className="text-[9px] uppercase tracking-wide text-gray-400">
                    Antiga
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    {g.antiga}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wide text-gray-400">
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

      <div className="mt-10 mb-3 flex items-center gap-3 border-b border-gray-100 pb-3 text-xs text-gray-500">
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

      <table className="w-full table-fixed text-xs">
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
              <th key={label} className="pb-2 pr-4 text-left last:pr-0">
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
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  {activeGroup === "PROTESTOS" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.data}
                    </td>
                  )}

                  {activeGroup === "PROTESTOS" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.cartorio}
                    </td>
                  )}

                  {activeGroup === "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.inclusao}
                    </td>
                  )}

                  {activeGroup === "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.motivo}
                    </td>
                  )}

                  {activeGroup === "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.agencia}
                    </td>
                  )}

                  {activeGroup === "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.banco}
                    </td>
                  )}

                  {activeGroup === "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.origem}
                    </td>
                  )}

                  {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.inclusao}
                    </td>
                  )}

                  {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                      {r.vencimento}
                    </td>
                  )}

                  {activeGroup !== "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-gray-800">
                      {r.valor}
                    </td>
                  )}

                  {activeGroup !== "PROTESTOS" && activeGroup !== "CCF" && (
                    <td className="py-2.5 pr-4 text-gray-700">
                      {r.credor}
                    </td>
                  )}

                  {activeGroup !== "CCF" && (
                    <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
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
                        className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label={
                          isRowExpanded ? "Recolher detalhes" : "Expandir detalhes"
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

      {expanded && visible.length > 5 && (
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
        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
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

      {(() => {
        const riscoCreditoDetalhe =
          spcData?.["insumo-classificacao-risco-debitos-ativos"]?.detalhe;

        const classeRisco = riscoCreditoDetalhe?.["classe-severidade"];
        const descricaoRisco = riscoCreditoDetalhe?.descricao;
        const risco = riscoCreditoDetalhe?.risco;
        const taxaMalPagador = riscoCreditoDetalhe?.["taxa-mau-pagador"];

        if (!classeRisco && !descricaoRisco && !risco && !taxaMalPagador)
          return null;

        return (
          <div className="mt-6 flex w-full flex-col gap-2">
            <p className="mb-1 text-xs font-semibold text-gray-500">
              Risco de Crédito
            </p>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {classeRisco ? (
                <div
                  className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Classe do Risco
                  </span>

                  <span className="text-base font-bold text-gray-800">
                    {classeRisco}
                  </span>
                </div>
              ) : null}

              {risco ? (
                <div
                  className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Risco
                  </span>

                  <span className="text-base font-bold text-gray-800">
                    {risco}
                  </span>
                </div>
              ) : null}

              {taxaMalPagador ? (
                <div
                  className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Taxa Mal Pagador
                  </span>

                  <span className="text-base font-bold text-gray-800">
                    {taxaMalPagador}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {descricaoRisco ? (
                <div
                  className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Descrição
                  </span>

                  <span className="text-base font-bold text-gray-800">
                    {descricaoRisco}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
