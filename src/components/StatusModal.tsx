import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  message: string;
  onClose: () => void;
  title?: string;
  type?: "success" | "error";
};

const statusModalExitDuration = 600;

export function StatusModal({ message, onClose, title, type = "success" }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const closeWithAnimation = useCallback(() => {
    if (closeTimerRef.current) return;

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, statusModalExitDuration);
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(closeWithAnimation, 5000);
    return () => {
      window.clearTimeout(timer);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, [closeWithAnimation, message]);

  return (
    <div
      className={`status-modal ${isClosing ? "status-modal-exit" : "status-modal-enter"}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <button
        type="button"
        className="absolute right-3 top-3"
        aria-label="Close message"
        onClick={closeWithAnimation}
      >
        <X size={18} />
      </button>
      {title && <p className="pr-8 font-display text-2xl leading-tight">{title}</p>}
      <p className={`${title ? "mt-3" : "pr-8"} text-lg leading-7`}>{message}</p>
    </div>
  );
}
