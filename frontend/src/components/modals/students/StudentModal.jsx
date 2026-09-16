import React from "react";
import { FiLoader, FiPlus, FiSave } from "react-icons/fi";

import BaseModal from "../common/BaseModal";

const inputClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 disabled:bg-slate-50";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";

export default function SectionModal({
  isOpen,
  mode = "add",
  value,
  setValue,
  data,
  loading = false,
  onClose,
  onSave,
}) {
  const update = (key, val) => {
    setValue({
      ...value,
      [key]: val,
    });
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(value);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Section"
      loading={loading}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <label>
          <span className={labelClass}>Grade Level</span>

          <select
            required
            disabled={loading}
            className={inputClass}
            value={value.grade_level_id || ""}
            onChange={(e) => update("grade_level_id", e.target.value)}
          >
            <option value="">Select grade level</option>

            {data.gradeLevels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>School Year</span>

          <select
            required
            disabled={loading}
            className={inputClass}
            value={value.school_year_id || ""}
            onChange={(e) => update("school_year_id", e.target.value)}
          >
            <option value="">Select school year</option>

            {data.schoolYears.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Section Name</span>

          <input
            required
            disabled={loading}
            className={inputClass}
            placeholder="Section A"
            value={value.name || ""}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>

        <label>
          <span className={labelClass}>Capacity</span>

          <input
            type="number"
            min="1"
            disabled={loading}
            className={inputClass}
            placeholder="40"
            value={value.capacity || ""}
            onChange={(e) => update("capacity", e.target.value)}
          />
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? (
              <FiLoader className="animate-spin" />
            ) : mode === "edit" ? (
              <FiSave />
            ) : (
              <FiPlus />
            )}

            {loading ? "Saving..." : "Save Section"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
