import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import SpcMaxiPage from "@/pages/SpcMaxi";
import SpcMaxiResultadoPage from "@/pages/SpcMaxiResultado";
import NotFound from "@/pages/not-found";
import OperatorsPage from "@/pages/Operators";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "credits-platform-authenticated";
const AUTH_TOKEN_KEY = "credits-platform-auth-token";
const AUTH_USER_KEY = "credits-platform-auth-user";
const HOME_ROUTE = "/verticais/credito-risco/spc-maxi";
const API_URL = import.meta.env.VITE_API_URL

interface OperatorCompanySummary {
  id: string;
  name: string;
  cnpj: string;
  role?: "ADMIN" | "OPERATOR";
  companyStatus?: "ACTIVE" | "INACTIVE";
}

interface UserSession {
  accessToken: string;
  user: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    companies?: OperatorCompanySummary[];
  };
}

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
  onLogin: (username: string, password: string) => Promise<boolean>;
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
        <Route path="/verticais/credito-risco/spc-maxi" component={SpcMaxiPage} />
        <Route path="/verticais/credito-risco/spc-maxi/resultado" component={SpcMaxiResultadoPage} />
        <Route path="/configuracoes/operadores" component={OperatorsPage} />
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

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return false;
      }

      const session = data.session as UserSession;

      if (!session?.accessToken || !session?.user) {
        return false;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
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
