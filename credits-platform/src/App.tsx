import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch, clearAuthSession } from "@/lib/auth";
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
import OperatorsPage from "@/pages/Operators";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "credits-platform-authenticated";
const HOME_ROUTE = "/credito-risco/325-spc-maxi";
const AUTH_TOKEN_KEY = "credits-platform-auth-token";
const AUTH_REFRESH_TOKEN_KEY = "credits-platform-refresh-token";
const AUTH_USER_KEY = "credits-platform-auth-user";
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
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
    acceptedTerms?: boolean;
    createdAt: string;
    updatedAt: string;
    companies?: OperatorCompanySummary[];
  };
}

const loginErrorMessage = (errorMessage: string | null | undefined) => {
  if (!errorMessage) {
    return "Não foi possível autenticar.";
  }

  return errorMessage;
};

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

function getStoredUser(): UserSession["user"] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) as UserSession["user"] : null;
  } catch {
    return null;
  }
}

function TermsConsentGate({
  userEmail,
  accessToken,
  onAcceptTerms,
  modal = false,
}: {
  userEmail?: string;
  accessToken?: string;
  onAcceptTerms: () => Promise<boolean>;
  modal?: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!agreed) {
      setError("Você precisa aceitar os termos de uso para continuar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const accepted = await onAcceptTerms();
    if (!accepted) {
      setError("Não foi possível confirmar os termos de uso. Tente novamente.");
    }

    setSubmitting(false);
  };

  const content = (
    <div
      className={
        modal
          ? "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20"
          : "w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
      }
    >
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-[#F5821F]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#F5821F]">
          Termos de uso
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Antes de continuar</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Para acessar a plataforma, você deve aceitar os termos de uso e as políticas aplicáveis ao uso da ferramenta.
        </p>
      </div>

      <div className="max-h-[52vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#0A1F5C]">Termo de Aceite - Plataforma Credits</h2>

          <p><strong>Bem-vindo(a)</strong></p>

          <p><strong>Aviso Importante: Novas Funcionalidades Disponíveis na Plataforma Credits</strong></p>

          <p>
            Agora as suas consultas do SPC Brasil serão feitas por meio da plataforma da Credits para
            oferecer a você uma experiência ainda melhor.
          </p>

          <p>
            Além dos Produtos já disponibilizados, você terá acesso a Novos Produtos e Funcionalidades
            que trarão novas oportunidades e ferramentas avançadas à disposição. Algumas funcionalidades
            podem resultar em cobranças adicionais, somente se utilizadas. Para mais informações,
            contate o seu consultor comercial.
          </p>

          <p>
            Os seus contratos atuais com a Credits Brasil permanecem inalterados. Enviamos para o seu e-mail um guia
            de utilização detalhado para facilitar sua adaptação.
          </p>

          <p><strong>Ciente dos termos, você concorda que:</strong></p>

          <ul className="list-disc space-y-2 pl-5">
            <li>O contrato originário fica aditado para incluir o acesso à nova Plataforma Credits.</li>
            <li>Novas funcionalidades poderão ser contratadas diretamente pela plataforma mediante clique.</li>
            <li>
              Algumas funcionalidades podem resultar em cobranças adicionais somente se utilizadas, como
              já ocorre na utilização de insumos opcionais complementares.
            </li>
          </ul>

          <p>
            Transforme seu negócio com a Credits: serviços e produtos para análise de concessão,
            recuperação de crédito e prevenção à fraude, garantindo que você venda mais e com maior
            segurança.
          </p>

          <p><strong>Termos de Uso e Disclaimer</strong></p>

          <p>
            Ao acessar e utilizar este serviço de consulta de dados, o usuário concorda com os seguintes
            termos e condições:
          </p>

          <p><strong>Propriedade Intelectual:</strong></p>
          <p>
            Todos os direitos sobre os dados coletados permanecem com os respectivos proprietários. O uso
            das informações deve respeitar as leis de direitos autorais, propriedade intelectual aplicáveis
            e as regras disciplinadas em contrato firmado entre as partes.
          </p>

          <p><strong>Uso dos Dados:</strong></p>
          <p>
            O serviço utiliza crawlers para coletar dados disponíveis publicamente nos sites de tribunais do
            Brasil. Esses dados são fornecidos "como estão" e sem garantias de precisão, atualidade ou
            completude. A responsabilidade pelo uso das informações obtidas é exclusivamente do usuário.
          </p>

          <p><strong>Limitação de Responsabilidade:</strong></p>
          <p>
            Exceto nos casos de violação de obrigações legais ou previstos em contrato firmado entre as
            partes, a Credits não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou
            consequenciais decorrentes do uso ou da incapacidade de uso do serviço. Isso inclui, mas não se
            limita a, erros, omissões ou interrupções nas informações.
          </p>

          <p><strong>Alterações no Serviço:</strong></p>
          <p>
            Reserva-se o direito de modificar ou interromper o serviço a qualquer momento, sem aviso prévio.
            Isso inclui a alteração de dados disponíveis e a forma como são apresentados.
          </p>

          <p><strong>Conformidade Legal:</strong></p>
          <p>
            O usuário concorda em usar o serviço de acordo com todas as leis e regulamentos aplicáveis. É
            sua responsabilidade garantir que o uso dos dados esteja em conformidade com a legislação vigente.
          </p>

          <p><strong>Aceitação dos Termos:</strong></p>
          <p>
            Ao utilizar o serviço, o usuário declara ter lido, compreendido e aceitado estes termos de uso.
            Se o usuário não concorda com algum dos termos acima, recomenda-se que não utilize o serviço.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#F5821F] focus:ring-[#F5821F]"
          />
          <span>Li e aceito os termos de uso da plataforma.</span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#F5821F] px-4 py-3 font-bold text-white shadow-lg shadow-[#F5821F]/20 transition-all hover:bg-[#F5821F]/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Confirmando..." : "Aceitar termos e continuar"}
        </button>
      </form>
    </div>
  );

  if (modal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] p-6 text-[#0A1F5C]">
      {content}
    </div>
  );
}

function Router({
  isAuthenticated,
  hasAcceptedTerms,
  onLogin,
  onLogout,
  onAcceptTerms,
}: {
  isAuthenticated: boolean;
  hasAcceptedTerms: boolean;
  onLogin: (username: string, password: string) => Promise<string | null>;
  onLogout: () => void;
  onAcceptTerms: () => Promise<boolean>;
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

  if (!hasAcceptedTerms) {
    const storedUser = getStoredUser();
    return (
      <Layout onLogout={onLogout}>
        <div className="relative min-h-[calc(100vh-80px)] bg-[#F4F6FA]">
          <HomePage />
          <TermsConsentGate
            userEmail={storedUser?.email}
            accessToken={localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined}
            onAcceptTerms={onAcceptTerms}
            modal
          />
        </div>
      </Layout>
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
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    if (typeof window === "undefined") return true;
    const storedUser = getStoredUser();
    return storedUser ? storedUser.acceptedTerms !== false : true;
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
        return loginErrorMessage(data?.message ?? null);
      }

      const session = data.session as UserSession;

      if (!session?.accessToken || !session?.user) {
        return "Não foi possível autenticar.";
      }

      const acceptedTerms = session.user.acceptedTerms ?? false;

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, session.refreshToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...session.user, acceptedTerms }));
      setIsAuthenticated(true);
      setHasAcceptedTerms(acceptedTerms);
      return null;
    } catch {
      return "Não foi possível autenticar.";
    }
  };

  const handleAcceptTerms = async () => {
    const storedUser = getStoredUser();
    const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedUser?.email || !accessToken) {
      return false;
    }

    try {
      const response = await apiFetch(`${API_URL}/api/auth/user/accept-terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: storedUser.email }),
      });

      if (!response.ok) {
        return false;
      }

      const updatedUser = { ...storedUser, acceptedTerms: true };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      setHasAcceptedTerms(true);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setHasAcceptedTerms(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router
            isAuthenticated={isAuthenticated}
            hasAcceptedTerms={hasAcceptedTerms}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onAcceptTerms={handleAcceptTerms}
          />
        </WouterRouter>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
