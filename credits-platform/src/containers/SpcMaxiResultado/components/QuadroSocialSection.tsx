import { Fragment, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCEP } from "@/utils/formatCEP";
import { formatDate } from "@/utils/formatDate";
import { formatPhone } from "@/utils/formatPhone";
import { toArray } from "./GrupoEconomicoBlock";
import {
  formatDocument,
  getActiveTab,
  getVisibleTabs,
  ReportTabCards,
  type IsInsumoRequested,
  type ReportTab,
} from "./ReportTabCards";

type QuadroSocialTabKey = "controle-societario" | "quadro-administrativo";

const QUADRO_SOCIAL_INSUMO = "5186";

interface QuadroSocialSectionProps {
  spcData: any;
  /** Only shows up when the Quadro Social Mais Completo PJ insumo was requested. */
  isInsumoRequested: IsInsumoRequested;
}

function getQuadroSocialData(spcData: any) {
  const quadroSocial =
    spcData?.["quadro-social-mais-completo-pj"]?.[
      "detalhe-quadro-social-mais-completo-pj"
    ];

  // The SPC payload returns a single object instead of an array when there is only one entry.
  return {
    controleSocietario: toArray<any>(quadroSocial?.["controle-societario"]),
    quadroAdministrativo: toArray<any>(quadroSocial?.["quadro-administrativo"]),
  };
}

function getQuadroSocialTabs(
  spcData: any,
  isInsumoRequested: IsInsumoRequested,
): ReportTab<QuadroSocialTabKey>[] {
  const { controleSocietario, quadroAdministrativo } =
    getQuadroSocialData(spcData);

  return getVisibleTabs<QuadroSocialTabKey>(
    [
      {
        key: "controle-societario",
        label: "Controle Societário",
        count: controleSocietario.length,
        helper: "Quadro Social mais completo",
        insumos: [QUADRO_SOCIAL_INSUMO],
      },
      {
        key: "quadro-administrativo",
        label: "Quadro Administrativo",
        count: quadroAdministrativo.length,
        helper: "Quadro Social mais completo",
        insumos: [QUADRO_SOCIAL_INSUMO],
      },
    ],
    isInsumoRequested,
  );
}

export function hasQuadroSocialData(
  spcData: any,
  isInsumoRequested: IsInsumoRequested,
): boolean {
  return getQuadroSocialTabs(spcData, isInsumoRequested).length > 0;
}

const getInfoParts = (row: any) => ({
  info1: row?.["informacoes-adicionais-1"]?.$ ?? {},
  info2: row?.["informacoes-adicionais-2"]?.$ ?? {},
  restricoes: row?.restricoes?.$ ?? null,
});

const formatPercentual = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value).includes("%")
      ? String(value)
      : `${value}%`
    : "-";

const HEADER_CELL =
  "pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400";

export function QuadroSocialSection({
  spcData,
  isInsumoRequested,
}: QuadroSocialSectionProps) {
  const [selectedTab, setSelectedTab] = useState<QuadroSocialTabKey | null>(
    null,
  );
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setExpandedRow(null);
  }, [selectedTab]);

  const tabs = getQuadroSocialTabs(spcData, isInsumoRequested);

  if (!tabs.length) return null;

  const activeTab = getActiveTab(tabs, selectedTab);
  const isControleSocietarioTab = activeTab.key === "controle-societario";
  const { controleSocietario, quadroAdministrativo } =
    getQuadroSocialData(spcData);
  const activeRows = isControleSocietarioTab
    ? controleSocietario
    : quadroAdministrativo;

  return (
    <div
      id="section-quadro-social"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center">
        <h2 className="text-sm font-semibold text-gray-700">
          Quadro Social Mais Completo
        </h2>
      </div>

      <ReportTabCards<QuadroSocialTabKey>
        tabs={tabs}
        activeKey={activeTab.key}
        onSelect={setSelectedTab}
      />

      {/* Requested insumos without data only show their counter. */}
      {activeTab.count > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <table className="w-full table-fixed text-xs">
            {isControleSocietarioTab ? (
              <colgroup>
                <col style={{ width: "150px" }} />
                <col style={{ width: "100%" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "30px" }} />
              </colgroup>
            ) : (
              <colgroup>
                <col style={{ width: "120px" }} />
                <col style={{ width: "100%" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "30px" }} />
              </colgroup>
            )}

            <thead>
              {isControleSocietarioTab ? (
                <tr className="border-b border-gray-100">
                  <th className={`w-[140px] ${HEADER_CELL} pr-4`}>Documento</th>
                  <th className={`${HEADER_CELL} pr-4`}>Sócio/Acionista</th>
                  <th className={`w-[90px] ${HEADER_CELL} pr-4`}>Entrada</th>
                  <th className={`w-[130px] ${HEADER_CELL} pr-4`}>Nacionalidade</th>
                  <th className={`w-[90px] ${HEADER_CELL} pr-4`}>Votante</th>
                  <th className={`w-[90px] ${HEADER_CELL} pr-0`}>Total</th>
                  <th className={`w-[110px] ${HEADER_CELL} pr-4`} />
                </tr>
              ) : (
                <tr className="border-b border-gray-100">
                  <th className={`w-[160px] ${HEADER_CELL} pr-4`}>Documento</th>
                  <th className={`whitespace-nowrap ${HEADER_CELL} pr-4`}>
                    Administração
                  </th>
                  <th className={`w-[130px] ${HEADER_CELL} pr-4`}>Cargo</th>
                  <th className={`w-[130px] ${HEADER_CELL} pr-0`}>
                    Nacionalidade
                  </th>
                  <th className={`w-[110px] ${HEADER_CELL} pr-4`} />
                </tr>
              )}
            </thead>

            <tbody>
              {activeRows.map((row: any, index: number) => {
                const socio = row?.["detalhes-socio-1"]?.$ ?? {};
                const socioPercentual = row?.["detalhes-socio-2"]?.$ ?? {};
                const administrativo = row?.administrativo?.$ ?? {};
                const info = getInfoParts(row);

                const documentValue = isControleSocietarioTab
                  ? socio?.documento
                  : administrativo?.documento;
                const rowKey = `${activeTab.key}-${index}-${documentValue ?? "-"}`;
                const isExpanded = expandedRow === rowKey;

                const expandButton = (
                  <td className="py-2.5 pr-4 text-left">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRow((current) =>
                          current === rowKey ? null : rowKey,
                        )
                      }
                      className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      aria-label={
                        isExpanded ? "Recolher detalhes" : "Expandir detalhes"
                      }
                    >
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  </td>
                );

                const details = isControleSocietarioTab
                  ? [
                      { label: "Nome", value: socio?.nome },
                      {
                        label: "Documento",
                        value: formatDocument(socio?.documento),
                      },
                      {
                        label: "Nascimento",
                        value: formatDate(info.info1?.dataNascimento),
                      },
                      { label: "RG", value: info.info1?.rg },
                      { label: "Nacionalidade", value: socio?.nacionalidade },
                      { label: "Endereço", value: info.info2?.logradouro },
                      { label: "Bairro", value: info.info2?.bairro },
                      { label: "CEP", value: formatCEP(info.info1?.cep) },
                      { label: "Cidade", value: info.info1?.cidade },
                      { label: "UF", value: info.info1?.uf },
                      {
                        label: "Telefone",
                        value: formatPhone(info.info1?.ddd),
                      },
                      { label: "Vínculo", value: info.info1?.vinculo },
                      {
                        label: "Capital Votante",
                        value: socioPercentual?.percentualCapitalVotante,
                      },
                      { label: "Capital Total", value: socio?.percentual },
                    ]
                  : [
                      { label: "Vínculo", value: info.info1?.vinculo },
                      {
                        label: "Data Nascimento",
                        value: formatDate(info.info1?.dataNascimento),
                      },
                      {
                        label: "Telefone",
                        value: formatPhone(info.info1?.ddd),
                      },
                      { label: "RG", value: info.info1?.rg },
                      { label: "CEP", value: formatCEP(info.info1?.cep) },
                      {
                        label: "Cidade/UF",
                        value:
                          info.info1?.cidade || info.info1?.uf
                            ? `${info.info1?.cidade ?? "-"}/${info.info1?.uf ?? "-"}`
                            : "-",
                      },
                      { label: "Logradouro", value: info.info2?.logradouro },
                      { label: "Bairro", value: info.info2?.bairro },
                    ];

                return (
                  <Fragment key={rowKey}>
                    <tr className="border-b border-gray-50 align-middle transition-colors hover:bg-gray-50">
                      {isControleSocietarioTab ? (
                        <>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                            {formatDocument(socio?.documento)}
                          </td>
                          <td className="py-2.5 pr-4 text-sm font-medium uppercase text-gray-700 break-words">
                            {socio?.nome ?? "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                            {socio?.tipoPessoa ?? "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                            {socio?.nacionalidade || "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                            {formatPercentual(
                              socioPercentual?.percentualCapitalVotante,
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-0 text-gray-600">
                            {formatPercentual(socio?.percentual)}
                          </td>
                          {expandButton}
                        </>
                      ) : (
                        <>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                            {formatDocument(administrativo?.documento)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-sm font-medium uppercase text-gray-700">
                            {administrativo?.nome ?? "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                            {administrativo?.cargo ?? "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-0 uppercase text-gray-600">
                            {administrativo?.nacionalidade || "-"}
                          </td>
                          {expandButton}
                        </>
                      )}
                    </tr>

                    <tr
                      className={`bg-gray-50/50 transition-all ${
                        isExpanded
                          ? "border-b border-gray-50 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          : "border-b border-transparent duration-300 ease-in-out"
                      }`}
                    >
                      <td colSpan={7} className="p-0">
                        <div
                          className={`overflow-hidden transition-[max-height,opacity] ${
                            isExpanded
                              ? "max-h-[380px] opacity-100 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                              : "max-h-0 opacity-0 duration-300 ease-in-out"
                          }`}
                        >
                          <div
                            className={`grid grid-cols-2 gap-3 px-3 py-3 transition-all md:grid-cols-3 ${
                              isExpanded
                                ? "translate-y-0 opacity-100 duration-500 delay-75"
                                : "-translate-y-1 opacity-0 duration-200"
                            }`}
                          >
                            {details.map((field) => (
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

                          {info.restricoes && (
                            <div className="mx-3 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                                Restrição Encontrada
                              </p>
                              <p className="mt-0.5 text-xs text-red-800">
                                {info.restricoes?.descricao ?? "-"} |
                                Ocorrências: {info.restricoes?.quantidadeOcorrencias ?? "-"} | Última ocorrência: {formatDate(info.restricoes?.dataUltimaOcorrencia)} | Valor total: {info.restricoes?.valorTotalOcorrencia ?? "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
