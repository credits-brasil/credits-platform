import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * True while the browser prints, whether started by the print button or Ctrl+P.
 * The update is flushed synchronously so the DOM is ready before the page is captured.
 */
export function useIsPrinting(): boolean {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => flushSync(() => setIsPrinting(true));
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return isPrinting;
}
