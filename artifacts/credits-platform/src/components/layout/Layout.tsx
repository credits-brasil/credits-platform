import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Header sidebarCollapsed={collapsed} />
      <main
        style={{
          marginLeft: collapsed ? "64px" : "240px",
          marginTop: "56px",
          transition: "margin-left 0.3s ease",
          minHeight: "calc(100vh - 56px)",
          padding: "24px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
