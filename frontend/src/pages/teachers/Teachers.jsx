import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiHash,
  FiMail,
  FiPhone,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import TeacherModal from "../../components/modals/teachers/TeacherModal";
import api from "../../services/api";
import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { Skeleton } from "../../components/skeleton";

/* =========================================================
   OPTIONS
========================================================= */

const teacherStatusOptions = ["Active", "Inactive"];

const defaultTeacherForm = {
  teacherId: "",
  rfid: "",
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

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (value, isActive) => {
  const status = String(value || "").toLowerCase();

  if (status === "active") {
    return "Active";
  }

  if (status === "inactive") {
    return "Inactive";
  }

  if (isActive === true || isActive === 1 || isActive === "1") {
    return "Active";
  }

  return "Inactive";
};

const normalizeTeacher = (teacher) => {
  if (!teacher) {
    return null;
  }

  const id = teacher.id ?? teacher.teacher_record_id ?? teacher.teacherRecordId;

  return {
    ...teacher,
    id,
    teacherId: teacher.teacherId ?? teacher.teacher_id ?? "",
    rfid: teacher.rfid ?? teacher.rfid_number ?? "",
    firstName: teacher.firstName ?? teacher.first_name ?? "",
    middleName: teacher.middleName ?? teacher.middle_name ?? "",
    lastName: teacher.lastName ?? teacher.last_name ?? "",
    gender: teacher.gender ?? "",
    department:
      teacher.department?.name ??
      teacher.department ??
      teacher.department_name ??
      "",
    position:
      teacher.position?.name ?? teacher.position ?? teacher.position_name ?? "",
    email: teacher.email ?? "",
    mobile:
      teacher.mobile ?? teacher.mobile_number ?? teacher.contact_number ?? "",
    address: teacher.address ?? "",
    status: normalizeStatus(teacher.status, teacher.is_active),
    photoPreview:
      teacher.photoPreview ??
      teacher.photo_preview ??
      teacher.photoUrl ??
      teacher.photo_url ??
      "",
  };
};

const extractTeachers = (response) => {
  const data = response?.data ?? {};

  let rows = [];

  if (Array.isArray(data)) {
    rows = data;
  } else if (Array.isArray(data.teachers)) {
    rows = data.teachers;
  } else if (Array.isArray(data.data)) {
    rows = data.data;
  } else if (Array.isArray(data.data?.teachers)) {
    rows = data.data.teachers;
  }

  return rows.map(normalizeTeacher).filter(Boolean);
};

const extractTeacher = (response) => {
  const data = response?.data ?? {};

  const teacher = data.teacher ?? data.data?.teacher ?? data.data ?? null;

  if (!teacher || Array.isArray(teacher) || typeof teacher !== "object") {
    return null;
  }

  return normalizeTeacher(teacher);
};

const getApiErrorMessage = (error, fallback) => {
  const errors = error?.response?.data?.errors;

  if (errors) {
    const firstError = Object.values(errors).flat().find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return error?.response?.data?.message || error?.message || fallback;
};

const getTeacherDisplayName = (teacher) => {
  const lastName = teacher?.lastName || "";
  const firstName = teacher?.firstName || "";

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  return [firstName, lastName].filter(Boolean).join(" ") || "-";
};

const getInitials = (teacher) => {
  const first = teacher?.firstName?.[0] || "";
  const last = teacher?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "?";
};

const getAvatarStyle = (teacherId) => {
  const numericId = Number(teacherId) || 0;

  return avatarStyles[numericId % avatarStyles.length];
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

const createTeacherFormData = (teacher) => {
  const formData = new FormData();

  formData.append("teacherId", teacher.teacherId);
  formData.append("rfid", teacher.rfid || "");
  formData.append("firstName", teacher.firstName);
  formData.append("middleName", teacher.middleName || "");
  formData.append("lastName", teacher.lastName);
  formData.append("department", teacher.department);
  formData.append("email", teacher.email || "");
  formData.append("mobile", teacher.mobile || "");
  formData.append("status", teacher.status || "Active");
  formData.append("photoRemoved", teacher.photoRemoved ? "1" : "0");

  if (teacher.photoFile instanceof File) {
    formData.append("teacherPhoto", teacher.photoFile);
  }

  return formData;
};

/* =========================================================
   PAGE
========================================================= */

const Teachers = () => {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [movingTeacherId, setMovingTeacherId] = useState(null);
  const [poppedTeacherId, setPoppedTeacherId] = useState(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    ...defaultTeacherForm,
  });

  /* =======================================================
     LOAD TEACHERS
  ======================================================= */

  const loadTeachers = useCallback(async ({ showSkeleton = true } = {}) => {
    if (showSkeleton) {
      setIsLoading(true);
    }

    try {
      const response = await api.get("/api/teachers");

      setTeachers(extractTeachers(response));
    } catch (error) {
      console.error("Unable to load teachers:", error);

      if (showSkeleton) {
        setTeachers([]);
      }

      toast.error(getApiErrorMessage(error, "Unable to load teachers."));
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !query ||
        [
          getTeacherDisplayName(teacher),
          teacher.teacherId,
          teacher.rfid,
          teacher.department,
          teacher.email,
          teacher.mobile,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "All" || teacher.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  /* =======================================================
     SORT
  ======================================================= */

  const displayedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "Active" ? -1 : 1;
      }

      return getTeacherDisplayName(a).localeCompare(getTeacherDisplayName(b));
    });
  }, [filteredTeachers]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(displayedTeachers.length / rowsPerPage),
  );

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTeachers = displayedTeachers.slice(startIndex, endIndex);
  const showingStart = displayedTeachers.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, displayedTeachers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "Active",
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "Inactive",
  ).length;

  const departmentsCount = new Set(
    teachers.map((teacher) => teacher.department).filter(Boolean),
  ).size;

  const summaryItems = [
    {
      key: "total",
      label: "Total Teachers",
      value: teachers.length,
    },
    {
      key: "active",
      label: "Active",
      value: activeTeachers,
    },
    {
      key: "inactive",
      label: "Inactive",
      value: inactiveTeachers,
    },
    {
      key: "departments",
      label: "Departments",
      value: departmentsCount,
    },
  ];

  /* =======================================================
     SELECT
  ======================================================= */

  const allDisplayedSelected =
    paginatedTeachers.length > 0 &&
    paginatedTeachers.every((teacher) =>
      selectedTeacherIds.includes(teacher.id),
    );

  const handleToggleSelect = (teacherId) => {
    setSelectedTeacherIds((current) => {
      if (current.includes(teacherId)) {
        return current.filter((id) => id !== teacherId);
      }

      return [...current, teacherId];
    });
  };

  const handleSelectAllDisplayed = () => {
    const displayedIds = paginatedTeachers.map((teacher) => teacher.id);

    if (allDisplayedSelected) {
      setSelectedTeacherIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedTeacherIds((current) => {
      const next = [...current];

      displayedIds.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });

      return next;
    });
  };

  /* =======================================================
     MODAL
  ======================================================= */

  const openAddTeacherModal = () => {
    setTeacherForm({
      ...defaultTeacherForm,
    });

    setIsTeacherModalOpen(true);
  };

  const closeTeacherModal = () => {
    if (isSaving) {
      return;
    }

    setIsTeacherModalOpen(false);

    setTeacherForm({
      ...defaultTeacherForm,
    });
  };

  /* =======================================================
     VIEW
  ======================================================= */

  const handleViewTeacher = (teacher) => {
    if (!teacher?.teacherId) {
      toast.error("Teacher ID is missing.");

      return;
    }

    navigate(`/teachers/${encodeURIComponent(teacher.teacherId)}`);
  };

  /* =======================================================
     CREATE TEACHER
  ======================================================= */

  const handleTeacherSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const cleanedData = {
      ...teacherForm,
      teacherId: teacherForm.teacherId.trim(),
      rfid: teacherForm.rfid.trim(),
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

    const duplicateTeacherId = teachers.some(
      (teacher) =>
        String(teacher.teacherId).toLowerCase() ===
        cleanedData.teacherId.toLowerCase(),
    );

    if (duplicateTeacherId) {
      toast.error("Teacher ID already exists.");

      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post(
        "/api/teachers",
        createTeacherFormData(cleanedData),
      );

      const savedTeacher = extractTeacher(response);

      if (savedTeacher?.id) {
        setTeachers((current) => [savedTeacher, ...current]);
      } else {
        await loadTeachers({
          showSkeleton: false,
        });
      }

      setIsTeacherModalOpen(false);

      setTeacherForm({
        ...defaultTeacherForm,
      });

      toast.success(response?.data?.message || "Teacher added successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to add teacher."));
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDeleteTeacher = async (teacher) => {
    const result = await Swal.fire({
      title: "Delete Teacher?",
      text: `${getTeacherDisplayName(teacher)} will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.delete(
        `/api/teachers/${encodeURIComponent(teacher.teacherId)}`,
      );

      setTeachers((current) =>
        current.filter(
          (currentTeacher) => String(currentTeacher.id) !== String(teacher.id),
        ),
      );

      setSelectedTeacherIds((current) =>
        current.filter((id) => String(id) !== String(teacher.id)),
      );

      toast.success("Teacher deleted successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete teacher."));
    }
  };

  /* =======================================================
     BULK DELETE
  ======================================================= */

  const handleBulkDelete = async () => {
    if (selectedTeacherIds.length === 0) {
      return;
    }

    const selectedTeachers = teachers.filter((teacher) =>
      selectedTeacherIds.includes(teacher.id),
    );

    const result = await Swal.fire({
      title: "Delete Selected Teachers?",
      text: `${selectedTeachers.length} teacher record(s) will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedTeachers.map((teacher) =>
          api.delete(`/api/teachers/${encodeURIComponent(teacher.teacherId)}`),
        ),
      );

      const deletedIds = selectedTeachers
        .filter((_, index) => results[index]?.status === "fulfilled")
        .map((teacher) => teacher.id);

      setTeachers((current) =>
        current.filter((teacher) => !deletedIds.includes(teacher.id)),
      );

      setSelectedTeacherIds([]);

      const failed = results.length - deletedIds.length;

      if (failed > 0) {
        toast.warning(`${deletedIds.length} deleted, ${failed} failed.`);
      } else {
        toast.success("Selected teachers deleted successfully.");
      }
    } catch {
      toast.error("Unable to delete selected teachers.");
    }
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const handleToggleTeacherStatus = async (teacher) => {
    if (movingTeacherId) {
      return;
    }

    const nextStatus = teacher.status === "Active" ? "Inactive" : "Active";

    const result = await Swal.fire({
      title:
        nextStatus === "Active" ? "Activate Teacher?" : "Deactivate Teacher?",
      text: `Set ${getTeacherDisplayName(teacher)} as ${nextStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: nextStatus === "Active" ? "Activate" : "Deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: nextStatus === "Active" ? "#059669" : "#f97316",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setMovingTeacherId(teacher.id);

    try {
      const response = await api.patch(
        `/api/teachers/${encodeURIComponent(teacher.teacherId)}`,
        {
          status: nextStatus,
        },
      );

      const updatedTeacher = extractTeacher(response);

      setTeachers((current) =>
        current.map((currentTeacher) =>
          String(currentTeacher.id) === String(teacher.id)
            ? updatedTeacher?.id
              ? updatedTeacher
              : {
                  ...currentTeacher,
                  status: nextStatus,
                }
            : currentTeacher,
        ),
      );

      setPoppedTeacherId(teacher.id);

      window.setTimeout(() => {
        setPoppedTeacherId(null);
      }, 450);

      toast.success(
        response?.data?.message ||
          `${getTeacherDisplayName(teacher)} is now ${nextStatus}.`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to change teacher status."),
      );
    } finally {
      setMovingTeacherId(null);
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExportTeachers = () => {
    if (isLoading) {
      return;
    }

    if (displayedTeachers.length === 0) {
      toast.warning("No teacher records available to export.");

      return;
    }

    const header = [
      "Teacher ID",
      "RFID",
      "Name",
      "Department",
      "Email",
      "Mobile",
      "Status",
    ];

    const rows = displayedTeachers.map((teacher) =>
      [
        teacher.teacherId,
        teacher.rfid,
        getTeacherDisplayName(teacher),
        teacher.department,
        teacher.email,
        teacher.mobile,
        teacher.status,
      ]
        .map(csvValue)
        .join(","),
    );

    const csvContent = [header.map(csvValue).join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "teachers-export.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Teachers exported successfully.");
  };

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const teacherColumns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allDisplayedSelected}
          onChange={handleSelectAllDisplayed}
          aria-label="Select all displayed teachers"
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />
      ),
      render: (teacher) => (
        <input
          type="checkbox"
          checked={selectedTeacherIds.includes(teacher.id)}
          onChange={() => handleToggleSelect(teacher.id)}
          aria-label={`Select ${getTeacherDisplayName(teacher)}`}
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      render: (teacher) => {
        const inactive = teacher.status === "Inactive";

        return (
          <div className="flex items-center gap-3">
            <TeacherAvatar teacher={teacher} inactive={inactive} />
            <TeacherNameBlock teacher={teacher} inactive={inactive} />
          </div>
        );
      },
    },
    {
      key: "rfid",
      label: "RFID",
      render: (teacher) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiCreditCard className="shrink-0 text-[#94a3b8]" />
          {teacher.rfid || "-"}
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (teacher) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiBriefcase className="shrink-0 text-[#94a3b8]" />
          {teacher.department || "-"}
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (teacher) => (
        <div className="space-y-1 text-[11px] text-[#69768b]">
          <div className="flex items-center gap-2">
            <FiMail className="shrink-0 text-[#94a3b8]" />
            <span>{teacher.email || "-"}</span>
          </div>

          <div className="flex items-center gap-2">
            <FiPhone className="shrink-0 text-[#94a3b8]" />
            <span>{teacher.mobile || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (teacher) => (
        <StatusButton
          status={teacher.status}
          disabled={movingTeacherId === teacher.id}
          onClick={() => handleToggleTeacherStatus(teacher)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (teacher) => (
        <div className="flex items-center gap-2">
          <IconButton type="view" onClick={() => handleViewTeacher(teacher)} />
          <IconButton
            type="delete"
            onClick={() => handleDeleteTeacher(teacher)}
          />
        </div>
      ),
    },
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {isLoading ? (
          <Skeleton className="h-7 w-36" />
        ) : (
          <h1 className="text-2xl font-medium text-slate-950">Teachers</h1>
        )}

        {isLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTeacherIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-[12px] text-white transition hover:bg-red-600"
              >
                <FiTrash2 />
                Delete Selected ({selectedTeacherIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={handleExportTeachers}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[12px] text-[#69768b] transition hover:border-[#01B8E5]/40 hover:text-[#01B8E5]"
            >
              <FiDownload />
              Export
            </button>

            <button
              type="button"
              onClick={openAddTeacherModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#01B8E5] px-4 text-[12px] text-white transition hover:bg-[#019BC2]"
            >
              <FiPlus />
              Add Teacher
            </button>
          </div>
        )}
      </div>

      {/* SHARED SUMMARY + SUMMARY SKELETON */}

      <SummaryCards columns={4} loading={isLoading} items={summaryItems} />

      {/* SHARED DATA TABLE + TABLE/CARD SKELETON + TOOLBAR + PAGINATION */}

      <DataTable
        title="Teacher List"
        subtitle="View and manage teacher records."
        columns={teacherColumns}
        rows={paginatedTeachers}
        rowKey={(teacher) => teacher.id ?? teacher.teacherId}
        loading={isLoading}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search teacher, ID, RFID, department...",
        }}
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            {
              label: "All Status",
              value: "All",
            },
            ...teacherStatusOptions.map((status) => ({
              label: status,
              value: status,
            })),
          ],
        }}
        onReset={handleResetFilter}
        view={{
          mode: viewMode,
          onChange: setViewMode,
        }}
        renderCard={(teacher) => (
          <TeacherCard
            teacher={teacher}
            selected={selectedTeacherIds.includes(teacher.id)}
            pending={movingTeacherId === teacher.id}
            popped={poppedTeacherId === teacher.id}
            onSelect={handleToggleSelect}
            onView={handleViewTeacher}
            onDelete={handleDeleteTeacher}
            onToggleStatus={handleToggleTeacherStatus}
          />
        )}
        pagination={{
          currentPage,
          totalPages,
          rowsPerPage,
          totalRows: displayedTeachers.length,
          showingStart,
          showingEnd,
          onRowsPerPageChange: setRowsPerPage,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No teachers found"
        emptyDescription="Try changing your filters or add a teacher."
      />

      {/* MODAL */}

      <TeacherModal
        isOpen={isTeacherModalOpen}
        editingTeacher={null}
        formData={teacherForm}
        setFormData={setTeacherForm}
        isSaving={isSaving}
        onClose={closeTeacherModal}
        onSubmit={handleTeacherSubmit}
      />

      <style>
        {`
          @keyframes teacherPopIn {
            0% {
              opacity: 0;
              transform: scale(0.97);
            }

            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .teacher-pop-in {
            animation: teacherPopIn 350ms ease both;
          }
        `}
      </style>
    </div>
  );
};

/* =========================================================
   TEACHER CARD
========================================================= */

const TeacherCard = ({
  teacher,
  selected,
  pending,
  popped,
  onSelect,
  onView,
  onDelete,
  onToggleStatus,
}) => {
  const inactive = teacher.status === "Inactive";

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-md
        border
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
        ${selected ? "border-cyan-300 ring-4 ring-cyan-50" : "border-slate-200"}
        ${inactive ? "bg-slate-50" : "bg-white"}
        ${popped ? "teacher-pop-in" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(teacher.id)}
          aria-label={`Select ${getTeacherDisplayName(teacher)}`}
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />

        <div className="flex gap-2">
          <IconButton type="view" onClick={() => onView(teacher)} />
          <IconButton type="delete" onClick={() => onDelete(teacher)} />
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <TeacherAvatar teacher={teacher} size="hero" inactive={inactive} />

        <div className="mt-4">
          <TeacherNameBlock teacher={teacher} inactive={inactive} />
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4">
        <InfoRow
          label="RFID"
          icon={<FiCreditCard />}
          value={teacher.rfid || "-"}
        />

        <InfoRow
          label="Department"
          icon={<FiBriefcase />}
          value={teacher.department || "-"}
        />

        <InfoRow label="Email" icon={<FiMail />} value={teacher.email || "-"} />
      </div>

      <div className="mt-5 flex justify-center">
        <StatusButton
          status={teacher.status}
          disabled={pending}
          onClick={() => onToggleStatus(teacher)}
        />
      </div>
    </div>
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const TeacherNameBlock = ({ teacher, inactive = false }) => {
  return (
    <div>
      <p
        className={`text-[12px] ${
          inactive ? "text-slate-500" : "text-slate-900"
        }`}
      >
        {getTeacherDisplayName(teacher)}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
        <FiHash />
        <span>{teacher.teacherId || "-"}</span>
      </div>
    </div>
  );
};

const TeacherAvatar = ({ teacher, size = "normal", inactive = false }) => {
  const sizeClass =
    size === "hero" ? "h-24 w-24 text-2xl" : "h-10 w-10 text-xs";

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
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-normal ring-4 ${
        inactive
          ? "bg-slate-100 text-slate-400 ring-slate-200"
          : getAvatarStyle(teacher.id)
      }`}
    >
      {getInitials(teacher)}
    </div>
  );
};

const InfoRow = ({ label, icon, value }) => {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-[#94a3b8]">
        {label}
      </p>

      <div className="flex items-center gap-2 text-[11px] text-[#69768b]">
        <span className="shrink-0 text-[#94a3b8]">{icon}</span>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
};

const StatusButton = ({ status, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
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

      {status || "Inactive"}
    </button>
  );
};

const IconButton = ({ type, onClick }) => {
  const styles = {
    view: "bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white",
    delete: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  const icons = {
    view: <FiEye />,
    delete: <FiTrash2 />,
  };

  const labels = {
    view: "View Teacher",
    delete: "Delete Teacher",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={labels[type]}
      aria-label={labels[type]}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition ${styles[type]}`}
    >
      {icons[type]}
    </button>
  );
};

export default Teachers;
