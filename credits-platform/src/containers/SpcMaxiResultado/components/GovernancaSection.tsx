import { useState, type ReactNode } from "react";
import { formatDate } from "@/utils/formatDate";
import type { DocumentoConsulta } from "./ConsultarDocumentoDialog";
import {
  countGrupoEconomicoSocios,
  GrupoEconomicoBlock,
  toArray,
} from "./GrupoEconomicoBlock";
import {
  formatDocument,
  getActiveTab,
  getVisibleTabs,
  ReportTabCards,
  type IsInsumoRequested,
  type ReportTab,
} from "./ReportTabCards";

interface GovernancaSectionProps {
  spcData: any;
  /** Tabs only show up for the insumos requested in the consultation. */
  isInsumoRequested: IsInsumoRequested;
  onConsultarDocumento?: (consulta: DocumentoConsulta) => void;
}

type GovernancaTabKey =
  | "participacao-empresa"
  | "socio"
  | "administrador"
  | "grupo-economico";

const HEADER_CELL =
  "pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400";

// The SPC payload returns a single object instead of an array when there is only one entry.
const getParticipacaoEmpresa = (spcData: any): any[] =>
  toArray<any>(spcData?.["participacao-empresa"]?.["detalhe-participacao-empresa"]);

const getSocios = (spcData: any): any[] =>
  toArray<any>(spcData?.socio?.["detalhe-socio"]).filter(Boolean);

const getAdministradores = (spcData: any): any[] =>
  toArray<any>(spcData?.administrador?.["detalhe-administrador"]).filter(Boolean);

function getGovernancaTabs(
  spcData: any,
  isInsumoRequested: IsInsumoRequested,
): ReportTab<GovernancaTabKey>[] {
  return getVisibleTabs<GovernancaTabKey>(
    [
      {
        key: "participacao-empresa",
        label: "Participação Empresa",
        count: getParticipacaoEmpresa(spcData).length,
        helper: "Participações societárias",
        insumos: ["24"],
      },
      {
        key: "socio",
        label: "Sócio",
        count: getSocios(spcData).length,
        helper: "Sócios da empresa",
        insumos: ["23"],
      },
      {
        key: "administrador",
        label: "Administrador",
        count: getAdministradores(spcData).length,
        helper: "Administradores da empresa",
        insumos: ["49"],
      },
      {
        key: "grupo-economico",
        label: "Grupo Econômico",
        count: countGrupoEconomicoSocios(spcData),
        helper: "Grupos econômicos associados",
        insumos: ["5241"],
      },
    ],
    isInsumoRequested,
  );
}

export function hasGovernancaData(
  spcData: any,
  isInsumoRequested: IsInsumoRequested,
): boolean {
  return getGovernancaTabs(spcData, isInsumoRequested).length > 0;
}

function getSituacaoBadgeStyle(situacao: string) {
  switch (situacao.toUpperCase()) {
    case "ATIVO":
      return { backgroundColor: "#DCFCE7", color: "#166534" };
    case "INATIVO":
      return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151" };
  }
}

function ParticipacaoEmpresaTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full table-fixed text-xs">
      <colgroup>
        <col style={{ width: "150px" }} />
        <col style={{ width: "100%" }} />
        <col style={{ width: "130px" }} />
        <col style={{ width: "100px" }} />
        <col style={{ width: "100px" }} />
        <col style={{ width: "100px" }} />
        <col style={{ width: "70px" }} />
      </colgroup>

      <thead>
        <tr className="border-b border-gray-100">
          <th className={`w-[160px] ${HEADER_CELL} pr-4`}>Documento</th>
          <th className={`${HEADER_CELL} pr-4`}>Empresa</th>
          <th className={`w-[140px] ${HEADER_CELL} pr-4`}>Relacionamento</th>
          <th className={`w-[130px] ${HEADER_CELL} pr-4`}>Cargo</th>
          <th className={`w-[90px] ${HEADER_CELL} pr-4`}>Entrada</th>
          <th className={`w-[120px] ${HEADER_CELL} pr-4`}>Participação</th>
          <th className={`w-[90px] ${HEADER_CELL} pr-0`}>Situação</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((participacao: any, index: number) => {
          const situacao =
            String(participacao?.["situacao-documento"] ?? "-").trim() || "-";

          return (
            <tr
              key={`participacao-empresa-${index}-${participacao?.documento ?? "-"}`}
              className="border-b border-gray-50 align-middle transition-colors hover:bg-gray-50"
            >
              <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                {formatDocument(participacao?.documento)}
              </td>
              <td className="py-2.5 pr-4 text-sm font-medium uppercase text-gray-700 break-words">
                {participacao?.nome ?? "-"}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                {participacao?.["tipo-relacionamento"] ?? "-"}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                {participacao?.["cargo-direcao"] ?? "-"}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                {formatDate(participacao?.["data-entrada"])}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                {participacao?.["porcentual-participacao"]
                  ? `${participacao["porcentual-participacao"]}%`
                  : "-"}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-0 uppercase text-gray-600">
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={getSituacaoBadgeStyle(situacao)}
                >
                  {situacao}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type PessoaColumn = {
  label: string;
  className: string;
  render: (row: any) => ReactNode;
};

const NOME_CELL = "py-2.5 pr-4 text-sm font-medium uppercase text-gray-700 break-words";
const DOCUMENTO_CELL = "whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700";
const TEXT_CELL = "whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600";
const LAST_CELL = "whitespace-nowrap py-2.5 pr-0 text-gray-600";

const renderDocumento = (documento: unknown) =>
  formatDocument(documento ? String(documento) : undefined);

const ADMINISTRADOR_COLUMNS: PessoaColumn[] = [
  { label: "Nome", className: NOME_CELL, render: (row) => row?.nome ?? "-" },
  {
    label: "Documento",
    className: DOCUMENTO_CELL,
    render: (row) => renderDocumento(row?.documento),
  },
  {
    label: "Cargo",
    className: TEXT_CELL,
    render: (row) => row?.["cargo-administracao"] ?? "-",
  },
  {
    label: "Tipo Relacionamento",
    className: TEXT_CELL,
    render: (row) => row?.["tipo-relacionamento"] ?? "-",
  },
  {
    label: "Data Entrada",
    className: LAST_CELL,
    render: (row) => formatDate(row?.["data-entrada"]) || "-",
  },
];

const SOCIO_COLUMNS: PessoaColumn[] = [
  { label: "Nome", className: NOME_CELL, render: (row) => row?.nome ?? "-" },
  {
    label: "Documento",
    className: DOCUMENTO_CELL,
    render: (row) => renderDocumento(row?.documento ?? row?.cpf ?? row?.cnpj),
  },
  {
    label: "Tipo Relacionamento",
    className: TEXT_CELL,
    render: (row) => row?.["tipo-relacionamento"] ?? "-",
  },
  {
    label: "Participação",
    className: TEXT_CELL,
    render: (row) => {
      const percentual =
        row?.["percentual-participacao"] ?? row?.["porcentual-participacao"];
      return percentual ? `${String(percentual).replace("%", "")}%` : "-";
    },
  },
  {
    label: "Data Entrada",
    className: LAST_CELL,
    render: (row) => formatDate(row?.["data-entrada"]) || "-",
  },
];

function PessoasTable({
  rows,
  columns,
  rowKeyPrefix,
}: {
  rows: any[];
  columns: PessoaColumn[];
  rowKeyPrefix: string;
}) {
  return (
    <table className="w-full table-fixed text-xs">
      <thead>
        <tr className="border-b border-gray-100">
          {columns.map(({ label }) => (
            <th key={label} className={`${HEADER_CELL} pr-4 last:pr-0`}>
              {label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row: any, index: number) => (
          <tr
            key={`${rowKeyPrefix}-${index}-${row?.documento ?? "-"}`}
            className="border-b border-gray-50 transition-colors hover:bg-gray-50"
          >
            {columns.map(({ label, className, render }) => (
              <td key={label} className={className}>
                {render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Blocks shown as a plain table, which the print always includes, even under another tab. */
const PESSOA_BLOCKS = [
  {
    key: "socio" as const,
    label: "Sócio",
    columns: SOCIO_COLUMNS,
    getRows: getSocios,
  },
  {
    key: "administrador" as const,
    label: "Administrador",
    columns: ADMINISTRADOR_COLUMNS,
    getRows: getAdministradores,
  },
];

export function GovernancaSection({
  spcData,
  isInsumoRequested,
  onConsultarDocumento,
}: GovernancaSectionProps) {
  const [selectedTab, setSelectedTab] = useState<GovernancaTabKey | null>(null);

  const tabs = getGovernancaTabs(spcData, isInsumoRequested);

  if (!tabs.length) return null;

  const activeTab = getActiveTab(tabs, selectedTab);
  const activePessoaBlock = PESSOA_BLOCKS.find(
    (block) => block.key === activeTab.key,
  );
  const hasTabData = (key: GovernancaTabKey) =>
    tabs.some((tab) => tab.key === key && tab.count > 0);

  return (
    <div
      id="section-governanca"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center">
        <h2 className="text-sm font-semibold text-gray-700">Governança</h2>
      </div>

      <ReportTabCards<GovernancaTabKey>
        tabs={tabs}
        activeKey={activeTab.key}
        onSelect={setSelectedTab}
      />

      {/* Requested insumos without data only show their counter, like the grupo econômico. */}
      {activeTab.count > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          {activeTab.key === "grupo-economico" ? (
            <GrupoEconomicoBlock
              spcData={spcData}
              onConsultarDocumento={onConsultarDocumento}
            />
          ) : activePessoaBlock ? (
            <PessoasTable
              rows={activePessoaBlock.getRows(spcData)}
              columns={activePessoaBlock.columns}
              rowKeyPrefix={activePessoaBlock.key}
            />
          ) : (
            <ParticipacaoEmpresaTable rows={getParticipacaoEmpresa(spcData)} />
          )}
        </div>
      )}

      {PESSOA_BLOCKS.filter(
        (block) => hasTabData(block.key) && activeTab.key !== block.key,
      ).map((block) => (
        <div
          key={block.key}
          className="hidden print:block mt-6 border-t border-gray-200 pt-4"
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
            {block.label}
          </p>
          <PessoasTable
            rows={block.getRows(spcData)}
            columns={block.columns}
            rowKeyPrefix={block.key}
          />
        </div>
      ))}

      {/* The print always includes the grupo econômico, even under another tab. */}
      {hasTabData("grupo-economico") && activeTab.key !== "grupo-economico" && (
        <div className="hidden print:block mt-6 border-t border-gray-200 pt-4">
          <GrupoEconomicoBlock spcData={spcData} />
        </div>
      )}
    </div>
  );
}
