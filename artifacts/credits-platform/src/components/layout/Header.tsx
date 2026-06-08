import { Bell, ChevronDown, User } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export default function Header({ sidebarCollapsed }: HeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm px-6"
      style={{
        left: sidebarCollapsed ? "64px" : "240px",
        height: "56px",
        transition: "left 0.3s ease",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Plataforma Credits</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            <User size={16} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-800">Usuário</span>
            <span className="text-xs text-gray-500">usuario@credits.com</span>
          </div>
          <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors ml-1" />
        </div>
      </div>
    </header>
  );
}
