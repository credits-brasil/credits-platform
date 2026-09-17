import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

import { formatCNPJ } from "@/utils/formatCNPJ";

interface CompanyOption {
  id: string;
  name: string;
  cnpj: string;
  role?: "ADMIN" | "OPERATOR";
  companyStatus?: "ACTIVE" | "INACTIVE";
}

const SELECTED_COMPANY_STORAGE_KEY = "credits-platform-selected-company";

export default function CompanySelector() {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selected, setSelected] = useState<CompanyOption | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("credits-platform-auth-user");

    if (!storedUser) {
      setCompanies([]);
      setSelected(null);
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
      return;
    }

    try {
      const user = JSON.parse(storedUser) as { companies?: CompanyOption[] };
      const availableCompanies = user.companies ?? [];
      const storedSelected = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      const storedSelectedCompany = storedSelected ? JSON.parse(storedSelected) as CompanyOption : null;
      const nextSelected =
        availableCompanies.find((company) => company.id === storedSelectedCompany?.id) ??
        availableCompanies[0] ??
        null;

      setCompanies(availableCompanies);
      setSelected(nextSelected);

      if (nextSelected) {
        localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, JSON.stringify(nextSelected));
      } else {
        localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
      }
    } catch {
      setCompanies([]);
      setSelected(null);
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!companies.length || !selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
        Nenhuma empresa vinculada
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        style={{ minWidth: "320px" }}
      >
        <span className="text-sm font-semibold text-gray-800 truncate flex-1 text-left">
          {selected.name}
        </span>
        <ChevronDown
          size={14}
          className="text-gray-400 flex-shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{ minWidth: "100%" }}
        >
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                setSelected(company);
                localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, JSON.stringify(company));
                window.dispatchEvent(new Event("credits-platform-company-change"));
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate">{company.name}</span>
                <span className="text-xs text-gray-400">{formatCNPJ(company.cnpj)}</span>
              </div>
              {selected.id === company.id && (
                <Check size={14} className="flex-shrink-0" style={{ color: "#ED884A" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
