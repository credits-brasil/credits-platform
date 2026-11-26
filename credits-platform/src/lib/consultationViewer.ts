/**
 * Protocol between this app's consultation viewer (`/visualizar-consulta`, embedded in an iframe)
 * and credits-platform-manager, which sends it a stored order to render.
 * The manager mirrors these names in `src/lib/consultationViewer.ts`: change both together.
 *
 * 1. viewer → manager  `credits:viewer-ready`          the viewer is listening
 * 2. manager → viewer  `credits:consultation-snapshot` the order to render (payload below)
 * 3. viewer → manager  `credits:viewer-rendered`       the report is on screen
 *    viewer → manager  `credits:viewer-error`          the payload could not be rendered
 */
export const CONSULTATION_VIEWER_PATH = "/visualizar-consulta";

export const VIEWER_MESSAGE = {
  ready: "credits:viewer-ready",
  snapshot: "credits:consultation-snapshot",
  rendered: "credits:viewer-rendered",
  error: "credits:viewer-error",
} as const;

export interface ConsultationViewerPayload {
  productName: string;
  document: string;
  typeDocument: "CPF" | "CNPJ";
  /** Insumo codes consulted in the order. */
  insumos: string[];
  /** ISO date of the consultation. */
  consultedAt: string;
  /** The order's `result`: the consultation response (`{ statusCode, message, spc }`) or its bare `spc` object. */
  result: unknown;
  /** The order's `json` field, checked when `result` holds no report data. */
  json?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates a payload received through postMessage; null when it can't be rendered. */
export function parseViewerPayload(value: unknown): ConsultationViewerPayload | null {
  if (!isRecord(value)) return null;

  const { productName, document, typeDocument, insumos, consultedAt, result, json } = value;
  if (
    typeof productName !== "string" ||
    typeof document !== "string" ||
    (typeDocument !== "CPF" && typeDocument !== "CNPJ") ||
    !Array.isArray(insumos) ||
    typeof consultedAt !== "string" ||
    Number.isNaN(new Date(consultedAt).getTime())
  ) {
    return null;
  }

  return {
    productName,
    document,
    typeDocument,
    insumos: insumos.map(String),
    consultedAt,
    result,
    json,
  };
}

function parseJsonString(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Every report has the consulted person/company and the SPC protocol. */
function isSpcData(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && (isRecord(value.consumidor) || isRecord(value.protocolo));
}

/**
 * The `spc` object the result page renders: the response's `spc`, or the bare object.
 * Null when the stored data isn't a report, so the viewer shows an error instead of an empty page.
 */
export function getSpcData(payload: Pick<ConsultationViewerPayload, "result" | "json">): Record<string, unknown> | null {
  for (const candidate of [payload.result, payload.json]) {
    const value = parseJsonString(candidate);
    if (isRecord(value) && isSpcData(value.spc)) return value.spc;
    if (isSpcData(value)) return value;
  }
  return null;
}

/** Top-level keys of what was received, to tell the user what the stored data looks like. */
export function describeReceivedData(payload: Pick<ConsultationViewerPayload, "result" | "json">): string {
  const describe = (value: unknown) => {
    const parsed = parseJsonString(value);
    if (isRecord(parsed)) return `{ ${Object.keys(parsed).slice(0, 8).join(", ")} }`;
    return parsed === null || parsed === undefined ? "vazio" : typeof parsed;
  };
  return `result: ${describe(payload.result)} · json: ${describe(payload.json)}`;
}

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const CONFIGURED_MANAGER_ORIGINS = parseOrigins(import.meta.env.VITE_MANAGER_ORIGINS);
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Only the manager may send reports to the viewer: origins listed in `VITE_MANAGER_ORIGINS`
 * (comma-separated). In local development any localhost origin is accepted too.
 */
export function isAllowedManagerOrigin(origin: string): boolean {
  return (
    CONFIGURED_MANAGER_ORIGINS.includes(origin) ||
    (import.meta.env.DEV && LOCALHOST_ORIGIN.test(origin))
  );
}

/** Where to announce the viewer is ready, without broadcasting to any origin. */
export function getManagerTargetOrigins(): string[] {
  const targets = new Set(CONFIGURED_MANAGER_ORIGINS);
  try {
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : "";
    if (referrerOrigin && isAllowedManagerOrigin(referrerOrigin)) {
      targets.add(referrerOrigin);
    }
  } catch {
    // Unparseable referrer: rely on the configured origins.
  }
  return Array.from(targets);
}
