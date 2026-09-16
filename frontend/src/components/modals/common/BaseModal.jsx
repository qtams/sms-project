import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const BaseModal = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-slate-950/70
        p-4
        backdrop-blur-sm
      "
    >
      {/* BACKDROP */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {/* MODAL */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="base-modal-title"
        className={`
          relative z-10
          flex
          max-h-[calc(100dvh-32px)]
          w-full
          ${maxWidth}
          flex-col
          overflow-hidden
          rounded-lg
          bg-white
          shadow-2xl
          animate-[baseModalPopIn_180ms_ease-out]
        `}
      >
        {/* HEADER */}
        <div
          className="
            flex shrink-0
            items-start justify-between
            gap-4
            border-b border-slate-100
            px-5 py-4
            sm:px-6 sm:py-5
          "
        >
          <div className="min-w-0">
            <h2
              id="base-modal-title"
              className="text-xl font-bold text-slate-950 sm:text-2xl"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-md
              bg-slate-100
              text-slate-500
              transition
              hover:bg-slate-900
              hover:text-white
            "
          >
            <FiX />
          </button>
        </div>

        {/* BODY */}
        <div
          className="
            flex
            min-h-0
            flex-1
            flex-col
            overflow-hidden
            px-5
            sm:px-6
          "
        >
          {children}
        </div>
      </div>

      <style>
        {`
          @keyframes baseModalPopIn {
            from {
              opacity: 0;
              transform: scale(0.96) translateY(12px);
            }

            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </div>,
    document.body,
  );
};

export default BaseModal;
