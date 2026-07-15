import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiEdit2,
  FiEye,
  FiGrid,
  FiHash,
  FiList,
  FiMail,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import TeacherModal from "../components/modals/TeacherModal";
import { apiDebugRequest } from "../utils/apiDebugger";

const defaultTeacherForm = {
  teacherId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  department: "",
  email: "",
  mobile: "",
  status: "Active",
  photoFile: null,
  photoPreview: "",
  photoRemoved: false,
};

const initialTeachers = [
  {
    id: 1,
    teacherId: "TCH-0001",
    firstName: "Tamahome",
    middleName: "",
    lastName: "Buendia",
    department: "Elementary",
    email: "mr.tamahome.buendia@gmail.com",
    mobile: "09304486012",
    status: "Active",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 2,
    teacherId: "TCH-0002",
    firstName: "Arvin",
    middleName: "",
    lastName: "Buendia",
    department: "Junior High School",
    email: "arvin.buendia@email.com",
    mobile: "09987654321",
    status: "Active",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 3,
    teacherId: "TCH-0003",
    firstName: "Misorsikat",
    middleName: "",
    lastName: "Misorsikat",
    department: "Senior High School",
    email: "",
    mobile: "",
    status: "Inactive",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
];

const getTeacherDisplayName = (teacher) => {
  return `${teacher.lastName}, ${teacher.firstName}`;
};

const getInitials = (teacher) => {
  const firstInitial = teacher.firstName?.[0] || "";
  const lastInitial = teacher.lastName?.[0] || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (teacherId) => {
  return avatarStyles[teacherId % avatarStyles.length];
};

const Teachers = () => {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [movingTeacherId, setMovingTeacherId] = useState(null);
  const [poppedTeacherId, setPoppedTeacherId] = useState(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState(defaultTeacherForm);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        getTeacherDisplayName(teacher).toLowerCase().includes(searchValue) ||
        teacher.teacherId.toLowerCase().includes(searchValue) ||
        teacher.department.toLowerCase().includes(searchValue) ||
        teacher.email.toLowerCase().includes(searchValue) ||
        teacher.mobile.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || teacher.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const displayedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "Active" ? -1 : 1;
      }

      return getTeacherDisplayName(a).localeCompare(getTeacherDisplayName(b));
    });
  }, [filteredTeachers]);

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "Active",
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "Inactive",
  ).length;

  const departmentsCount = new Set(
    teachers.map((teacher) => teacher.department).filter(Boolean),
  ).size;

  const allDisplayedSelected =
    displayedTeachers.length > 0 &&
    displayedTeachers.every((teacher) =>
      selectedTeacherIds.includes(teacher.id),
    );

  const openAddTeacherModal = () => {
    setEditingTeacher(null);
    setTeacherForm(defaultTeacherForm);
    setIsTeacherModalOpen(true);
  };

  const openEditTeacherModal = (teacher) => {
    setEditingTeacher(teacher);

    setTeacherForm({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      middleName: teacher.middleName,
      lastName: teacher.lastName,
      department: teacher.department,
      email: teacher.email,
      mobile: teacher.mobile,
      status: teacher.status,
      photoFile: null,
      photoPreview: teacher.photoPreview || "",
      photoRemoved: false,
    });

    setIsTeacherModalOpen(true);
  };

  const closeTeacherModal = () => {
    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
    setTeacherForm(defaultTeacherForm);
  };

  const handleToggleSelect = (teacherId) => {
    setSelectedTeacherIds((current) => {
      if (current.includes(teacherId)) {
        return current.filter((id) => id !== teacherId);
      }

      return [...current, teacherId];
    });
  };

  const handleSelectAllDisplayed = () => {
    if (allDisplayedSelected) {
      const displayedIds = displayedTeachers.map((teacher) => teacher.id);

      setSelectedTeacherIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedTeacherIds((current) => {
      const nextIds = [...current];

      displayedTeachers.forEach((teacher) => {
        if (!nextIds.includes(teacher.id)) {
          nextIds.push(teacher.id);
        }
      });

      return nextIds;
    });
  };

  const handleViewTeacher = async (teacher) => {
    await apiDebugRequest({
      module: "teacher",
      action: "view",
      method: "GET",
      payload: {
        id: teacher.id,
        teacherId: teacher.teacherId,
      },
    });

    Swal.fire({
      title: getTeacherDisplayName(teacher),
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.8;">
          <p><b>Teacher ID:</b> ${teacher.teacherId}</p>
          <p><b>Department:</b> ${teacher.department || "-"}</p>
          <p><b>Email:</b> ${teacher.email || "-"}</p>
          <p><b>Mobile:</b> ${teacher.mobile || "-"}</p>
          <p><b>Status:</b> ${teacher.status}</p>
        </div>
      `,
      confirmButtonColor: "#0891b2",
    });
  };

  const handleBulkDelete = async () => {
    if (selectedTeacherIds.length === 0) {
      toast.error("Please select at least one teacher.");
      return;
    }

    const selectedTeachers = teachers.filter((teacher) =>
      selectedTeacherIds.includes(teacher.id),
    );

    const result = await Swal.fire({
      title: "Delete selected teachers?",
      text: `${selectedTeachers.length} teacher record(s) will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "teacher",
      action: "bulk-delete",
      method: "DELETE",
      payload: {
        ids: selectedTeacherIds,
        teachers: selectedTeachers.map((teacher) => ({
          id: teacher.id,
          teacherId: teacher.teacherId,
          displayName: getTeacherDisplayName(teacher),
        })),
      },
    });

    setTeachers((current) =>
      current.filter((teacher) => !selectedTeacherIds.includes(teacher.id)),
    );

    setSelectedTeacherIds([]);
    toast.success("Selected teachers deleted successfully.");
  };

  const handleTeacherSubmit = async (event) => {
    event.preventDefault();

    const cleanedData = {
      ...teacherForm,
      teacherId: teacherForm.teacherId.trim(),
      firstName: teacherForm.firstName.trim(),
      middleName: teacherForm.middleName.trim(),
      lastName: teacherForm.lastName.trim(),
      department: teacherForm.department.trim(),
      email: teacherForm.email.trim(),
      mobile: teacherForm.mobile.trim(),
    };

    if (
      !cleanedData.teacherId ||
      !cleanedData.firstName ||
      !cleanedData.lastName ||
      !cleanedData.department
    ) {
      toast.error("Please complete all required teacher details.");
      return;
    }

    const duplicateTeacherId = teachers.some((teacher) => {
      const sameTeacherId =
        teacher.teacherId.toLowerCase() === cleanedData.teacherId.toLowerCase();

      if (editingTeacher) {
        return sameTeacherId && teacher.id !== editingTeacher.id;
      }

      return sameTeacherId;
    });

    if (duplicateTeacherId) {
      toast.error("Teacher ID already exists.");
      return;
    }

    const apiPayload = {
      teacherId: cleanedData.teacherId,
      firstName: cleanedData.firstName,
      middleName: cleanedData.middleName,
      lastName: cleanedData.lastName,
      displayName: `${cleanedData.lastName}, ${cleanedData.firstName}`,
      department: cleanedData.department,
      email: cleanedData.email,
      mobile: cleanedData.mobile,
      status: cleanedData.status,
      teacherPhoto: cleanedData.photoFile,
      photoRemoved: cleanedData.photoRemoved,
    };

    if (editingTeacher) {
      const payload = {
        id: editingTeacher.id,
        ...apiPayload,
      };

      await apiDebugRequest({
        module: "teacher",
        action: "update",
        method: "PUT",
        payload,
      });

      setTeachers((current) =>
        current.map((teacher) =>
          teacher.id === editingTeacher.id
            ? {
                ...teacher,
                ...cleanedData,
              }
            : teacher,
        ),
      );

      toast.success("Teacher updated successfully.");
      closeTeacherModal();
      return;
    }

    const newTeacher = {
      id: Date.now(),
      ...cleanedData,
    };

    await apiDebugRequest({
      module: "teacher",
      action: "create",
      method: "POST",
      payload: {
        id: newTeacher.id,
        ...apiPayload,
      },
    });

    setTeachers((current) => [newTeacher, ...current]);
    toast.success("Teacher added successfully.");
    closeTeacherModal();
  };

  const handleDeleteTeacher = async (teacher) => {
    const result = await Swal.fire({
      title: "Delete teacher?",
      text: `${getTeacherDisplayName(teacher)} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "teacher",
      action: "delete",
      method: "DELETE",
      payload: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        displayName: getTeacherDisplayName(teacher),
      },
    });

    setTeachers((current) =>
      current.filter((currentTeacher) => currentTeacher.id !== teacher.id),
    );

    setSelectedTeacherIds((current) =>
      current.filter((id) => id !== teacher.id),
    );

    toast.success("Teacher deleted successfully.");
  };

  const handleToggleTeacherStatus = async (teacher) => {
    if (movingTeacherId) return;

    const nextStatus = teacher.status === "Active" ? "Inactive" : "Active";

    await apiDebugRequest({
      module: "teacher",
      action: "toggle-status",
      method: "PATCH",
      payload: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        previousStatus: teacher.status,
        nextStatus,
      },
    });

    setMovingTeacherId(teacher.id);

    window.setTimeout(() => {
      setTeachers((current) =>
        current.map((currentTeacher) =>
          currentTeacher.id === teacher.id
            ? {
                ...currentTeacher,
                status: nextStatus,
              }
            : currentTeacher,
        ),
      );

      setMovingTeacherId(null);
      setPoppedTeacherId(teacher.id);

      window.setTimeout(() => {
        setPoppedTeacherId(null);
      }, 450);
    }, 260);

    toast.success(`Teacher marked as ${nextStatus}.`);
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Teachers</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage teacher profiles and prepare them for section assignments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {selectedTeacherIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex w-fit items-center gap-2 rounded-md bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
            >
              <FiTrash2 />
              Delete Selected ({selectedTeacherIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={openAddTeacherModal}
            className="flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            <FiPlus />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total Teachers" value={teachers.length} />
        <SummaryCard label="Active Teachers" value={activeTeachers} />
        <SummaryCard label="Inactive Teachers" value={inactiveTeachers} />
        <SummaryCard label="Departments" value={departmentsCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Teacher List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Teacher ID is under the name. Department and contact have separate
              columns.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search teacher, ID, department..."
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

            <div className="flex h-11 rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                  viewMode === "grid"
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiGrid />
                Cards
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                  viewMode === "table"
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiList />
                Table
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <TeacherGrid
            teachers={displayedTeachers}
            selectedTeacherIds={selectedTeacherIds}
            movingTeacherId={movingTeacherId}
            poppedTeacherId={poppedTeacherId}
            onSelect={handleToggleSelect}
            onView={handleViewTeacher}
            onEdit={openEditTeacherModal}
            onDelete={handleDeleteTeacher}
            onToggleStatus={handleToggleTeacherStatus}
          />
        ) : (
          <TeacherTable
            teachers={displayedTeachers}
            selectedTeacherIds={selectedTeacherIds}
            movingTeacherId={movingTeacherId}
            poppedTeacherId={poppedTeacherId}
            allDisplayedSelected={allDisplayedSelected}
            onSelect={handleToggleSelect}
            onSelectAll={handleSelectAllDisplayed}
            onView={handleViewTeacher}
            onEdit={openEditTeacherModal}
            onDelete={handleDeleteTeacher}
            onToggleStatus={handleToggleTeacherStatus}
          />
        )}
      </div>

      <TeacherModal
        isOpen={isTeacherModalOpen}
        editingTeacher={editingTeacher}
        formData={teacherForm}
        setFormData={setTeacherForm}
        onClose={closeTeacherModal}
        onSubmit={handleTeacherSubmit}
      />

      <style>
        {`
          @keyframes teacherPopOut {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            100% {
              opacity: 0.35;
              transform: scale(0.96) translateY(14px);
            }
          }

          @keyframes teacherPopIn {
            0% {
              opacity: 0;
              transform: scale(0.94) translateY(-10px);
            }
            70% {
              opacity: 1;
              transform: scale(1.03) translateY(0);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .teacher-pop-out {
            animation: teacherPopOut 260ms ease-in forwards;
          }

          .teacher-pop-in {
            animation: teacherPopIn 420ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
          }
        `}
      </style>
    </div>
  );
};

const TeacherNameBlock = ({ teacher, inactive = false }) => {
  return (
    <div>
      <p
        className={`text-sm font-black ${
          inactive ? "text-slate-500" : "text-slate-900"
        }`}
      >
        {getTeacherDisplayName(teacher)}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <FiHash className="shrink-0" />
        <span>{teacher.teacherId}</span>
      </div>
    </div>
  );
};

const DepartmentInfo = ({ department }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
      <FiBriefcase className="shrink-0 text-slate-400" />
      <span>{department || "-"}</span>
    </div>
  );
};

const ContactInfo = ({ teacher }) => {
  return (
    <div className="space-y-1 text-sm font-semibold text-slate-600">
      {teacher.email ? (
        <div className="flex items-center gap-2">
          <FiMail className="shrink-0 text-slate-400" />
          <span className="truncate">{teacher.email}</span>
        </div>
      ) : (
        <div className="text-slate-400">No email</div>
      )}

      {teacher.mobile ? (
        <div className="flex items-center gap-2">
          <FiPhone className="shrink-0 text-slate-400" />
          <span>{teacher.mobile}</span>
        </div>
      ) : (
        <div className="text-slate-400">No mobile</div>
      )}
    </div>
  );
};

const TeacherGrid = ({
  teachers,
  selectedTeacherIds,
  movingTeacherId,
  poppedTeacherId,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (teachers.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {teachers.map((teacher) => {
        const isInactive = teacher.status === "Inactive";
        const isMoving = movingTeacherId === teacher.id;
        const isPopped = poppedTeacherId === teacher.id;
        const isSelected = selectedTeacherIds.includes(teacher.id);

        return (
          <div
            key={teacher.id}
            className={`relative overflow-hidden rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              isSelected
                ? "border-cyan-300 ring-4 ring-cyan-50"
                : "border-slate-200"
            } ${
              isInactive ? "bg-slate-50 opacity-75" : "bg-white"
            } ${isMoving ? "teacher-pop-out" : ""} ${
              isPopped ? "teacher-pop-in" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(teacher.id)}
                className="h-4 w-4 cursor-pointer accent-cyan-600"
              />

              <div className="flex gap-2">
                <IconButton type="view" onClick={() => onView(teacher)} />
                <IconButton type="edit" onClick={() => onEdit(teacher)} />
                <IconButton type="delete" onClick={() => onDelete(teacher)} />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <TeacherAvatar
                teacher={teacher}
                size="hero"
                inactive={isInactive}
              />

              <div className="mt-5 text-center">
                <TeacherNameBlock teacher={teacher} inactive={isInactive} />
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-md bg-slate-50 p-4 text-left">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                  Department
                </p>
                <DepartmentInfo department={teacher.department} />
              </div>

              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                  Contact
                </p>
                <ContactInfo teacher={teacher} />
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <StatusToggle
                status={teacher.status}
                disabled={Boolean(movingTeacherId)}
                onClick={() => onToggleStatus(teacher)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TeacherTable = ({
  teachers,
  selectedTeacherIds,
  movingTeacherId,
  poppedTeacherId,
  allDisplayedSelected,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="w-14 px-5 py-3">
              <input
                type="checkbox"
                checked={allDisplayedSelected}
                onChange={onSelectAll}
                className="h-4 w-4 cursor-pointer accent-cyan-600"
              />
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Teacher
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Department
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Contact
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
          {teachers.length > 0 ? (
            teachers.map((teacher) => {
              const isInactive = teacher.status === "Inactive";
              const isMoving = movingTeacherId === teacher.id;
              const isPopped = poppedTeacherId === teacher.id;
              const isSelected = selectedTeacherIds.includes(teacher.id);

              return (
                <tr
                  key={teacher.id}
                  className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                    isSelected ? "bg-cyan-50/40" : ""
                  } ${isInactive ? "bg-slate-50 opacity-75" : ""} ${
                    isMoving ? "teacher-pop-out" : ""
                  } ${isPopped ? "teacher-pop-in" : ""}`}
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(teacher.id)}
                      className="h-4 w-4 cursor-pointer accent-cyan-600"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacher={teacher} inactive={isInactive} />
                      <TeacherNameBlock
                        teacher={teacher}
                        inactive={isInactive}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <DepartmentInfo department={teacher.department} />
                  </td>

                  <td className="px-5 py-4">
                    <ContactInfo teacher={teacher} />
                  </td>

                  <td className="px-5 py-4">
                    <StatusButton
                      status={teacher.status}
                      disabled={Boolean(movingTeacherId)}
                      onClick={() => onToggleStatus(teacher)}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <IconButton type="view" onClick={() => onView(teacher)} />
                      <IconButton type="edit" onClick={() => onEdit(teacher)} />
                      <IconButton
                        type="delete"
                        onClick={() => onDelete(teacher)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">
                <EmptyState />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const TeacherAvatar = ({ teacher, size = "normal", inactive = false }) => {
  const sizeClass =
    size === "hero"
      ? "h-32 w-32 text-3xl"
      : size === "large"
        ? "h-16 w-16 text-sm"
        : "h-10 w-10 text-xs";

  if (teacher.photoPreview) {
    return (
      <img
        src={teacher.photoPreview}
        alt={getTeacherDisplayName(teacher)}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-4 ${
          inactive ? "grayscale ring-slate-200" : "ring-slate-100"
        }`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-black ring-4 ${
        inactive
          ? "bg-slate-100 text-slate-400 ring-slate-200"
          : getAvatarStyle(teacher.id)
      }`}
    >
      {getInitials(teacher)}
    </div>
  );
};

const StatusToggle = ({ status, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={status === "Active" ? "Set inactive" : "Set active"}
      className={`flex h-8 w-14 cursor-pointer items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        status === "Active" ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition ${
          status === "Active" ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
};

const StatusButton = ({ status, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={
        status === "Active" ? "Click to set inactive" : "Click to set active"
      }
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </button>
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

const IconButton = ({ type, onClick }) => {
  const buttonStyles = {
    view: "bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white",
    edit: "bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white",
    delete: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  const icons = {
    view: <FiEye />,
    edit: <FiEdit2 />,
    delete: <FiTrash2 />,
  };

  const labels = {
    view: "View Teacher",
    edit: "Edit Teacher",
    delete: "Delete Teacher",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={labels[type]}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${buttonStyles[type]}`}
    >
      {icons[type]}
    </button>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-black text-slate-900">No teachers found</p>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or add a new teacher.
      </p>
    </div>
  );
};

export default Teachers;
