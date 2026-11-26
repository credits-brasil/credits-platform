import { useEffect, useRef, useState } from "react";
import SpcMaxiResultadoPage, { type ConsultationSnapshot } from "@/pages/325SpcMaxiResultado";
import { getResultProduct, type SpcResultProduct } from "@/constants/result-products";
import { StickyIdentificationProvider } from "@/hooks/useStickyIdentification";
import { findResultProductCode } from "@/utils/findResultProductCode";
import {
  VIEWER_MESSAGE,
  describeReceivedData,
  getManagerTargetOrigins,
  getSpcData,
  isAllowedManagerOrigin,
  parseViewerPayload,
} from "@/lib/consultationViewer";

type ViewerState =
  | { status: "waiting" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      key: string;
      product: SpcResultProduct | undefined;
      snapshot: ConsultationSnapshot;
    };

const INVALID_PAYLOAD_MESSAGE = "Os dados desta consulta não puderam ser exibidos.";

function ViewerMessage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Read-only result page for a stored consultation, embedded by credits-platform-manager.
 * It renders the exact same report as the operator saw, from data posted by the manager,
 * and never calls the consultation API. Lives outside the login gate and the app layout.
 */
export default function ConsultationViewerPage() {
  const isEmbedded = window.parent !== window;
  const [state, setState] = useState<ViewerState>({ status: "waiting" });
  const managerOriginRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isAllowedManagerOrigin(event.origin)) return;
      if (event.data?.type !== VIEWER_MESSAGE.snapshot) return;

      managerOriginRef.current = event.origin;
      const fail = (message: string) => {
        setState({ status: "error", message });
        window.parent.postMessage({ type: VIEWER_MESSAGE.error, message }, event.origin);
      };

      const payload = parseViewerPayload(event.data.payload);
      if (!payload) {
        fail(INVALID_PAYLOAD_MESSAGE);
        return;
      }

      const spc = getSpcData(payload);
      if (!spc) {
        fail(`${INVALID_PAYLOAD_MESSAGE} Formato recebido: ${describeReceivedData(payload)}.`);
        return;
      }

      const code = findResultProductCode(payload.productName) ?? "325";
      setState({
        status: "ready",
        key: `${payload.document}-${payload.consultedAt}`,
        product: getResultProduct(code),
        snapshot: {
          request: {
            document: payload.document,
            typeDocument: payload.typeDocument,
            insumos: payload.insumos,
            consultedAt: payload.consultedAt,
          },
          spc,
        },
      });
    };

    window.addEventListener("message", handleMessage);
    for (const origin of getManagerTargetOrigins()) {
      window.parent.postMessage({ type: VIEWER_MESSAGE.ready }, origin);
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [isEmbedded]);

  const renderedKey = state.status === "ready" ? state.key : null;
  useEffect(() => {
    const origin = managerOriginRef.current;
    if (!renderedKey || !origin) return;

    // After the browser paints the report, so the manager can drop its loading state.
    const frameId = requestAnimationFrame(() => {
      window.parent.postMessage({ type: VIEWER_MESSAGE.rendered }, origin);
    });
    return () => cancelAnimationFrame(frameId);
  }, [renderedKey]);

  if (!isEmbedded) {
    return (
      <ViewerMessage
        title="Visualização indisponível"
        description="Esta página só pode ser aberta pela plataforma de gestão."
      />
    );
  }

  if (state.status === "waiting") {
    return <ViewerMessage title="Carregando relatório..." />;
  }

  if (state.status === "error") {
    return <ViewerMessage title="Não foi possível exibir o relatório" description={state.message} />;
  }

  // Same wrappers and spacing as the app Layout, without sidebar and header, so the
  // report (sticky identification bar and print styles included) looks exactly the same.
  return (
    <StickyIdentificationProvider>
      <div className="min-h-screen bg-background" data-print-layout-root>
        <main data-print-content className="px-25 py-6 lg:px-10 [--layout-sidebar-width:0px]">
          <div data-print-container className="mx-auto w-full px-7.5">
            <SpcMaxiResultadoPage
              key={state.key}
              product={state.product}
              snapshot={state.snapshot}
            />
          </div>
        </main>
      </div>
    </StickyIdentificationProvider>
  );
}
