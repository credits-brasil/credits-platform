import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type StickyIdentificationContextValue = {
  isIdentificationFixed: boolean;
  registerIdentificationAnchor: (element: HTMLElement | null) => void;
};

const StickyIdentificationContext =
  createContext<StickyIdentificationContextValue | null>(null);

export function StickyIdentificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isIdentificationFixed, setIsIdentificationFixed] = useState(false);

  const updateFixedState = useCallback(() => {
    animationFrameRef.current = null;
    const anchor = anchorRef.current;
    setIsIdentificationFixed(
      Boolean(anchor && anchor.getBoundingClientRect().top <= 0),
    );
  }, []);

  const scheduleFixedStateUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(updateFixedState);
  }, [updateFixedState]);

  const registerIdentificationAnchor = useCallback(
    (element: HTMLElement | null) => {
      anchorRef.current = element;
      updateFixedState();
    },
    [updateFixedState],
  );

  useEffect(() => {
    window.addEventListener("scroll", scheduleFixedStateUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleFixedStateUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleFixedStateUpdate);
      window.removeEventListener("resize", scheduleFixedStateUpdate);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scheduleFixedStateUpdate]);

  return (
    <StickyIdentificationContext.Provider
      value={{ isIdentificationFixed, registerIdentificationAnchor }}
    >
      {children}
    </StickyIdentificationContext.Provider>
  );
}

export function useStickyIdentification() {
  const context = useContext(StickyIdentificationContext);

  if (!context) {
    throw new Error(
      "useStickyIdentification deve ser usado dentro de StickyIdentificationProvider.",
    );
  }

  return context;
}
