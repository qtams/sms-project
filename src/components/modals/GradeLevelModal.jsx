import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";

const CUSTOM_GRADE_VALUE = "__custom_grade_level__";

const gradeOptions = [
  "Nursery",
  "Kinder 1",
  "Kinder 2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "College",
];

const departmentOptions = [
  "Preschool",
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
];

const getDepartmentByGrade = (gradeLevel) => {
  if (!gradeLevel) return "";

  if (gradeLevel === "College") return "College";

  if (gradeLevel === "Grade 11" || gradeLevel === "Grade 12") {
    return "Senior High School";
  }

  if (
    gradeLevel === "Grade 7" ||
    gradeLevel === "Grade 8" ||
    gradeLevel === "Grade 9" ||
    gradeLevel === "Grade 10"
  ) {
    return "Junior High School";
  }

  if (
    gradeLevel === "Nursery" ||
    gradeLevel === "Kinder 1" ||
    gradeLevel === "Kinder 2"
  ) {
    return "Preschool";
  }

  return "Elementary";
};

const GradeLevelModal = ({
  isOpen,
  editingGradeLevel,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  const [isCustomGrade, setIsCustomGrade] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const isExistingCustomGrade =
      formData.levelName && !gradeOptions.includes(formData.levelName);

    setIsCustomGrade(Boolean(isExistingCustomGrade));
  }, [isOpen, formData.levelName]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGradeSelect = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === CUSTOM_GRADE_VALUE) {
      setIsCustomGrade(true);

      setFormData((current) => ({
        ...current,
        levelName: "",
        department: "",
      }));

      return;
    }

    setIsCustomGrade(false);

    setFormData((current) => ({
      ...current,
      levelName: selectedValue,
      department: getDepartmentByGrade(selectedValue),
    }));
  };

  const selectedGradeValue = isCustomGrade
    ? CUSTOM_GRADE_VALUE
    : formData.levelName;

  return (
    <BaseModal
      isOpen={isOpen}
      title={editingGradeLevel ? "Edit Grade Level" : "Add Grade Level"}
      description="Choose a predefined grade level or add a custom one if it is not listed."
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Grade Level
          </label>

          <select
            value={selectedGradeValue}
            onChange={handleGradeSelect}
            required={!isCustomGrade}
            className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          >
            <option value="">Select grade level</option>

            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}

            <option value={CUSTOM_GRADE_VALUE}>+ Add custom grade level</option>
          </select>
        </div>

        {isCustomGrade && (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Custom Grade Level Name
            </label>

            <input
              type="text"
              value={formData.levelName}
              onChange={(event) =>
                handleChange("levelName", event.target.value)
              }
              placeholder="Example: College 1st Year, ALS Level 1"
              required
              className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Department
          </label>

          {isCustomGrade ? (
            <select
              value={formData.department}
              onChange={(event) =>
                handleChange("department", event.target.value)
              }
              required
              className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="">Select department</option>

              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.department}
              readOnly
              placeholder="Auto-filled from grade level"
              className="h-12 w-full rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />
          )}
        </div>

        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-black text-slate-800">
              Grade Level Status
            </p>
            <p className="text-xs text-slate-500">
              Active grade levels can be selected when creating sections.
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
            className="rounded-md bg-red-500 px-6 py-3 text-sm font-black text-white transition hover:bg-red-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-cyan-600"
          >
            {editingGradeLevel ? "Save Changes" : "Add Grade Level"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default GradeLevelModal;
