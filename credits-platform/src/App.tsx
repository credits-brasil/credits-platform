import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import SpcMaxiPage from "@/pages/325SpcMaxi";
import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import SpcMixMaisPage from "@/pages/323NovoSpcMixMais";
import SpcMixMaisResultadoPage from "@/pages/323NovoSpcMixMaisResultado";
import SpcRelatorioPage from "@/pages/337SpcRelatorioPj";
import SpcRelatorioResultadoPage from "@/pages/337SpcRelatorioPjResultado";
import SpcAvancadaPage from "@/pages/668SpcAvancadaPj";
import SpcAvancadaResultadoPage from "@/pages/668SpcAvancadaPjResultado";
import SpcMaisPage from "@/pages/695SpcMais";
import SpcMaisResultadoPage from "@/pages/695SpcMaisResultado";
import SpcPositivoIntermediarioPjPage from "@/pages/629SpcPositivoIntermediarioPj";
import SpcPositivoIntermediarioPjResultadoPage from "@/pages/629SpcPositivoIntermediarioPjResultado";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "credits-platform-authenticated";
const HOME_ROUTE = "/credito-risco/325-spc-maxi";

function HomeRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(HOME_ROUTE);
  }, [setLocation]);

  return null;
}

function ProtectedLoginRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(HOME_ROUTE);
  }, [setLocation]);

  return null;
}

function LoginRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}

function Router({
  isAuthenticated,
  onLogin,
  onLogout,
}: {
  isAuthenticated: boolean;
  onLogin: (username: string, password: string) => boolean;
  onLogout: () => void;
}) {
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/">
          <LoginPage onLogin={onLogin} />
        </Route>
        <Route component={LoginRedirect} />
      </Switch>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Switch>
        <Route path="/login" component={ProtectedLoginRedirect} />
        <Route path="/" component={HomeRedirect} />
        <Route path="/home" component={HomePage} />
        <Route path="/credito-risco/325-spc-maxi" component={SpcMaxiPage} />
        <Route path="/credito-risco/325-spc-maxi/resultado">
          <SpcMaxiResultadoPage />
        </Route>
        <Route path="/credito-risco/629-spc-positivo-intermediario-pj" component={SpcPositivoIntermediarioPjPage} />
        <Route path="/credito-risco/629-spc-positivo-intermediario-pj/resultado" component={SpcPositivoIntermediarioPjResultadoPage} />
        <Route path="/credito-risco/695-spc-mais" component={SpcMaisPage} />
        <Route path="/credito-risco/695-spc-mais/resultado" component={SpcMaisResultadoPage} />
        <Route path="/credito-risco/668-spc-avancada-pj" component={SpcAvancadaPage} />
        <Route path="/credito-risco/668-spc-avancada-pj/resultado" component={SpcAvancadaResultadoPage} />
        <Route path="/credito-risco/323-novo-spc-mix-mais" component={SpcMixMaisPage} />
        <Route path="/credito-risco/323-novo-spc-mix-mais/resultado" component={SpcMixMaisResultadoPage} />
        <Route path="/credito-risco/337-spc-relatorio-pj" component={SpcRelatorioPage} />
        <Route path="/credito-risco/337-spc-relatorio-pj/resultado" component={SpcRelatorioResultadoPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
  });

  const handleLogin = (username: string, password: string) => {
    const hasValidCredentials =
      username.trim().toLowerCase() === "admin" && password === "123456";

    if (!hasValidCredentials) {
      return false;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </WouterRouter>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
