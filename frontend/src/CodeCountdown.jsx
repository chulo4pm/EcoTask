import { Clock } from "lucide-react";
import { useSecondsLeft } from "./codeTimer";

/* =========================================================
   CODE COUNTDOWN
   Shows how long the emailed 6-digit code is still valid.

   Props:
     expiresAt - timestamp (ms) when the code stops working
========================================================= */

const format = (total) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function CodeCountdown({ expiresAt, className = "" }) {
  const secondsLeft = useSecondsLeft(expiresAt);
  const expired = secondsLeft <= 0;
  const low = !expired && secondsLeft <= 60;

  const tone = expired
    ? "border-red-200 bg-red-50 text-red-700"
    : low
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-[#cfe9d6] bg-[#f3fbf5] text-[#2f6b43]";

  return (
    <div
      role="timer"
      aria-live="off"
      className={`mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${tone} ${className}`}
    >
      <Clock size={14} />
      {expired ? (
        <span>Code expired. Tap "Resend code" for a new one.</span>
      ) : (
        <span>
          Code expires in <span className="tabular-nums">{format(secondsLeft)}</span>
        </span>
      )}
    </div>
  );
}

export default CodeCountdown;
