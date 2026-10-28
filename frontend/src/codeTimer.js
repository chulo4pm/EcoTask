import { useEffect, useState } from "react";

export const CODE_TTL_SECONDS = 10 * 60; // must match CODE_TTL_MINUTES on the server

// Seconds left until `expiresAt` (ms timestamp), re-rendered every second. Stops at 0.
export function useSecondsLeft(expiresAt) {
  const [now, setNow] = useState(() => Date.now());
  const target = Number(expiresAt) || 0;

  useEffect(() => {
    setNow(Date.now()); // new expiry (e.g. after Resend): don't wait a second to show the right time
    if (!target || target <= Date.now()) return undefined;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= target) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return Math.max(0, Math.ceil((target - now) / 1000));
}
