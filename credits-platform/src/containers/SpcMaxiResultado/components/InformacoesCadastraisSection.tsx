import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CopyButton } from "@/components/ui/copy-button";
import { GoogleMapsButton } from "@/components/GoogleMapsButton";
import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";
import { formatCEP } from "@/utils/formatCEP";
import { formatDate } from "@/utils/formatDate";
import { formatPhone } from "@/utils/formatPhone";
import { useViaCep } from "@/hooks/useViaCep";
import { useIsPrinting } from "@/hooks/useIsPrinting";

const ACCORDION_ITEMS = [
  "dados-pessoais",
  "contato-endereco",
  "dados-adicionais-contato-spc-brasil",
  "atividades-economicas-secundarias-spc-brasil",
  "administrador-spc-brasil",
];

type InformacoesCadastraisSectionProps = {
  spcData: any;
  body: Array<{
    endereco?: string;
    email?: string;
    telefone?: string;
    celular?: string;
  }>;
  /** Undefined when the insumo was not requested; empty when it came without data. */
  quantidadeFuncionarios?: string;
};

type Endereco = {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

const joinFilled = (parts: Array<string | undefined>, separator: string) =>
  parts.filter(Boolean).join(separator);

/** e.g. "Rua X, 120 - Cj 902, Pinheiros - São Paulo - SP | CEP: 05409-000" */
function formatEnderecoCompleto(endereco: Endereco): string {
  const rua = joinFilled(
    [
      joinFilled([endereco.logradouro, endereco.numero], ", "),
      endereco.complemento,
    ],
    " - ",
  );
  const localidade = joinFilled(
    [endereco.bairro, endereco.cidade, endereco.estado],
    " - ",
  );
  const cep = endereco.cep ? `CEP: ${formatCEP(endereco.cep)}` : undefined;

  return joinFilled([joinFilled([rua, localidade], ", "), cep], " | ") || "-";
}

/** Only what helps Google Maps find the place, e.g. "Rua X, 120, Pinheiros, São Paulo, SP". */
function formatEnderecoMapsQuery(endereco: Endereco): string {
  return joinFilled(
    [
      endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
    ],
    ", ",
  );
}

/**
 * Same as `formatEnderecoMapsQuery`, for addresses that come as text:
 * "Rua X, 120 - Cj 902, Pinheiros - São Paulo - SP | CEP: 05409-000" -> "Rua X, 120, Pinheiros, São Paulo, SP".
 */
function getEnderecoMapsQueryFromText(enderecoTexto: string): string {
  const [semCep] = enderecoTexto.split("|");
  const partes = semCep.split(",").map((parte) => parte.trim());

  if (partes.length < 2) return semCep.trim();

  const logradouro = partes[0];
  // Between street and locality: "number - complement".
  const numero = partes.length > 2 ? partes[1].split(" - ")[0] : undefined;
  const [bairro, cidade, estado] = partes[partes.length - 1].split(" - ");

  return formatEnderecoMapsQuery({
    logradouro,
    numero: numero?.trim(),
    bairro: bairro?.trim(),
    cidade: cidade?.trim(),
    estado: estado?.trim(),
  });
}

type DadosAdicionaisRow = InformacoesCadastraisSectionProps["body"][number];

const DADOS_ADICIONAIS_COLUMNS: Array<{
  key: keyof DadosAdicionaisRow;
  label: string;
  breakWords?: boolean;
  showMapsLink?: boolean;
}> = [
  { key: "endereco", label: "Endereço", breakWords: true, showMapsLink: true },
  { key: "email", label: "Email", breakWords: true },
  { key: "telefone", label: "Tel. fixo" },
  { key: "celular", label: "Tel. Celular" },
];

function CopyableCell({
  value,
  label,
  breakWords,
  showMapsLink,
}: {
  value?: string;
  label: string;
  breakWords?: boolean;
  showMapsLink?: boolean;
}) {
  const hasValue = Boolean(value) && value !== "-";

  return (
    <td
      className={`py-2.5 pr-4 text-sm text-gray-800 whitespace-pre-line ${
        breakWords ? "break-words" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="min-w-0">{value}</span>

        {hasValue && (
          <CopyButton
            value={value}
            title={`Copiar ${label}`}
            className="mt-0.5 shrink-0 text-gray-400 hover:text-[#243871] transition-colors hover:cursor-pointer"
          />
        )}

        {hasValue && showMapsLink && (
          <GoogleMapsButton
            address={getEnderecoMapsQueryFromText(value!)}
            className="mt-0.5"
          />
        )}
      </div>
    </td>
  );
}

export function InformacoesCadastraisSection({
  spcData,
  body,
  quantidadeFuncionarios,
}: InformacoesCadastraisSectionProps) {
  // Collapsed on screen, but every item is printed open.
  const [openItems, setOpenItems] = useState<string[]>([]);
  const isPrinting = useIsPrinting();

  const administradorRaw = spcData?.administrador?.["detalhe-administrador"];
  const administradores: any[] = (
    Array.isArray(administradorRaw) ? administradorRaw : [administradorRaw]
  ).filter(Boolean);

  const endereco = spcData?.consumidor?.endereco;
  const { data: viaCep } = useViaCep(endereco?.cep);

  // ViaCEP has the street name for the CEP; fall back to SPC while it loads or fails.
  const enderecoConsumidor: Endereco = {
    ...endereco,
    logradouro: viaCep?.logradouro || endereco?.logradouro,
  };
  const enderecoCompleto = formatEnderecoCompleto(enderecoConsumidor);
  const enderecoMapsQuery = formatEnderecoMapsQuery(enderecoConsumidor);

  return (
    <div
      id="section-cadastrais"
      className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Informações Cadastrais
      </h2>

      <Accordion
        type="multiple"
        value={isPrinting ? ACCORDION_ITEMS : openItems}
        onValueChange={setOpenItems}
        className="w-full"
      >
        <AccordionItem value="dados-pessoais" className="border-gray-100">
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Dados Cadastrais
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
              {[
                {
                  label: spcData?.consumidor?.cpf
                    ? "Nome completo"
                    : "Razão Social",
                  value: spcData?.consumidor?.cpf
                    ? spcData?.consumidor?.nome
                    : spcData?.consumidor?.["razao-social"],
                },
                {
                  label: spcData?.consumidor?.cpf ? "CPF" : "CNPJ",
                  value: spcData?.consumidor?.cpf
                    ? formatCPF(spcData?.consumidor?.cpf)
                    : formatCNPJ(spcData?.consumidor?.cnpj),
                },
                {
                  label: spcData?.consumidor?.cpf
                    ? "Data de nascimento"
                    : "Data de fundação",
                  value: spcData?.consumidor?.cpf
                    ? formatDate(spcData?.consumidor?.["data-nascimento"])
                    : formatDate(spcData?.consumidor?.["data-fundacao"]),
                },
                ...(spcData?.consumidor?.cpf
                  ? [
                    { label: "Sexo", value: spcData?.consumidor?.sexo },
                    {
                      label: "Nacionalidade",
                      value: !Boolean(
                        spcData?.consumidor?.["pessoa-estrangeira"],
                      )
                        ? "Estrangeira"
                        : "Brasileira",
                    },
                    {
                      label: "Nome da mãe",
                      value: spcData?.consumidor?.["nome-mae"] ?? "-",
                    },
                    {
                      label: "Nome do pai",
                      value: spcData?.consumidor?.["nome-pai"] ?? "-",
                    },
                    {
                      label: "RG",
                      value: spcData?.consumidor?.["numero-rg"]
                        ? `${spcData?.consumidor?.["numero-rg"]} SSP/SP`
                        : "-",
                    },
                  ]
                  : [
                    {
                      label: "Nome Comercial",
                      value: spcData?.consumidor?.["nome-comercial"] ?? "-",
                    },
                    {
                      label: "CNAE",
                      value:
                        spcData?.consumidor?.["atividade-economica-principal"]
                          ?.code ??
                        spcData?.["atividade-empresa"]?.[
                          "detalhe-atividade-empresa"
                        ]?.["ramo-atividade"]?.code,
                    },
                    {
                      label: "Descrição do CNAE",
                      value:
                        spcData?.consumidor?.["atividade-economica-principal"]
                          ?.description ??
                        spcData?.["atividade-empresa"]?.[
                          "detalhe-atividade-empresa"
                        ]?.["ramo-atividade"]?.description,
                    },
                    {
                      label: "Natureza Jurídica",
                      value: (() => {
                        const naturezaJuridica =
                          spcData?.consumidor?.["natureza-juridica"];
                        const descricao = naturezaJuridica?.description;
                        const code = naturezaJuridica?.code;

                        if (descricao && code)
                          return `${descricao} (${code})`;
                        return descricao ?? code ?? "-";
                      })(),
                    },
                    ...(quantidadeFuncionarios !== undefined
                      ? [
                        {
                          label: "Quantidade de Funcionários",
                          value: quantidadeFuncionarios,
                        },
                      ]
                      : []),
                  ]),
              ].map((f) => {
                const COPYABLE_FIELDS = new Set([
                  "Nome completo",
                  "Razão Social",
                  "Nome Comercial",
                  "CPF",
                  "CNPJ",
                  "CNAE",
                  "Descrição do CNAE",
                ]);
                return (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-800">{f.value || "–"}</p>

                      {COPYABLE_FIELDS.has(f.label) && f?.value?.length > 0 && (
                        <CopyButton
                          value={String(f.value)}
                          title={`Copiar ${f.label}`}
                          className="shrink-0 text-gray-400 transition-colors hover:cursor-pointer hover:text-[#243871]"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="contato-endereco"
          className="border-gray-100 last:border-b-0"
        >
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Contato e Endereço
          </AccordionTrigger>

          <AccordionContent>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
              {[
                {
                  label: "Telefone principal",
                  value: spcData?.consumidor?.cpf
                    ? formatPhone(spcData?.consumidor?.["telefone-celular"])
                    : formatPhone(spcData?.consumidor?.telefone),
                },
                ...(spcData?.consumidor?.cpf
                  ? [
                    {
                      label: "Telefone secundário",
                      value: formatPhone(
                        spcData?.consumidor?.["telefone-residencial"],
                      ),
                    },
                  ]
                  : []),
                { label: "E-mail", value: spcData?.consumidor?.email || "–" },
                { label: "Endereço", value: enderecoCompleto },
              ].map((f) => (
                <div
                  key={f.label}
                  className={f.label === "Endereço" ? "col-span-3" : undefined}
                >
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    {f.label}
                  </p>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-800">{f.value}</p>

                    {[
                      "Telefone principal",
                      "Telefone secundário",
                      "E-mail",
                      "Endereço",
                    ].includes(f.label) &&
                      (f?.value?.length > 0 || f?.value === "-") && (
                        <CopyButton
                          value={String(f.value)}
                          title={`Copiar ${f.label}`}
                          className="text-gray-400 hover:text-[#243871] transition-colors hover:cursor-pointer"
                        />
                      )}

                    {f.label === "Endereço" && enderecoMapsQuery && (
                      <GoogleMapsButton address={enderecoMapsQuery} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="dados-adicionais-contato-spc-brasil"
          className="border-gray-100 last:border-b-0"
        >
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Dados Adicionais de Contato
          </AccordionTrigger>

          <AccordionContent>
            <div className="mt-5 border-t border-gray-100 pt-4">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                    {DADOS_ADICIONAIS_COLUMNS.map(({ label }) => (
                      <th
                        key={label}
                        className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {body.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                    >
                      {DADOS_ADICIONAIS_COLUMNS.map(
                        ({ key, label, breakWords, showMapsLink }) => (
                          <CopyableCell
                            key={key}
                            value={row[key]}
                            label={label}
                            breakWords={breakWords}
                            showMapsLink={showMapsLink}
                          />
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {spcData?.consumidor?.cpf ? (
          <></>
        ) : (
          <>
            <AccordionItem
              value="atividades-economicas-secundarias-spc-brasil"
              className="border-gray-100"
            >
              <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                Atividades Econômicas Secundárias
              </AccordionTrigger>

              <AccordionContent>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <table className="w-full text-xs table-fixed">
                    <colgroup>
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "100%" }} />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-gray-100">
                        {["CNAE", "DESCRIÇÃO CNAE"].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {spcData?.["atividade-empresa"]?.[
                        "detalhe-atividade-empresa"
                      ]?.["atividades-economicas-secundarias"].map(
                        (row: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                          >
                            <td className="py-2.5 pr-4 text-sm text-gray-800 wrap-break-word">
                              {row.code}
                            </td>

                            <td className="py-2.5 pr-4 text-sm text-gray-800">
                              {row.description}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            {administradores.length > 0 && (
              <AccordionItem
                value="administrador-spc-brasil"
                className="border-gray-100 last:border-b-0"
              >
                <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                  Administrador
                </AccordionTrigger>

                <AccordionContent>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {[
                            "Nome",
                            "Documento",
                            "Cargo",
                            "Tipo Relacionamento",
                            "Data Entrada",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {administradores.map((row: any, index: number) => {
                          const documento = String(row?.documento ?? "");
                          const documentoFormatado =
                            documento.length === 11
                              ? formatCPF(documento)
                              : documento || "-";

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                            >
                              <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                                {row?.nome ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {documentoFormatado}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {row?.["cargo-administracao"] ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {row?.["tipo-relacionamento"] ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {formatDate(row?.["data-entrada"]) || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </>
        )}
      </Accordion>
    </div>
  );
}
