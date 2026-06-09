import { useState, useMemo } from "react";
import { Search, ShieldCheck, TrendingUp, Users, Network, Info, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

type DocType = "cpf" | "cnpj";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value: string) {
  // Allow alphanumeric: strip everything except letters and digits, uppercase
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 14);
  const p1 = clean.slice(0, 2);
  const p2 = clean.slice(2, 5);
  const p3 = clean.slice(5, 8);
  const p4 = clean.slice(8, 12);
  const p5 = clean.slice(12, 14);
  if (clean.length <= 2) return p1;
  if (clean.length <= 5) return `${p1}.${p2}`;
  if (clean.length <= 8) return `${p1}.${p2}.${p3}`;
  if (clean.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

function cnpjCharValue(ch: string): number {
  // Receita Federal spec: use charCode - 48 for all chars
  // digits: '0'=0 … '9'=9 | letters: 'A'=17 … 'Z'=42
  return ch.toUpperCase().charCodeAt(0) - 48;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10]);
}

function validateCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (clean.length !== 14) return false;
  // Reject all-same sequences
  if (/^(.)\1+$/.test(clean)) return false;
  // Last 2 must be digits (check digits)
  if (!/^\d$/.test(clean[12]) || !/^\d$/.test(clean[13])) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const calcDigit = (weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + cnpjCharValue(clean[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calcDigit(w1) === parseInt(clean[12]) && calcDigit(w2) === parseInt(clean[13]);
}

interface Insumo { id: string; label: string; }
interface InsumoGroup { id: string; title: string; icon: React.ElementType; items: Insumo[]; }

const insumoGroups: InsumoGroup[] = [
  {
    id: "risco-credito", title: "Risco de Crédito", icon: ShieldCheck,
    items: [
      { id: "score-12m", label: "Score 12 meses" },
      { id: "limite-credito", label: "Limite de Crédito sugerido" },
      { id: "scr", label: "SCR — Sistema de Informações de Crédito" },
    ],
  },
  {
    id: "informacoes-positivas", title: "Informações Positivas", icon: TrendingUp,
    items: [
      { id: "renda-presumida", label: "Renda presumida" },
      { id: "pontualidade", label: "Pontualidade de pagamento" },
    ],
  },
  {
    id: "comportamentais", title: "Comportamentais & Cadastrais", icon: Users,
    items: [
      { id: "dados-cadastrais", label: "Dados cadastrais completos" },
      { id: "consultas-mercado", label: "Consultas de mercado (12m)" },
    ],
  },
  {
    id: "vinculos", title: "Vínculos & Relacionamentos", icon: Network,
    items: [
      { id: "parentes-vinculos", label: "Parentes e vínculos" },
      { id: "empresas-relacionadas", label: "Empresas relacionadas" },
    ],
  },
];

const DEFAULT_SELECTED = new Set(["score-12m", "renda-presumida", "dados-cadastrais", "parentes-vinculos"]);

export default function SpcMaxiPage() {
  const [docType, setDocType] = useState<DocType>("cpf");
  const [documento, setDocumento] = useState("");
  const [touched, setTouched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_SELECTED));
  const [rememberInsumos, setRememberInsumos] = useState(false);

  const rawClean = docType === "cpf"
    ? documento.replace(/\D/g, "")
    : documento.replace(/[^a-zA-Z0-9]/g, "");
  const isComplete = docType === "cpf" ? rawClean.length === 11 : rawClean.length === 14;
  const isValid = useMemo(() => {
    if (!isComplete) return null;
    return docType === "cpf" ? validateCpf(documento) : validateCnpj(documento);
  }, [documento, docType, isComplete]);

  const showError = touched && isComplete && isValid === false;
  const showSuccess = isComplete && isValid === true;
  const canSubmit = showSuccess;

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setDocumento("");
    setTouched(false);
  };

  const handleDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDocumento(docType === "cpf" ? formatCpf(raw) : formatCnpj(raw));
    if (!touched) setTouched(true);
  };

  const toggleInsumo = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">SPC MAXI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta completa de crédito e risco para pessoas físicas. Detalhes a definir.
        </p>
      </div>

      {/* Query block */}
      <form onSubmit={handleConsultar} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-6">
          {/* ── Left: Documento ── */}
          <div className="flex-1 min-w-0 basis-1/2">
            <p className="text-sm font-medium text-gray-700 mb-2">Documento</p>
            <div className="flex items-center gap-2">
              {/* CPF / CNPJ toggle */}
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 flex-shrink-0">
                {(["cpf", "cnpj"] as DocType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDocTypeChange(type)}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: docType === type ? "#243871" : "transparent",
                      color: docType === type ? "white" : "#6b7280",
                    }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Input + validation icon */}
              <div className="relative">
                <input
                  type="text"
                  value={documento}
                  onChange={handleDocumento}
                  onBlur={() => setTouched(true)}
                  placeholder={docType === "cpf" ? "000.000.000-00" : "AB.CDE.FGH/0001-00"}
                  className="w-56 rounded-lg border px-3.5 py-2 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                  style={{
                    borderColor: showError ? "#ef4444" : showSuccess ? "#22c55e" : "#d1d5db",
                    boxShadow: showError
                      ? "0 0 0 2px rgba(239,68,68,0.12)"
                      : showSuccess
                      ? "0 0 0 2px rgba(34,197,94,0.12)"
                      : undefined,
                  }}
                />
                {showError && (
                  <AlertCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                )}
                {showSuccess && (
                  <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition whitespace-nowrap"
                style={{
                  backgroundColor: canSubmit ? "#243871" : "#9ca3af",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  opacity: canSubmit ? 1 : 0.7,
                }}
              >
                <Search size={14} />
                Consultar
              </button>
            </div>

            {showError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} />
                {docType === "cpf" ? "CPF inválido. Verifique os dígitos informados." : "CNPJ inválido. Verifique os dígitos informados."}
              </p>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="w-px bg-gray-200 self-stretch" />

          {/* ── Right: Insumos ── */}
          <div className="flex-1 min-w-0 basis-1/2">
            <p className="text-sm font-medium text-gray-700 mb-2">Insumos</p>

            {/* Checkbox row */}
            <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={rememberInsumos}
                onChange={(e) => setRememberInsumos(e.target.checked)}
              />
              <span
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition peer-checked:border-transparent"
                style={{
                  borderColor: rememberInsumos ? "#243871" : "#d1d5db",
                  backgroundColor: rememberInsumos ? "#243871" : "white",
                }}
              >
                {rememberInsumos && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-700">Lembrar Insumos na Próxima Consulta</span>
            </label>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
              <p className="text-xs text-amber-700 leading-snug">
                Ao selecionar a função Lembrar Insumos, a seleção de Insumos para uma nova consulta, será automaticamente habilitada conforme a última consulta. Insumos podem gerar custos adicionais.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Insumos Opcionais */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Insumos Opcionais</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insumoGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{group.title}</span>
                </div>
                <Info size={14} className="text-gray-300 cursor-pointer hover:text-gray-400" />
              </div>
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const checked = selected.has(item.id);
                  return (
                    <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={checked} onChange={() => toggleInsumo(item.id)} className="hidden" />
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all"
                        style={{ backgroundColor: checked ? "#243871" : "white", borderColor: checked ? "#243871" : "#d1d5db" }}
                      >
                        {checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors flex items-center gap-1.5">
                        {item.label}
                        <Info size={12} className="text-gray-300 hover:text-gray-400 cursor-pointer flex-shrink-0" />
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
