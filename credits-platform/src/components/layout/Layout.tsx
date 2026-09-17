import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HEADER_HEIGHT = 68;
const SEARCH_PATHS = [
  "325-spc-maxi",
  "629-spc-positivo-intermediario-pj",
  "695-spc-mais",
  "668-spc-avancada-pj",
  "323-novo-spc-mix-mais",
  "337-spc-relatorio-pj"
].map((product) => `/credito-risco/${product}`);

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const isSearchPage = SEARCH_PATHS.includes(location);
  const isResultPage = SEARCH_PATHS.some(
    (path) => location === `${path}/resultado`,
  );

  console.log("isResultPage", isResultPage);

  useEffect(() => {
    if (isResultPage) {
      setCollapsed(true);
    }
  }, [isResultPage]);

  console.log(collapsed)

  useEffect(() => {
    if (!isSearchPage) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isSearchPage]);

  return (
    <div className="h-screen bg-background" data-print-layout-root>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        headerHeight={HEADER_HEIGHT}
      />  
      <Header sidebarCollapsed={collapsed} onLogout={onLogout} />
      <main
        data-print-content
        className={
          isSearchPage
            ? "overflow-hidden px-25 py-6 lg:px-10"
            : "px-25 py-6 lg:px-10"
        }
        style={
          isSearchPage
            ? {
                marginLeft: collapsed ? "64px" : "350px",
                marginTop: `${HEADER_HEIGHT}px`,
                transition: "margin-left 0.3s ease",
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
                overflow: "hidden",
              }
            : {
                marginLeft: collapsed ? "64px" : "350px",
                marginTop: `${HEADER_HEIGHT}px`,
                transition: "margin-left 0.3s ease",
              }
        }
      >
        <div
          data-print-container
          className={
            isSearchPage
              ? "mx-auto h-full w-full px-7.5 overflow-hidden"
              : "mx-auto w-full px-7.5"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
