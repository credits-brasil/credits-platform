import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InputComponent } from "@/components";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCpf } from "@/utils/formatCPF";
import { formatPhone } from "@/utils/formatPhone";
import { validateCPF } from "@/utils/validateCPF";

const API_URL = import.meta.env.VITE_API_URL;

type OperatorRole = "ADMIN" | "OPERATOR";
type CompanyRelation = {
  id: string;
  name: string;
  cnpj: string;
  role?: OperatorRole;
  companyStatus?: "ACTIVE" | "INACTIVE";
};

type OperatorCompanyStatus = "ACTIVE" | "INACTIVE";

type CompanyOperator = {
  id: string;
  companyId: string;
  operatorId: string;
  role: OperatorRole;
  status: OperatorCompanyStatus;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    password?: string;
    createdAt: string;
    updatedAt: string;
  };
  company: {
    id: string;
    name: string;
    cnpj: string;
    status: "ACTIVE" | "INACTIVE" | "DELETED";
  };
};

type OperatorFormState = {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  role: OperatorRole;
};

const EMPTY_FORM_STATE: OperatorFormState = {
  name: "",
  cpf: "",
  email: "",
  phone: "",
  role: "OPERATOR",
};

const ROLE_LABEL: Record<OperatorRole, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

const OPERATOR_STATUS_LABEL: Record<OperatorCompanyStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

const OPERATOR_STATUS_VARIANT: Record<OperatorCompanyStatus, "default" | "secondary"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
};

async function listCompanyOperators(companyId: string): Promise<CompanyOperator[]> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Não foi possível carregar os operadores.");
  }

  const payload = await response.json();
  return payload.operators ?? [];
}

async function createCompanyOperator(companyId: string, payload: Record<string, string>) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível criar o operador.");
  }

  return data.companyOperator;
}

async function updateCompanyOperator(companyId: string, id: string, payload: Record<string, string>) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar o operador.");
  }

  return data.companyOperator;
}

async function deleteCompanyOperator(companyId: string, id: string) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators/${id}`, {
    method: "DELETE",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível inativar o operador.");
  }

  return data.companyOperator;
}

export default function OperatorsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCompany, setSelectedCompany] = useState<CompanyRelation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<CompanyOperator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyOperator | null>(null);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<OperatorFormState>(EMPTY_FORM_STATE);

  useEffect(() => {
    const storedCompany = localStorage.getItem("credits-platform-selected-company");
    if (!storedCompany) {
      setSelectedCompany(null);
      return;
    }

    try {
      const parsed = JSON.parse(storedCompany) as CompanyRelation;
      setSelectedCompany(parsed);
    } catch {
      setSelectedCompany(null);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const storedCompany = localStorage.getItem("credits-platform-selected-company");
      if (!storedCompany) {
        setSelectedCompany(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedCompany) as CompanyRelation;
        setSelectedCompany(parsed);
      } catch {
        setSelectedCompany(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sessionUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("credits-platform-auth-user");
      return storedUser
        ? (JSON.parse(storedUser) as { id?: string; companies?: CompanyRelation[] })
        : null;
    } catch {
      return null;
    }
  }, [selectedCompany]);

  const loggedOperatorId = sessionUser?.id ?? null;
  const selectedCompanyRole =
    sessionUser?.companies?.find((company) => company.id === selectedCompany?.id)?.role ?? "OPERATOR";
  const isAdminForSelectedCompany = selectedCompanyRole === "ADMIN";

  const {
    data: operators = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["company-operators", selectedCompany?.id],
    queryFn: () => listCompanyOperators(selectedCompany!.id),
    enabled: !!selectedCompany && isAdminForSelectedCompany,
  });

  const createMutation = useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: Record<string, string> }) =>
      createCompanyOperator(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-operators", selectedCompany?.id] });
      toast({ title: "Operador criado com sucesso." });
      setIsDrawerOpen(false);
      setFormState(EMPTY_FORM_STATE);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ companyId, id, payload }: { companyId: string; id: string; payload: Record<string, string> }) =>
      updateCompanyOperator(companyId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-operators", selectedCompany?.id] });
      toast({ title: "Operador atualizado com sucesso." });
      setIsDrawerOpen(false);
      setFormState(EMPTY_FORM_STATE);
      setEditingOperator(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => deleteCompanyOperator(companyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-operators", selectedCompany?.id] });
      toast({ title: "Operador inativado com sucesso." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const toggleOperatorStatus = (operator: CompanyOperator) => {
    if (!selectedCompany) {
      return;
    }

    const nextStatus: OperatorCompanyStatus = operator.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    updateMutation.mutate({
      companyId: selectedCompany.id,
      id: operator.id,
      payload: {
        role: operator.role,
        status: nextStatus,
      },
    });
  };

  const filteredOperators = useMemo(() => {
    const visibleOperators = operators.filter((operator) => operator.operator.id !== loggedOperatorId);
    const term = search.trim().toLowerCase();

    if (!term) {
      return visibleOperators;
    }

    return visibleOperators.filter((operator) => {
      const values = [
        operator.operator.name,
        operator.operator.cpf,
        operator.operator.email,
      ];

      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [operators, loggedOperatorId, search]);

  const openCreateDrawer = () => {
    setEditingOperator(null);
    setFormState(EMPTY_FORM_STATE);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (operator: CompanyOperator) => {
    setEditingOperator(operator);
    setFormState({
      name: operator.operator.name,
      cpf: operator.operator.cpf,
      email: operator.operator.email,
      phone: operator.operator.phone,
      role: operator.role,
    });
    setIsDrawerOpen(true);
  };

  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCompany) {
      toast({ title: "Selecione uma empresa primeiro.", variant: "destructive" });
      return;
    }

    const cleanCpf = formState.cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      toast({ title: "CPF inválido.", variant: "destructive" });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      cpf: cleanCpf,
      email: formState.email.trim().toLowerCase(),
      phone: formState.phone.trim(),
      role: formState.role,
    };

    if (editingOperator) {
      updateMutation.mutate({
        companyId: selectedCompany.id,
        id: editingOperator.id,
        payload,
      });
      return;
    }

    createMutation.mutate({ companyId: selectedCompany.id, payload });
  };

  if (!selectedCompany) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 text-gray-400" size={26} />
        <h1 className="text-xl font-semibold text-gray-800">Empresa não selecionada</h1>
        <p className="mt-2 text-sm text-gray-500">
          Selecione uma empresa no cabeçalho para gerenciar os operadores.
        </p>
      </div>
    );
  }

  if (!isAdminForSelectedCompany) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 text-amber-600" size={28} />
        <h1 className="text-xl font-semibold text-amber-900">Sem permissão</h1>
        <p className="mt-2 text-sm text-amber-800">
          Apenas administradores da empresa selecionada podem acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Operadores</h1>
          <p className="text-sm text-gray-500">
            Gerencie os operadores vinculados a {selectedCompany.name}.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={16} className="mr-2" />
          Novo operador
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Operadores da empresa</CardTitle>

          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CPF ou e-mail"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-gray-300"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 size={15} className="mr-2 animate-spin" />
              Carregando operadores...
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-red-500">
              Não foi possível carregar os operadores desta empresa.
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Nenhum operador encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium text-gray-800">{operator.operator.name}</TableCell>
                    <TableCell>{operator.operator.cpf}</TableCell>
                    <TableCell>{operator.operator.email}</TableCell>
                    <TableCell>{ROLE_LABEL[operator.role]}</TableCell>
                    <TableCell>
                      <Badge variant={OPERATOR_STATUS_VARIANT[operator.status]}>
                        {OPERATOR_STATUS_LABEL[operator.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDrawer(operator)}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant={operator.status === "ACTIVE" ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleOperatorStatus(operator)}
                        >
                          {operator.status === "ACTIVE" ? "Inativar" : "Ativar"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(operator)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="inset-y-0 right-0 m-0 ml-auto h-full w-full max-w-xl rounded-none border-l bg-background shadow-lg">
          <DrawerHeader>
            <DrawerTitle>{editingOperator ? "Editar operador" : "Novo operador"}</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={submitForm} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="operator-name">Nome</Label>
              <InputComponent
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-cpf">CPF</Label>
              <InputComponent
                value={formState.cpf}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, cpf: formatCpf(event.target.value, "input") }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-email">E-mail</Label>
              <InputComponent
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-phone">Telefone</Label>
              <InputComponent
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, phone: formatPhone(event.target.value) }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={formState.role}
                onValueChange={(value: OperatorRole) =>
                  setFormState((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DrawerFooter className="flex-row justify-end gap-2 p-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingOperator ? "Salvar" : "Criar"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar operador</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação deixa o operador inativo para esta empresa sem remover o cadastro global.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!selectedCompany || !deleteTarget) return;
                deleteMutation.mutate({ companyId: selectedCompany.id, id: deleteTarget.id });
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
