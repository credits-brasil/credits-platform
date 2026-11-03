import { useEffect, useRef } from "react";
import { getLastUserActivity, markUserActivity } from "@/lib/auth";

export const IDLE_LOGOUT_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
] as const;
/** mousemove/scroll fire constantly; persisting once in a while is enough. */
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;
const IDLE_CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Calls `onIdle` once the user has been inactive for `timeoutMs`.
 * Idle time is compared against a stored timestamp instead of a single timer, so it
 * stays correct when the tab is throttled, the computer sleeps or the page is reopened.
 */
export function useIdleLogout(
  enabled: boolean,
  onIdle: () => void,
  timeoutMs = IDLE_LOGOUT_TIMEOUT_MS,
) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    let lastWrite = 0;
    let hasFired = false;

    const isIdle = () => {
      const lastActivity = getLastUserActivity();
      return lastActivity !== null && Date.now() - lastActivity >= timeoutMs;
    };

    const fireIdle = () => {
      if (hasFired) return;
      hasFired = true;
      onIdleRef.current();
    };

    const checkIdle = () => {
      if (isIdle()) fireIdle();
    };

    // Sessions opened before this feature existed have no timestamp yet.
    if (getLastUserActivity() === null) {
      markUserActivity();
    }

    checkIdle();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;

      // Don't let a late event revive a session that already expired.
      if (isIdle()) {
        fireIdle();
        return;
      }

      lastWrite = now;
      markUserActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkIdle();
    };

    // Capture so scrolling inside inner containers (which doesn't bubble) also counts.
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [enabled, timeoutMs]);
}
