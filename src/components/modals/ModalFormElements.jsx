import { FiLoader, FiPlus } from "react-icons/fi";

export const inputClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const primaryButton =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50";

export const FormField = ({ label, children, className = "" }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="mb-1.5 block text-xs font-medium text-slate-600">
      {label}
    </span>

    {children}
  </label>
);

export const ModalFooter = ({ onCancel, submitting, label }) => (
  <div className="mt-2 flex shrink-0 justify-end gap-2 border-t border-slate-100 py-4">
    <button
      type="button"
      onClick={onCancel}
      disabled={submitting}
      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Cancel
    </button>

    <button type="submit" disabled={submitting} className={primaryButton}>
      {submitting ? <FiLoader className="animate-spin" /> : <FiPlus />}
      {submitting ? "Saving..." : label}
    </button>
  </div>
);
