import BaseModal from "./BaseModal";

const SectionModal = ({
  isOpen,
  editingSection,
  gradeLevels,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const selectableGradeLevels = gradeLevels.filter((gradeLevel) => {
    if (gradeLevel.status === "Active") return true;

    return String(gradeLevel.id) === String(formData.gradeLevelId);
  });

  return (
    <BaseModal
      isOpen={isOpen}
      title={editingSection ? "Edit Section" : "Add Section"}
      description="Select an existing grade level, then create a section under it."
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Grade Level
            </label>

            <select
              value={formData.gradeLevelId}
              onChange={(event) =>
                handleChange("gradeLevelId", event.target.value)
              }
              required
              className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="">Select grade level</option>

              {selectableGradeLevels.map((gradeLevel) => (
                <option key={gradeLevel.id} value={gradeLevel.id}>
                  {gradeLevel.levelName} - {gradeLevel.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Section
            </label>

            <input
              type="text"
              value={formData.sectionName}
              onChange={(event) =>
                handleChange("sectionName", event.target.value)
              }
              placeholder="Example: A, B, STEM A"
              required
              className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Capacity
            </label>

            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(event) => handleChange("capacity", event.target.value)}
              placeholder="40"
              className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              School Year
            </label>

            <input
              type="text"
              value={formData.schoolYear}
              onChange={(event) =>
                handleChange("schoolYear", event.target.value)
              }
              placeholder="2026 - 2027"
              className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Section Status</p>
            <p className="text-xs text-slate-500">
              Active sections can be selected during enrollment.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setFormData((current) => ({
                ...current,
                status: current.status === "Active" ? "Inactive" : "Active",
              }))
            }
            className={`flex h-8 w-14 cursor-pointer items-center rounded-full p-1 transition ${
              formData.status === "Active" ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full bg-white shadow transition ${
                formData.status === "Active" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            {editingSection ? "Save Changes" : "Add Section"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SectionModal;
