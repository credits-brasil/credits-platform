import { createContext, useContext } from "react";

/**
 * True when the report renders a stored consultation (the manager's viewer):
 * nothing on the page may start a new, billed consultation or navigate away.
 */
export const ReportReadOnlyContext = createContext(false);

export function useReportReadOnly(): boolean {
  return useContext(ReportReadOnlyContext);
}
