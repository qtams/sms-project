import { useMemo, useState } from "react";
import {
  FiEdit2,
  FiGrid,
  FiList,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import StudentModal from "../components/modals/StudentModal";
import { apiDebugRequest } from "../utils/apiDebugger";

const defaultStudentForm = {
  studentId: "",
  lrn: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  gradeLevel: "",
  section: "",
  birthDate: "",
  guardianName: "",
  guardianContact: "",
  address: "",
  status: "Active",
  photoFile: null,
  photoPreview: "",
  photoRemoved: false,
};

const initialStudents = [
  {
    id: 1,
    studentId: "STD-0001",
    lrn: "123456789012",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gender: "Male",
    gradeLevel: "Grade 7",
    section: "A",
    birthDate: "2013-05-10",
    guardianName: "Maria Dela Cruz",
    guardianContact: "09123456789",
    address: "Cagayan de Oro City",
    status: "Active",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 2,
    studentId: "STD-0002",
    lrn: "987654321012",
    firstName: "Ana",
    middleName: "",
    lastName: "Santos",
    gender: "Female",
    gradeLevel: "Grade 8",
    section: "B",
    birthDate: "2012-03-18",
    guardianName: "Pedro Santos",
    guardianContact: "09987654321",
    address: "Misamis Oriental",
    status: "Active",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 3,
    studentId: "STD-0003",
    lrn: "",
    firstName: "Carlo",
    middleName: "",
    lastName: "Reyes",
    gender: "Male",
    gradeLevel: "Grade 11",
    section: "STEM A",
    birthDate: "2010-08-22",
    guardianName: "",
    guardianContact: "",
    address: "",
    status: "Inactive",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
];

const getStudentDisplayName = (student) => {
  return `${student.lastName}, ${student.firstName}`;
};

const getInitials = (student) => {
  const firstInitial = student.firstName?.[0] || "";
  const lastInitial = student.lastName?.[0] || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (studentId) => {
  return avatarStyles[studentId % avatarStyles.length];
};

const Students = () => {
  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [movingStudentId, setMovingStudentId] = useState(null);
  const [poppedStudentId, setPoppedStudentId] = useState(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState(defaultStudentForm);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        getStudentDisplayName(student).toLowerCase().includes(searchValue) ||
        student.studentId.toLowerCase().includes(searchValue) ||
        student.lrn.toLowerCase().includes(searchValue) ||
        student.gradeLevel.toLowerCase().includes(searchValue) ||
        student.section.toLowerCase().includes(searchValue) ||
        student.guardianName.toLowerCase().includes(searchValue) ||
        student.guardianContact.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const displayedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "Active" ? -1 : 1;
      }

      return getStudentDisplayName(a).localeCompare(getStudentDisplayName(b));
    });
  }, [filteredStudents]);

  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  const gradeLevelCount = new Set(
    students.map((student) => student.gradeLevel).filter(Boolean),
  ).size;

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setStudentForm(defaultStudentForm);
    setIsStudentModalOpen(true);
  };

  const openEditStudentModal = (student) => {
    setEditingStudent(student);

    setStudentForm({
      studentId: student.studentId,
      lrn: student.lrn,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gender: student.gender,
      gradeLevel: student.gradeLevel,
      section: student.section,
      birthDate: student.birthDate,
      guardianName: student.guardianName,
      guardianContact: student.guardianContact,
      address: student.address,
      status: student.status,
      photoFile: null,
      photoPreview: student.photoPreview || "",
      photoRemoved: false,
    });

    setIsStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    setStudentForm(defaultStudentForm);
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    const cleanedData = {
      ...studentForm,
      studentId: studentForm.studentId.trim(),
      lrn: studentForm.lrn.trim(),
      firstName: studentForm.firstName.trim(),
      middleName: studentForm.middleName.trim(),
      lastName: studentForm.lastName.trim(),
      gender: studentForm.gender.trim(),
      gradeLevel: studentForm.gradeLevel.trim(),
      section: studentForm.section.trim(),
      birthDate: studentForm.birthDate,
      guardianName: studentForm.guardianName.trim(),
      guardianContact: studentForm.guardianContact.trim(),
      address: studentForm.address.trim(),
    };

    if (
      !cleanedData.studentId ||
      !cleanedData.firstName ||
      !cleanedData.lastName ||
      !cleanedData.gender ||
      !cleanedData.gradeLevel ||
      !cleanedData.section
    ) {
      toast.error("Please complete all required student details.");
      return;
    }

    const duplicateStudentId = students.some((student) => {
      const sameStudentId =
        student.studentId.toLowerCase() === cleanedData.studentId.toLowerCase();

      if (editingStudent) {
        return sameStudentId && student.id !== editingStudent.id;
      }

      return sameStudentId;
    });

    if (duplicateStudentId) {
      toast.error("Student ID already exists.");
      return;
    }

    const apiPayload = {
      studentId: cleanedData.studentId,
      lrn: cleanedData.lrn,
      firstName: cleanedData.firstName,
      middleName: cleanedData.middleName,
      lastName: cleanedData.lastName,
      displayName: `${cleanedData.lastName}, ${cleanedData.firstName}`,
      gender: cleanedData.gender,
      gradeLevel: cleanedData.gradeLevel,
      section: cleanedData.section,
      birthDate: cleanedData.birthDate,
      guardianName: cleanedData.guardianName,
      guardianContact: cleanedData.guardianContact,
      address: cleanedData.address,
      status: cleanedData.status,
      studentPhoto: cleanedData.photoFile,
      photoRemoved: cleanedData.photoRemoved,
    };

    if (editingStudent) {
      const payload = {
        id: editingStudent.id,
        ...apiPayload,
      };

      await apiDebugRequest({
        module: "student",
        action: "update",
        method: "PUT",
        payload,
      });

      setStudents((current) =>
        current.map((student) =>
          student.id === editingStudent.id
            ? {
                ...student,
                ...cleanedData,
              }
            : student,
        ),
      );

      toast.success("Student updated successfully.");
      closeStudentModal();
      return;
    }

    const newStudent = {
      id: Date.now(),
      ...cleanedData,
    };

    await apiDebugRequest({
      module: "student",
      action: "create",
      method: "POST",
      payload: {
        id: newStudent.id,
        ...apiPayload,
      },
    });

    setStudents((current) => [newStudent, ...current]);
    toast.success("Student added successfully.");
    closeStudentModal();
  };

  const handleDeleteStudent = async (student) => {
    const result = await Swal.fire({
      title: "Delete student?",
      text: `${getStudentDisplayName(student)} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "student",
      action: "delete",
      method: "DELETE",
      payload: {
        id: student.id,
        studentId: student.studentId,
        displayName: getStudentDisplayName(student),
      },
    });

    setStudents((current) =>
      current.filter((currentStudent) => currentStudent.id !== student.id),
    );

    toast.success("Student deleted successfully.");
  };

  const handleToggleStudentStatus = async (student) => {
    if (movingStudentId) return;

    const nextStatus = student.status === "Active" ? "Inactive" : "Active";

    await apiDebugRequest({
      module: "student",
      action: "toggle-status",
      method: "PATCH",
      payload: {
        id: student.id,
        studentId: student.studentId,
        previousStatus: student.status,
        nextStatus,
      },
    });

    setMovingStudentId(student.id);

    window.setTimeout(() => {
      setStudents((current) =>
        current.map((currentStudent) =>
          currentStudent.id === student.id
            ? {
                ...currentStudent,
                status: nextStatus,
              }
            : currentStudent,
        ),
      );

      setMovingStudentId(null);
      setPoppedStudentId(student.id);

      window.setTimeout(() => {
        setPoppedStudentId(null);
      }, 450);
    }, 260);

    toast.success(`Student marked as ${nextStatus}.`);
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Students</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage student profiles and connect them to grade levels and
            sections.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddStudentModal}
          className="flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
        >
          <FiPlus />
          Add Student
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total Students" value={students.length} />
        <SummaryCard label="Active Students" value={activeStudents} />
        <SummaryCard label="Inactive Students" value={inactiveStudents} />
        <SummaryCard label="Grade Levels" value={gradeLevelCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Student List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Active students stay first. Inactive students move to the bottom.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, ID, grade..."
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
          <StudentGrid
            students={displayedStudents}
            movingStudentId={movingStudentId}
            poppedStudentId={poppedStudentId}
            onEdit={openEditStudentModal}
            onDelete={handleDeleteStudent}
            onToggleStatus={handleToggleStudentStatus}
          />
        ) : (
          <StudentTable
            students={displayedStudents}
            movingStudentId={movingStudentId}
            poppedStudentId={poppedStudentId}
            onEdit={openEditStudentModal}
            onDelete={handleDeleteStudent}
            onToggleStatus={handleToggleStudentStatus}
          />
        )}
      </div>

      <StudentModal
        isOpen={isStudentModalOpen}
        editingStudent={editingStudent}
        formData={studentForm}
        setFormData={setStudentForm}
        onClose={closeStudentModal}
        onSubmit={handleStudentSubmit}
      />

      <style>
        {`
          @keyframes studentPopOut {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            100% {
              opacity: 0.35;
              transform: scale(0.96) translateY(14px);
            }
          }

          @keyframes studentPopIn {
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

          .student-pop-out {
            animation: studentPopOut 260ms ease-in forwards;
          }

          .student-pop-in {
            animation: studentPopIn 420ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
          }
        `}
      </style>
    </div>
  );
};

const StudentGrid = ({
  students,
  movingStudentId,
  poppedStudentId,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (students.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {students.map((student) => {
        const isInactive = student.status === "Inactive";
        const isMoving = movingStudentId === student.id;
        const isPopped = poppedStudentId === student.id;

        return (
          <div
            key={student.id}
            className={`relative overflow-hidden rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              isInactive
                ? "border-slate-200 bg-slate-50 opacity-75"
                : "border-slate-200 bg-white"
            } ${isMoving ? "student-pop-out" : ""} ${
              isPopped ? "student-pop-in" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <StatusToggle
                status={student.status}
                disabled={Boolean(movingStudentId)}
                onClick={() => onToggleStatus(student)}
              />

              <div className="flex gap-2">
                <IconButton type="edit" onClick={() => onEdit(student)} />
                <IconButton type="delete" onClick={() => onDelete(student)} />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <StudentAvatar
                student={student}
                size="hero"
                inactive={isInactive}
              />

              <h3
                className={`mt-5 max-w-[280px] text-lg font-black leading-snug ${
                  isInactive ? "text-slate-500" : "text-slate-950"
                }`}
              >
                {getStudentDisplayName(student)}
              </h3>

              <p className="mt-1 text-xs font-bold text-slate-400">
                {student.studentId}
              </p>
            </div>

            <div
              className={`mt-5 rounded-md p-4 text-left ${
                isInactive ? "bg-slate-100" : "bg-slate-50"
              }`}
            >
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Class
                </p>

                <p
                  className={`mt-1 text-sm font-black ${
                    isInactive ? "text-slate-500" : "text-slate-700"
                  }`}
                >
                  {student.gradeLevel} - {student.section}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Guardian
                </p>

                <div className="mt-3 space-y-2">
                  {student.guardianName ? (
                    <div
                      className={`flex items-center gap-2 text-sm font-bold ${
                        isInactive ? "text-slate-500" : "text-slate-600"
                      }`}
                    >
                      <FiUser className="shrink-0 text-slate-400" />
                      <span className="truncate">{student.guardianName}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-400">
                      No guardian
                    </div>
                  )}

                  {student.guardianContact ? (
                    <div
                      className={`flex items-center gap-2 text-sm font-bold ${
                        isInactive ? "text-slate-500" : "text-slate-600"
                      }`}
                    >
                      <FiPhone className="shrink-0 text-slate-400" />
                      <span>{student.guardianContact}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-400">
                      No contact
                    </div>
                  )}

                  {student.address ? (
                    <div
                      className={`flex items-center gap-2 text-sm font-bold ${
                        isInactive ? "text-slate-500" : "text-slate-600"
                      }`}
                    >
                      <FiMapPin className="shrink-0 text-slate-400" />
                      <span className="truncate">{student.address}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-400">
                      No address
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <StatusPill status={student.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StudentTable = ({
  students,
  movingStudentId,
  poppedStudentId,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Student
            </th>
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Student ID
            </th>
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Class
            </th>
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Guardian
            </th>
            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Address
            </th>
            <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {students.length > 0 ? (
            students.map((student) => {
              const isInactive = student.status === "Inactive";
              const isMoving = movingStudentId === student.id;
              const isPopped = poppedStudentId === student.id;

              return (
                <tr
                  key={student.id}
                  className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                    isInactive ? "bg-slate-50 opacity-75" : "bg-white"
                  } ${isMoving ? "student-pop-out" : ""} ${
                    isPopped ? "student-pop-in" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <StatusToggle
                      status={student.status}
                      disabled={Boolean(movingStudentId)}
                      onClick={() => onToggleStatus(student)}
                    />
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar student={student} inactive={isInactive} />

                      <div>
                        <p
                          className={`text-sm font-black ${
                            isInactive ? "text-slate-500" : "text-slate-900"
                          }`}
                        >
                          {getStudentDisplayName(student)}
                        </p>

                        <p className="text-xs font-semibold text-slate-400">
                          {student.gender}
                          {student.lrn ? ` • LRN ${student.lrn}` : ""}
                        </p>

                        <div className="mt-1">
                          <StatusBadge status={student.status} />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-sm font-bold text-slate-700">
                    {student.studentId}
                  </td>

                  <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                    {student.gradeLevel} - {student.section}
                  </td>

                  <td className="px-5 py-3">
                    <div className="space-y-1 text-sm font-semibold text-slate-600">
                      {student.guardianName ? (
                        <div className="flex items-center gap-2">
                          <FiUser className="text-slate-400" />
                          {student.guardianName}
                        </div>
                      ) : (
                        <div className="text-slate-400">No guardian</div>
                      )}

                      {student.guardianContact ? (
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-slate-400" />
                          {student.guardianContact}
                        </div>
                      ) : (
                        <div className="text-slate-400">No contact</div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                    {student.address || "-"}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <IconButton type="edit" onClick={() => onEdit(student)} />
                      <IconButton
                        type="delete"
                        onClick={() => onDelete(student)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7">
                <EmptyState />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const StudentAvatar = ({ student, size = "normal", inactive = false }) => {
  const sizeClass =
    size === "hero"
      ? "h-32 w-32 text-3xl"
      : size === "large"
        ? "h-16 w-16 text-sm"
        : "h-10 w-10 text-xs";

  if (student.photoPreview) {
    return (
      <img
        src={student.photoPreview}
        alt={getStudentDisplayName(student)}
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
          : getAvatarStyle(student.id)
      }`}
    >
      {getInitials(student)}
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

const StatusPill = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
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

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`rounded-md px-2 py-1 text-[11px] font-black ${
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
  const isDelete = type === "delete";

  return (
    <button
      type="button"
      onClick={onClick}
      title={isDelete ? "Delete Student" : "Edit Student"}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${
        isDelete
          ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
          : "bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white"
      }`}
    >
      {isDelete ? <FiTrash2 /> : <FiEdit2 />}
    </button>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-black text-slate-900">No students found</p>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or add a new student.
      </p>
    </div>
  );
};

export default Students;
