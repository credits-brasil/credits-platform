import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { DocumentoConsulta } from "./ConsultarDocumentoDialog";

interface GrupoEconomicoNode {
  documento?: string;
  nome?: string;
  cargo?: string;
  qtdEmpresas?: string;
  restricao?: string;
  gruposEconomicosAssociados?: {
    grupoEconomicoAssociado?: GrupoEconomicoNode | GrupoEconomicoNode[];
  };
}

/** One color per level; deeper levels reuse the palette. */
const LEVEL_COLORS = ["#243871", "#ED884A", "#3B82F6", "#10B981", "#8B5CF6"];

const COLUMNS = [
  "Documento",
  "Nome",
  "Cargo",
  "Qtd. Empresas",
  "Restrição",
  "",
];

/** The API returns a single object instead of an array when there is only one item. */
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/** PF or PJ comes from the document itself: 11 digits is a CPF, 14 a CNPJ. */
function getTypeDocument(documento?: string): DocumentoConsulta["typeDocument"] | null {
  const digits = String(documento ?? "").replace(/\D/g, "");
  if (digits.length === 11) return "CPF";
  if (digits.length === 14) return "CNPJ";
  return null;
}

function getChildren(node: GrupoEconomicoNode): GrupoEconomicoNode[] {
  return toArray(node.gruposEconomicosAssociados?.grupoEconomicoAssociado);
}

function getGrupoEconomicoDetalhe(spcData: any) {
  return (
    spcData?.["grupo-economico"]?.["detalhe-grupo-economico"] ??
    spcData?.["detalhe-grupo-economico"]
  );
}

function getSocios(spcData: any): GrupoEconomicoNode[] {
  return toArray(getGrupoEconomicoDetalhe(spcData)?.socios?.socio);
}

export function countGrupoEconomicoSocios(spcData: any): number {
  return getSocios(spcData).length;
}

/** Distinct documents with a restriction anywhere in the tree; the same person can appear in several levels. */
export function countGrupoEconomicoRestricoes(spcData: any): number {
  const documentos = new Set<string>();

  const visit = (nodes: GrupoEconomicoNode[]) =>
    nodes.forEach((node) => {
      if (String(node.restricao ?? "").toUpperCase() === "S") {
        documentos.add(node.documento ?? node.nome ?? "");
      }
      visit(getChildren(node));
    });

  visit(getSocios(spcData));

  return documentos.size;
}

function getLevelColor(level: number) {
  return LEVEL_COLORS[level % LEVEL_COLORS.length];
}

function RestricaoBadge({ value }: { value?: string }) {
  const hasRestricao = String(value ?? "").toUpperCase() === "S";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        hasRestricao ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      {hasRestricao ? "Sim" : "Não"}
    </span>
  );
}

function GrupoEconomicoTable({
  nodes,
  level,
  parentKey,
  expandedKeys,
  toggle,
  onConsultarDocumento,
}: {
  nodes: GrupoEconomicoNode[];
  level: number;
  parentKey: string;
  expandedKeys: Set<string>;
  toggle: (key: string) => void;
  onConsultarDocumento?: (consulta: DocumentoConsulta) => void;
}) {
  const color = getLevelColor(level);

  return (
    // The left border is the level bar; nested tables stack their own bars inside it.
    <div
      className="border-l-[3px] pl-3"
      style={{ borderColor: color }}
    >
      <p
        className="mb-1 text-[9px] font-semibold uppercase tracking-wide"
        style={{ color }}
      >
        Nível {level + 1}
      </p>

      <table className="w-full text-xs table-fixed">
        <colgroup>
          <col style={{ width: "150px" }} />
          <col />
          <col style={{ width: "150px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "60px" }} />
        </colgroup>

        <thead>
          <tr className="border-b border-gray-100">
            {COLUMNS.map((label) => (
              <th
                key={label}
                className="text-left pb-2 pr-4 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {nodes.map((node, i) => {
            const rowKey = `${parentKey}/${i}-${node.documento ?? ""}`;

            return (
              <GrupoEconomicoRow
                key={rowKey}
                node={node}
                rowKey={rowKey}
                level={level}
                expandedKeys={expandedKeys}
                toggle={toggle}
                onConsultarDocumento={onConsultarDocumento}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GrupoEconomicoRow({
  node,
  rowKey,
  level,
  expandedKeys,
  toggle,
  onConsultarDocumento,
}: {
  node: GrupoEconomicoNode;
  rowKey: string;
  level: number;
  expandedKeys: Set<string>;
  toggle: (key: string) => void;
  onConsultarDocumento?: (consulta: DocumentoConsulta) => void;
}) {
  const childNodes = getChildren(node);
  const hasChildren = childNodes.length > 0;
  const isOpen = expandedKeys.has(rowKey);
  const typeDocument = getTypeDocument(node.documento);

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
          {node.documento || "-"}
        </td>
        <td className="py-2.5 pr-4 text-gray-800 font-medium">
          {node.nome || "-"}
        </td>
        <td className="py-2.5 pr-4 text-gray-600">{node.cargo || "-"}</td>
        <td className="py-2.5 pr-4 text-gray-600">{node.qtdEmpresas ?? "-"}</td>
        <td className="py-2.5 pr-4">
          <RestricaoBadge value={node.restricao} />
        </td>
        <td className="py-2.5">
          <div data-print-hidden className="flex items-center justify-end gap-0.5">
            {onConsultarDocumento && typeDocument && node.documento && (
              <button
                type="button"
                onClick={() =>
                  onConsultarDocumento({
                    documento: node.documento!,
                    nome: node.nome,
                    typeDocument,
                  })
                }
                className="text-primary hover:text-primary/80 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                aria-label={`Consultar ${typeDocument} ${node.documento}`}
                title={`Consultar ${typeDocument}`}
              >
                <Search size={13} />
              </button>
            )}

            {hasChildren && (
              <button
                type="button"
                onClick={() => toggle(rowKey)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                aria-label={
                  isOpen ? "Recolher grupo econômico" : "Expandir grupo econômico"
                }
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Collapsed levels stay in the DOM so the print shows the whole tree. */}
      {hasChildren && (
        <tr className={isOpen ? "" : "hidden print:table-row"}>
          <td colSpan={COLUMNS.length} className="pt-2 pb-3 pl-2">
            <GrupoEconomicoTable
              nodes={childNodes}
              level={level + 1}
              parentKey={rowKey}
              expandedKeys={expandedKeys}
              toggle={toggle}
              onConsultarDocumento={onConsultarDocumento}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function GrupoEconomicoBlock({
  spcData,
  onConsultarDocumento,
}: {
  spcData: any;
  onConsultarDocumento?: (consulta: DocumentoConsulta) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const detalhe = getGrupoEconomicoDetalhe(spcData);
  const socios = getSocios(spcData);

  if (!socios.length) return null;

  const toggle = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      {/* Same look as the section titles, so it reads as its own section on paper. */}
      <h2 className="hidden print:block mb-3 text-sm font-semibold text-gray-700">
        Governança – Grupo Econômico
      </h2>

      <div className="flex items-center gap-3 text-xs text-gray-500 pb-3 mb-3 border-b border-gray-100">
        {detalhe?.documento && (
          <>
            <span>
              Documento:{" "}
              <span className="font-semibold text-gray-800">
                {detalhe.documento}
              </span>
            </span>

            <span className="text-gray-300">|</span>
          </>
        )}

        <span>
          Sócios:{" "}
          <span className="font-semibold text-gray-800">{socios.length}</span>
        </span>

        <span className="text-gray-300">|</span>

        <span>
          Com restrição:{" "}
          <span className="font-semibold text-[#ED884A]">
            {countGrupoEconomicoRestricoes(spcData)}
          </span>
        </span>
      </div>

      <GrupoEconomicoTable
        nodes={socios}
        level={0}
        parentKey="socio"
        expandedKeys={expandedKeys}
        toggle={toggle}
        onConsultarDocumento={onConsultarDocumento}
      />
    </div>
  );
}
