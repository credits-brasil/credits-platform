import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HEADER_HEIGHT = 68;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    if (location === "/verticais/credito-risco/spc-maxi/resultado") {
      setCollapsed(true);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        headerHeight={HEADER_HEIGHT}
      />
      <Header sidebarCollapsed={collapsed} />
      <main
        className="py-8 px-6 lg:px-10"
        style={{
          marginLeft: collapsed ? "64px" : "240px",
          marginTop: `${HEADER_HEIGHT}px`,
          transition: "margin-left 0.3s ease",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
