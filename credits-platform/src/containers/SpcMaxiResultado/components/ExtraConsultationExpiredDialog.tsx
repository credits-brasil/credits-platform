import { Clock } from "lucide-react";
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

type ExtraConsultationExpiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  windowMs: number;
  onNewConsultation: () => void;
};

function formatWindow(windowMs: number) {
  const minutes = Math.max(1, Math.round(windowMs / 60_000));
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

export function ExtraConsultationExpiredDialog({
  open,
  onOpenChange,
  windowMs,
  onNewConsultation,
}: ExtraConsultationExpiredDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:rounded-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
            >
              <Clock size={20} aria-hidden="true" />
            </div>

            <div>
              <AlertDialogTitle className="text-left text-base font-semibold text-slate-800">
                Prazo para consultas adicionais encerrado
              </AlertDialogTitle>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
                Consulta adicional indisponível
              </p>
            </div>

            <AlertDialogDescription className="text-sm leading-6 text-slate-600">
              As consultas adicionais só podem ser feitas em até{" "}
              {formatWindow(windowMs)} após a consulta. Para consultar outros
              insumos, faça uma nova consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <AlertDialogCancel className="border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 cursor-pointer">
            Fechar
          </AlertDialogCancel>

          <AlertDialogAction
            className="bg-[#243871] text-white hover:bg-[#1d2d5f] cursor-pointer"
            onClick={onNewConsultation}
          >
            Nova consulta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
