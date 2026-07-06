import { useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import GradeLevelModal from "../components/modals/GradeLevelModal";
import SectionModal from "../components/modals/SectionModal";
import AssignTeachersModal from "../components/modals/AssignTeachersModal";
import { apiDebugRequest } from "../utils/apiDebugger";

const defaultGradeLevelForm = {
  levelName: "",
  department: "",
  status: "Active",
};

const defaultSectionForm = {
  gradeLevelId: "",
  sectionName: "",
  capacity: "",
  schoolYear: "2026 - 2027",
  status: "Active",
};

const initialTeachers = [
  {
    id: 1,
    name: "Buendia, Tamahome",
    subject: "Mathematics",
  },
  {
    id: 2,
    name: "Buendia, Arvin",
    subject: "Science",
  },
  {
    id: 3,
    name: "Misorsikat, Misorsikat",
    subject: "English",
  },
  {
    id: 4,
    name: "Santos, Maria",
    subject: "Filipino",
  },
];

const initialGradeLevels = [
  {
    id: 1,
    levelName: "Grade 7",
    department: "Junior High School",
    status: "Active",
  },
  {
    id: 2,
    levelName: "Grade 8",
    department: "Junior High School",
    status: "Active",
  },
  {
    id: 3,
    levelName: "Grade 11",
    department: "Senior High School",
    status: "Active",
  },
];

const initialSections = [
  {
    id: 1,
    gradeLevelId: 1,
    sectionName: "A",
    capacity: "40",
    schoolYear: "2026 - 2027",
    status: "Active",
    students: 32,
    assignedTeacherIds: [2],
  },
  {
    id: 2,
    gradeLevelId: 2,
    sectionName: "B",
    capacity: "40",
    schoolYear: "2026 - 2027",
    status: "Active",
    students: 28,
    assignedTeacherIds: [],
  },
  {
    id: 3,
    gradeLevelId: 3,
    sectionName: "STEM A",
    capacity: "35",
    schoolYear: "2026 - 2027",
    status: "Inactive",
    students: 0,
    assignedTeacherIds: [],
  },
];

const getInitials = (name = "") => {
  if (!name) return "";

  if (name.includes(",")) {
    const [lastName, firstName] = name.split(",").map((item) => item.trim());
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }

  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${
    parts[parts.length - 1]?.[0] || ""
  }`.toUpperCase();
};

const teacherAvatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getTeacherAvatarStyle = (teacherId) => {
  return teacherAvatarStyles[teacherId % teacherAvatarStyles.length];
};

const GradeSections = () => {
  const [gradeLevels, setGradeLevels] = useState(initialGradeLevels);
  const [sections, setSections] = useState(initialSections);
  const [teachers] = useState(initialTeachers);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGradeLevel, setEditingGradeLevel] = useState(null);
  const [gradeLevelForm, setGradeLevelForm] = useState(defaultGradeLevelForm);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(defaultSectionForm);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningSection, setAssigningSection] = useState(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

  const getGradeLevelById = (gradeLevelId) => {
    return gradeLevels.find(
      (gradeLevel) => String(gradeLevel.id) === String(gradeLevelId),
    );
  };

  const getTeachersByIds = (teacherIds = []) => {
    return teachers.filter((teacher) => teacherIds.includes(teacher.id));
  };

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const gradeLevel = gradeLevels.find(
        (item) => String(item.id) === String(section.gradeLevelId),
      );

      const assignedTeachers = getTeachersByIds(section.assignedTeacherIds);

      const teacherNames = assignedTeachers
        .map((teacher) => teacher.name)
        .join(" ");

      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        section.sectionName.toLowerCase().includes(searchValue) ||
        teacherNames.toLowerCase().includes(searchValue) ||
        String(gradeLevel?.levelName || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(gradeLevel?.department || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || section.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sections, gradeLevels, teachers, searchTerm, statusFilter]);

  const activeGradeLevels = gradeLevels.filter(
    (gradeLevel) => gradeLevel.status === "Active",
  ).length;

  const totalStudents = sections.reduce(
    (total, section) => total + Number(section.students || 0),
    0,
  );

  const openAddGradeModal = () => {
    setEditingGradeLevel(null);
    setGradeLevelForm(defaultGradeLevelForm);
    setIsGradeModalOpen(true);
  };

  const openEditGradeModal = (gradeLevel) => {
    setEditingGradeLevel(gradeLevel);

    setGradeLevelForm({
      levelName: gradeLevel.levelName,
      department: gradeLevel.department,
      status: gradeLevel.status,
    });

    setIsGradeModalOpen(true);
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
    setEditingGradeLevel(null);
    setGradeLevelForm(defaultGradeLevelForm);
  };

  const handleGradeSubmit = async (event) => {
    event.preventDefault();

    const cleanedData = {
      ...gradeLevelForm,
      levelName: gradeLevelForm.levelName.trim(),
      department: gradeLevelForm.department.trim(),
    };

    if (!cleanedData.levelName || !cleanedData.department) {
      toast.error("Grade level and department are required.");
      return;
    }

    const isDuplicate = gradeLevels.some((gradeLevel) => {
      const sameLevel =
        gradeLevel.levelName.toLowerCase() ===
        cleanedData.levelName.toLowerCase();

      if (editingGradeLevel) {
        return sameLevel && gradeLevel.id !== editingGradeLevel.id;
      }

      return sameLevel;
    });

    if (isDuplicate) {
      toast.error("This grade level already exists.");
      return;
    }

    if (editingGradeLevel) {
      const payload = {
        id: editingGradeLevel.id,
        ...cleanedData,
      };

      await apiDebugRequest({
        module: "grade-level",
        action: "update",
        method: "PUT",
        payload,
      });

      setGradeLevels((current) =>
        current.map((gradeLevel) =>
          gradeLevel.id === editingGradeLevel.id
            ? {
                ...gradeLevel,
                ...cleanedData,
              }
            : gradeLevel,
        ),
      );

      toast.success("Grade level updated successfully.");
      closeGradeModal();
      return;
    }

    const newGradeLevel = {
      id: Date.now(),
      ...cleanedData,
    };

    await apiDebugRequest({
      module: "grade-level",
      action: "create",
      method: "POST",
      payload: newGradeLevel,
    });

    setGradeLevels((current) => [newGradeLevel, ...current]);
    toast.success("Grade level added successfully.");
    closeGradeModal();
  };

  const handleDeleteGrade = async (gradeLevel) => {
    const relatedSections = sections.filter(
      (section) => String(section.gradeLevelId) === String(gradeLevel.id),
    );

    if (relatedSections.length > 0) {
      toast.error(
        "You cannot delete this grade level because it has sections.",
      );
      return;
    }

    const result = await Swal.fire({
      title: "Delete grade level?",
      text: `${gradeLevel.levelName} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "grade-level",
      action: "delete",
      method: "DELETE",
      payload: gradeLevel,
    });

    setGradeLevels((current) =>
      current.filter((currentGrade) => currentGrade.id !== gradeLevel.id),
    );

    toast.success("Grade level deleted successfully.");
  };

  const openAddSectionModal = () => {
    if (gradeLevels.filter((item) => item.status === "Active").length === 0) {
      toast.error("Create an active grade level first.");
      return;
    }

    setEditingSection(null);
    setSectionForm(defaultSectionForm);
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (section) => {
    setEditingSection(section);

    setSectionForm({
      gradeLevelId: String(section.gradeLevelId),
      sectionName: section.sectionName,
      capacity: section.capacity,
      schoolYear: section.schoolYear,
      status: section.status,
    });

    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setSectionForm(defaultSectionForm);
  };

  const handleSectionSubmit = async (event) => {
    event.preventDefault();

    const selectedGradeLevel = getGradeLevelById(sectionForm.gradeLevelId);

    if (!selectedGradeLevel) {
      toast.error("Please select a valid grade level.");
      return;
    }

    const cleanedData = {
      ...sectionForm,
      gradeLevelId: Number(sectionForm.gradeLevelId),
      sectionName: sectionForm.sectionName.trim(),
      capacity: String(sectionForm.capacity).trim(),
      schoolYear: sectionForm.schoolYear.trim(),
    };

    if (!cleanedData.gradeLevelId || !cleanedData.sectionName) {
      toast.error("Grade level and section are required.");
      return;
    }

    const isDuplicate = sections.some((section) => {
      const sameGrade =
        String(section.gradeLevelId) === String(cleanedData.gradeLevelId);

      const sameSection =
        section.sectionName.toLowerCase() ===
        cleanedData.sectionName.toLowerCase();

      if (editingSection) {
        return sameGrade && sameSection && section.id !== editingSection.id;
      }

      return sameGrade && sameSection;
    });

    if (isDuplicate) {
      toast.error(
        "This section already exists under the selected grade level.",
      );
      return;
    }

    if (editingSection) {
      const payload = {
        id: editingSection.id,
        ...cleanedData,
        gradeLevel: selectedGradeLevel,
      };

      await apiDebugRequest({
        module: "section",
        action: "update",
        method: "PUT",
        payload,
      });

      setSections((current) =>
        current.map((section) =>
          section.id === editingSection.id
            ? {
                ...section,
                ...cleanedData,
              }
            : section,
        ),
      );

      toast.success("Section updated successfully.");
      closeSectionModal();
      return;
    }

    const newSection = {
      id: Date.now(),
      ...cleanedData,
      students: 0,
      assignedTeacherIds: [],
    };

    await apiDebugRequest({
      module: "section",
      action: "create",
      method: "POST",
      payload: {
        ...newSection,
        gradeLevel: selectedGradeLevel,
      },
    });

    setSections((current) => [newSection, ...current]);
    toast.success("Section added successfully.");
    closeSectionModal();
  };

  const handleDeleteSection = async (section) => {
    const gradeLevel = getGradeLevelById(section.gradeLevelId);

    const result = await Swal.fire({
      title: "Delete section?",
      text: `${gradeLevel?.levelName || "Grade"} - ${
        section.sectionName
      } will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "section",
      action: "delete",
      method: "DELETE",
      payload: {
        ...section,
        gradeLevel,
      },
    });

    setSections((current) =>
      current.filter((currentSection) => currentSection.id !== section.id),
    );

    toast.success("Section deleted successfully.");
  };

  const openAssignTeachersModal = (section) => {
    setAssigningSection(section);
    setSelectedTeacherIds(section.assignedTeacherIds || []);
    setIsAssignModalOpen(true);
  };

  const closeAssignTeachersModal = () => {
    setIsAssignModalOpen(false);
    setAssigningSection(null);
    setSelectedTeacherIds([]);
  };

  const handleSaveAssignedTeachers = async () => {
    if (!assigningSection) return;

    const gradeLevel = getGradeLevelById(assigningSection.gradeLevelId);
    const selectedTeachers = getTeachersByIds(selectedTeacherIds);

    const payload = {
      sectionId: assigningSection.id,
      sectionName: assigningSection.sectionName,
      gradeLevel,
      assignedTeacherIds: selectedTeacherIds,
      assignedTeachers: selectedTeachers,
    };

    await apiDebugRequest({
      module: "section-teachers",
      action: "assign",
      method: "POST",
      payload,
    });

    setSections((current) =>
      current.map((section) =>
        section.id === assigningSection.id
          ? {
              ...section,
              assignedTeacherIds: selectedTeacherIds,
            }
          : section,
      ),
    );

    toast.success("Teachers assigned successfully.");
    closeAssignTeachersModal();
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Grade & Sections
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create grade levels first, then create sections under each grade.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openAddGradeModal}
            className="flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            <FiPlus />
            Add Grade Level
          </button>

          <button
            type="button"
            onClick={openAddSectionModal}
            className="flex w-fit items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            <FiPlus />
            Add Section
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Grade Levels" value={gradeLevels.length} />
        <SummaryCard label="Active Grade Levels" value={activeGradeLevels} />
        <SummaryCard label="Sections" value={sections.length} />
        <SummaryCard label="Assigned Students" value={totalStudents} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black text-slate-900">Grade Levels</h2>
          <p className="mt-1 text-sm text-slate-500">
            These are the grade levels that sections can use.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Grade Level
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Department
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Sections
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {gradeLevels.map((gradeLevel) => {
                const sectionCount = sections.filter(
                  (section) =>
                    String(section.gradeLevelId) === String(gradeLevel.id),
                ).length;

                return (
                  <tr
                    key={gradeLevel.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 text-sm font-bold text-slate-900">
                      {gradeLevel.levelName}
                    </td>

                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                      {gradeLevel.department}
                    </td>

                    <td className="px-5 py-3 text-sm font-bold text-slate-700">
                      {sectionCount}
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge status={gradeLevel.status} />
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          type="edit"
                          onClick={() => openEditGradeModal(gradeLevel)}
                        />

                        <IconButton
                          type="delete"
                          onClick={() => handleDeleteGrade(gradeLevel)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Sections</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sections are connected to the grade levels you created.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search section, grade, teacher..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 lg:w-44"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-visible">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Grade & Section
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Department
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Teachers
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Capacity
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Students
                </th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSections.length > 0 ? (
                filteredSections.map((section) => {
                  const gradeLevel = getGradeLevelById(section.gradeLevelId);
                  const assignedTeachers = getTeachersByIds(
                    section.assignedTeacherIds,
                  );

                  return (
                    <tr
                      key={section.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-bold text-slate-900">
                          {gradeLevel?.levelName || "No Grade"} -{" "}
                          {section.sectionName}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {section.schoolYear}
                        </p>
                      </td>

                      <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                        {gradeLevel?.department || "-"}
                      </td>

                      <td className="px-5 py-3">
                        <TeacherProfiles teachers={assignedTeachers} />
                      </td>

                      <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                        {section.capacity || "-"}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <FiUsers className="text-slate-400" />
                          {section.students}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <StatusBadge status={section.status} />
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <IconButton
                            type="assign"
                            onClick={() => openAssignTeachersModal(section)}
                          />

                          <IconButton
                            type="edit"
                            onClick={() => openEditSectionModal(section)}
                          />

                          <IconButton
                            type="delete"
                            onClick={() => handleDeleteSection(section)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <p className="font-black text-slate-900">
                      No sections found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or add a new section.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GradeLevelModal
        isOpen={isGradeModalOpen}
        editingGradeLevel={editingGradeLevel}
        formData={gradeLevelForm}
        setFormData={setGradeLevelForm}
        onClose={closeGradeModal}
        onSubmit={handleGradeSubmit}
      />

      <SectionModal
        isOpen={isSectionModalOpen}
        editingSection={editingSection}
        gradeLevels={gradeLevels}
        formData={sectionForm}
        setFormData={setSectionForm}
        onClose={closeSectionModal}
        onSubmit={handleSectionSubmit}
      />

      <AssignTeachersModal
        isOpen={isAssignModalOpen}
        section={assigningSection}
        gradeLevel={
          assigningSection
            ? getGradeLevelById(assigningSection.gradeLevelId)
            : null
        }
        teachers={teachers}
        selectedTeacherIds={selectedTeacherIds}
        setSelectedTeacherIds={setSelectedTeacherIds}
        onClose={closeAssignTeachersModal}
        onSave={handleSaveAssignedTeachers}
      />
    </div>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{value}</h2>
    </div>
  );
};

const TeacherProfiles = ({ teachers }) => {
  if (!teachers || teachers.length === 0) {
    return (
      <div className="group relative inline-flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-400 ring-2 ring-slate-200">
        -
        <TeacherTooltip teachers={[]} />
      </div>
    );
  }

  const visibleTeachers = teachers.slice(0, 3);
  const extraCount = teachers.length - visibleTeachers.length;

  return (
    <div className="group relative inline-flex cursor-default items-center">
      <div className="flex -space-x-2">
        {visibleTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-black shadow-sm ring-2 ${getTeacherAvatarStyle(
              teacher.id,
            )}`}
          >
            {getInitials(teacher.name)}
          </div>
        ))}

        {extraCount > 0 && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-black text-slate-600 shadow-sm ring-2 ring-slate-200">
            +{extraCount}
          </div>
        )}
      </div>

      <TeacherTooltip teachers={teachers} />
    </div>
  );
};

const TeacherTooltip = ({ teachers }) => {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-3 hidden w-80 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-4 text-left shadow-2xl group-hover:block">
      <div className="absolute bottom-[-7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />

      <div className="mb-3 border-b border-slate-100 pb-3">
        <p className="text-sm font-black text-slate-900">Assigned Teachers</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Hover preview
        </p>
      </div>

      {teachers.length > 0 ? (
        <div className="space-y-2">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center gap-3 rounded-md bg-slate-50 p-3"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ring-4 ${getTeacherAvatarStyle(
                  teacher.id,
                )}`}
              >
                {getInitials(teacher.name)}
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  {teacher.name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {teacher.subject}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-500">
          No teachers assigned.
        </p>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`rounded-md px-3 py-1 text-xs font-black ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
};

const IconButton = ({ type, onClick }) => {
  const buttonStyles = {
    assign:
      "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white",
    edit: "bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white",
    delete: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  const icons = {
    assign: <FiUserCheck />,
    edit: <FiEdit2 />,
    delete: <FiTrash2 />,
  };

  const labels = {
    assign: "Assign Teachers",
    edit: "Edit Section",
    delete: "Delete Section",
  };

  return (
    <button
      type="button"
      title={labels[type]}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${buttonStyles[type]}`}
    >
      {icons[type]}
    </button>
  );
};

export default GradeSections;
