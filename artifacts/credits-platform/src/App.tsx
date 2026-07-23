import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/Home";
import SpcMaxiPage from "@/pages/SpcMaxi";
import SpcMaxiResultadoPage from "@/pages/SpcMaxiResultado";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function HomeRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/verticais/credito-risco/spc-maxi");
  }, [setLocation]);

  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/home" component={HomePage} />
        <Route path="/verticais/credito-risco/spc-maxi" component={SpcMaxiPage} />
        <Route path="/verticais/credito-risco/spc-maxi/resultado" component={SpcMaxiResultadoPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
