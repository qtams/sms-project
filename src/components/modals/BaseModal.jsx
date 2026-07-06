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
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className={`relative z-10 w-full ${maxWidth} rounded-md bg-white p-6 shadow-2xl animate-[baseModalPopIn_180ms_ease-out] sm:p-8`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>

            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition hover:bg-slate-900 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        {children}
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
