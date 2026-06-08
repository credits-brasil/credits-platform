import { useState } from "react";
import {
  Home,
  BookOpen,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightSm,
  FileText,
} from "lucide-react";

const SIDEBAR_BG = "#243871";
const SIDEBAR_BORDER = "#1a2a56";
const SIDEBAR_HOVER = "#2e4590";
const SIDEBAR_SUB_BG = "#1c2d5e";
const SIDEBAR_SUB_HOVER = "#243070";
const SIDEBAR_BADGE = "#4a7fd4";

interface SubItem {
  label: string;
  path: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: SubItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/",
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: BookOpen,
    subItems: [
      { label: "Relatório 1", path: "/catalogo/relatorio-1" },
      { label: "Relatório 2", path: "/catalogo/relatorio-2" },
    ],
  },
  {
    id: "credito",
    label: "Crédito",
    icon: CreditCard,
    subItems: [
      { label: "Relatório A", path: "/credito/relatorio-a" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    catalogo: true,
    credito: false,
  });

  const toggleExpand = (id: string) => {
    if (collapsed) return;
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className="fixed top-0 left-0 z-40 flex flex-col"
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        backgroundColor: SIDEBAR_BG,
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center border-b"
        style={{
          height: "56px",
          borderColor: SIDEBAR_BORDER,
          padding: collapsed ? "0 0 0 18px" : "0 16px",
          transition: "padding 0.3s ease",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center rounded-md text-white font-bold text-sm flex-shrink-0"
            style={{
              width: "28px",
              height: "28px",
              backgroundColor: SIDEBAR_BADGE,
            }}
          >
            C
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-base tracking-wide whitespace-nowrap overflow-hidden">
              Credits
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems[item.id];

          return (
            <div key={item.id}>
              <button
                onClick={() => hasSubItems ? toggleExpand(item.id) : undefined}
                title={collapsed ? item.label : undefined}
                className="w-full flex items-center group text-left"
                style={{
                  height: "40px",
                  padding: collapsed ? "0 0 0 18px" : "0 12px",
                  color: "rgba(255,255,255,0.85)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = SIDEBAR_HOVER;
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
                }}
              >
                <Icon size={17} className="flex-shrink-0" style={{ minWidth: "17px" }} />
                {!collapsed && (
                  <>
                    <span className="ml-3 text-sm font-medium whitespace-nowrap flex-1 overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                    {hasSubItems && (
                      <span className="ml-auto flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRightSm size={14} />
                        )}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Sub-items */}
              {hasSubItems && !collapsed && isExpanded && (
                <div style={{ backgroundColor: SIDEBAR_SUB_BG }}>
                  {item.subItems!.map((sub) => (
                    <a
                      key={sub.path}
                      href={sub.path}
                      className="flex items-center"
                      style={{
                        height: "36px",
                        padding: "0 12px 0 40px",
                        color: "rgba(255,255,255,0.65)",
                        fontSize: "13px",
                        textDecoration: "none",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = SIDEBAR_SUB_HOVER;
                        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.95)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.65)";
                      }}
                    >
                      <FileText size={13} className="flex-shrink-0 mr-2" style={{ opacity: 0.7 }} />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{sub.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle button */}
      <div
        className="flex items-center border-t"
        style={{
          height: "48px",
          borderColor: SIDEBAR_BORDER,
          padding: collapsed ? "0 0 0 14px" : "0 12px",
          justifyContent: collapsed ? "flex-start" : "flex-end",
        }}
      >
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="flex items-center justify-center rounded-md"
          style={{
            width: "32px",
            height: "32px",
            color: "rgba(255,255,255,0.6)",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = SIDEBAR_HOVER;
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
