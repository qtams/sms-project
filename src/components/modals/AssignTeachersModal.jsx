import BaseModal from "./BaseModal";

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const AssignTeachersModal = ({
  isOpen,
  section,
  gradeLevel,
  teachers,
  selectedTeacherIds,
  setSelectedTeacherIds,
  onClose,
  onSave,
}) => {
  const handleToggleTeacher = (teacherId) => {
    setSelectedTeacherIds((current) => {
      if (current.includes(teacherId)) {
        return current.filter((id) => id !== teacherId);
      }

      return [...current, teacherId];
    });
  };

  const handleSelectAll = () => {
    setSelectedTeacherIds(teachers.map((teacher) => teacher.id));
  };

  const handleClear = () => {
    setSelectedTeacherIds([]);
  };

  const selectedTeachers = teachers.filter((teacher) =>
    selectedTeacherIds.includes(teacher.id),
  );

  return (
    <BaseModal
      isOpen={isOpen}
      title="Assign Teachers"
      description={
        section
          ? `${gradeLevel?.levelName || "Grade"} - ${section.sectionName}`
          : "Select one or more teachers"
      }
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className="flex overflow-hidden rounded-md border border-slate-200">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex-1 px-4 py-3 text-left text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
          >
            Select All Teachers
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="border-l border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {teachers.map((teacher) => {
            const isSelected = selectedTeacherIds.includes(teacher.id);

            return (
              <button
                key={teacher.id}
                type="button"
                onClick={() => handleToggleTeacher(teacher.id)}
                className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-cyan-100 bg-cyan-50"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border text-xs font-black ${
                    isSelected
                      ? "border-cyan-600 bg-cyan-600 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </span>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-black text-cyan-700 ring-4 ring-cyan-100">
                  {getInitials(teacher.name)}
                </span>

                <span>
                  <span className="block text-sm font-black text-slate-900">
                    {teacher.name}
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    {teacher.subject}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Currently Assigned
          </p>

          {selectedTeachers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => handleToggleTeacher(teacher.id)}
                  className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                >
                  {teacher.name}
                  <span>×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              No teachers assigned yet.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-red-500 px-6 py-3 text-sm font-black text-white transition hover:bg-red-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-cyan-600"
          >
            Save Teachers
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AssignTeachersModal;
