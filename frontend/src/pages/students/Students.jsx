import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  FiBookOpen,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

import Swal from "sweetalert2";

import { toast } from "react-toastify";

import ImportStudentModal from "../../components/modals/students/ImportStudentModal";

import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { Skeleton } from "../../components/skeleton";

import api from "../../services/api";

import { apiDebugRequest } from "../../utils/api/apiDebugger";

/* =========================================================
   OPTIONS
========================================================= */

const studentStatusOptions = ["Enrolled", "Unenrolled", "Inactive"];

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

const getStudentDisplayName = (student) => {
  return `${student.lastName}, ${student.firstName}`;
};

const getInitials = (student) => {
  const firstInitial = student.firstName?.[0] || "";

  const lastInitial = student.lastName?.[0] || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const getAvatarStyle = (studentId) => {
  return avatarStyles[studentId % avatarStyles.length];
};

const getNextStatus = (currentStatus) => {
  if (currentStatus === "Enrolled") {
    return "Unenrolled";
  }

  if (currentStatus === "Unenrolled") {
    return "Inactive";
  }

  return "Enrolled";
};

const getStatusRank = (status) => {
  if (status === "Enrolled") {
    return 1;
  }

  if (status === "Unenrolled") {
    return 2;
  }

  return 3;
};

const formatFileSize = (file) => {
  const sizeInMb = file.size / 1024 / 1024;

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(file.size / 1024))} KB`;
};

const isExcelFile = (file) => {
  const validExtensions = [".xlsx", ".xls"];

  return validExtensions.some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   PAGE
========================================================= */

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [viewMode, setViewMode] = useState("table");

  const [movingStudentId, setMovingStudentId] = useState(null);

  const [poppedStudentId, setPoppedStudentId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [importFiles, setImportFiles] = useState([]);

  const [isImporting, setIsImporting] = useState(false);

  const [importProgress, setImportProgress] = useState(0);

  /* =======================================================
     LOAD STUDENTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    api
      .get("/api/students")
      .then((response) => {
        if (cancelled) {
          return;
        }

        setStudents(response.data.students || []);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Unable to load students:", error);

        toast.error(
          error.response?.data?.message || "Unable to load students.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        getStudentDisplayName(student).toLowerCase().includes(searchValue) ||
        String(student.studentId || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.rfid || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.gradeLevel || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.section || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.guardianName || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.guardianContact || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  /* =======================================================
     SORT
  ======================================================= */

  const displayedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const statusSort = getStatusRank(a.status) - getStatusRank(b.status);

      if (statusSort !== 0) {
        return statusSort;
      }

      return getStudentDisplayName(a).localeCompare(getStudentDisplayName(b));
    });
  }, [filteredStudents]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(displayedStudents.length / rowsPerPage),
  );

  const startIndex = (currentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedStudents = displayedStudents.slice(startIndex, endIndex);

  const showingStart = displayedStudents.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, displayedStudents.length);

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

  const enrolledStudents = students.filter(
    (student) => student.status === "Enrolled",
  ).length;

  const unenrolledStudents = students.filter(
    (student) => student.status === "Unenrolled",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  const summaryItems = [
    {
      key: "total",
      label: "Total Students",
      value: students.length,
    },
    {
      key: "enrolled",
      label: "Enrolled",
      value: enrolledStudents,
    },
    {
      key: "unenrolled",
      label: "Unenrolled",
      value: unenrolledStudents,
    },
    {
      key: "inactive",
      label: "Inactive",
      value: inactiveStudents,
    },
  ];

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  /* =======================================================
     SELECTION
  ======================================================= */

  const allDisplayedSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((student) =>
      selectedStudentIds.includes(student.id),
    );

  const handleToggleSelect = (studentId) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }

      return [...current, studentId];
    });
  };

  const handleSelectAllDisplayed = () => {
    if (allDisplayedSelected) {
      const displayedIds = paginatedStudents.map((student) => student.id);

      setSelectedStudentIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedStudentIds((current) => {
      const nextIds = [...current];

      paginatedStudents.forEach((student) => {
        if (!nextIds.includes(student.id)) {
          nextIds.push(student.id);
        }
      });

      return nextIds;
    });
  };

  /* =======================================================
     IMPORT
  ======================================================= */

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    if (isImporting) {
      return;
    }

    setIsImportModalOpen(false);

    setImportFiles([]);

    setImportProgress(0);
  };

  const handleChooseImportFiles = (fileList) => {
    const selectedFiles = Array.from(fileList || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (isExcelFile(file)) {
        validFiles.push({
          tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,

          file,

          name: file.name,

          size: formatFileSize(file),

          type: file.type || "Excel File",
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error("Only .xlsx and .xls files are allowed.");
    }

    if (validFiles.length === 0) {
      return;
    }

    setImportFiles((current) => {
      const existingKeys = new Set(
        current.map((item) => `${item.name}-${item.file.size}`),
      );

      const newFiles = validFiles.filter(
        (item) => !existingKeys.has(`${item.name}-${item.file.size}`),
      );

      return [...current, ...newFiles];
    });
  };

  const handleRemoveImportFile = (tempId) => {
    setImportFiles((current) =>
      current.filter((item) => item.tempId !== tempId),
    );
  };

  const handleImportStudents = async () => {
    if (importFiles.length === 0) {
      toast.error("Please select at least one Excel file.");

      return;
    }

    setIsImporting(true);

    setImportProgress(10);

    const progressTimer = window.setInterval(() => {
      setImportProgress((current) => {
        if (current >= 90) {
          return current;
        }

        return current + 10;
      });
    }, 250);

    await apiDebugRequest({
      module: "student",

      action: "import-excel",

      method: "POST",

      payload: {
        files: importFiles.map((item) => ({
          file: item.file,

          fileName: item.name,

          fileSize: item.size,

          fileType: item.type,
        })),

        totalFiles: importFiles.length,

        uploadedAt: new Date().toISOString(),
      },
    });

    window.clearInterval(progressTimer);

    setImportProgress(100);

    window.setTimeout(() => {
      setIsImporting(false);

      setIsImportModalOpen(false);

      setImportFiles([]);

      setImportProgress(0);

      toast.success("Student Excel import request sent.");
    }, 500);
  };

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExportStudents = async () => {
    const rows = students.map((student) => ({
      studentId: student.studentId,

      rfid: student.rfid,

      name: getStudentDisplayName(student),

      gradeLevel: student.gradeLevel,

      section: student.section,

      className: `${student.gradeLevel} - ${student.section}`,

      birthDate: student.birthDate,

      guardianName: student.guardianName,

      guardianContact: student.guardianContact,

      address: student.address,

      status: student.status,
    }));

    await apiDebugRequest({
      module: "student",

      action: "export",

      method: "POST",

      payload: {
        totalRows: rows.length,

        rows,

        exportedAt: new Date().toISOString(),
      },
    });

    const header = [
      "Student ID",
      "RFID",
      "Name",
      "Grade Level",
      "Section",
      "Class",
      "Birth Date",
      "Guardian Name",
      "Guardian Contact",
      "Address",
      "Status",
    ];

    const csvRows = rows.map((row) =>
      [
        row.studentId,
        row.rfid,
        row.name,
        row.gradeLevel,
        row.section,
        row.className,
        row.birthDate,
        row.guardianName,
        row.guardianContact,
        row.address,
        row.status,
      ]
        .map(csvValue)
        .join(","),
    );

    const csvContent = [header.map(csvValue).join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "students-export.csv";

    link.click();

    URL.revokeObjectURL(url);

    toast.success("Students exported successfully.");
  };

  /* =======================================================
     VIEW
  ======================================================= */

  const handleViewStudent = async (student) => {
    await apiDebugRequest({
      module: "student",

      action: "view-details-page",

      method: "GET",

      payload: {
        id: student.id,

        studentId: student.studentId,
      },
    });

    navigate(`/students/${student.studentId}`);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student.");

      return;
    }

    const selectedStudents = students.filter((student) =>
      selectedStudentIds.includes(student.id),
    );

    const result = await Swal.fire({
      title: "Delete selected students?",

      text: `${selectedStudents.length} student record(s) will be removed.`,

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Yes, delete",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) {
      return;
    }

    await apiDebugRequest({
      module: "student",

      action: "bulk-delete",

      method: "DELETE",

      payload: {
        ids: selectedStudentIds,

        students: selectedStudents.map((student) => ({
          id: student.id,

          studentId: student.studentId,

          displayName: getStudentDisplayName(student),
        })),
      },
    });

    setStudents((current) =>
      current.filter((student) => !selectedStudentIds.includes(student.id)),
    );

    setSelectedStudentIds([]);

    toast.success("Selected students deleted successfully.");
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

    if (!result.isConfirmed) {
      return;
    }

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

    setSelectedStudentIds((current) =>
      current.filter((id) => id !== student.id),
    );

    toast.success("Student deleted successfully.");
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const handleToggleStudentStatus = async (student) => {
    if (movingStudentId) {
      return;
    }

    const nextStatus = getNextStatus(student.status);

    await apiDebugRequest({
      module: "student",

      action: "change-status",

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

    toast.success(`Student status changed to ${nextStatus}.`);
  };

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const studentColumns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allDisplayedSelected}
          onChange={handleSelectAllDisplayed}
          aria-label="Select all students on this page"
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />
      ),
      render: (student) => (
        <input
          type="checkbox"
          checked={selectedStudentIds.includes(student.id)}
          onChange={() => handleToggleSelect(student.id)}
          aria-label={`Select ${getStudentDisplayName(student)}`}
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />
      ),
    },
    {
      key: "studentId",
      label: "Student Number",
      render: (student) => (
        <span className="whitespace-nowrap font-mono text-[12px] font-medium text-[#69768b]">
          {student.studentId || "-"}
        </span>
      ),
    },
    {
      key: "student",
      label: "Student Name",
      render: (student) => {
        const isInactive = student.status === "Inactive";
        const isMoving = movingStudentId === student.id;
        const isPopped = poppedStudentId === student.id;

        return (
          <div
            className={`flex items-center gap-3 ${
              isInactive ? "opacity-75" : ""
            } ${isMoving ? "student-pop-out" : ""} ${
              isPopped ? "student-pop-in" : ""
            }`}
          >
            <StudentAvatar student={student} inactive={isInactive} />

            <StudentNameBlock student={student} inactive={isInactive} />
          </div>
        );
      },
    },
    {
      key: "rfid",
      label: "RFID",
      render: (student) => <RfidInfo rfid={student.rfid} />,
    },
    {
      key: "class",
      label: "Class",
      render: (student) => <ClassInfo student={student} />,
    },
    {
      key: "status",
      label: "Status",
      render: (student) => (
        <StatusButton
          status={student.status}
          disabled={Boolean(movingStudentId)}
          onClick={() => handleToggleStudentStatus(student)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (student) => (
        <div className="flex justify-end gap-2">
          <IconButton type="view" onClick={() => handleViewStudent(student)} />

          <IconButton
            type="delete"
            onClick={() => handleDeleteStudent(student)}
          />
        </div>
      ),
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      data-aos="fade-up"
      className="space-y-5 [font-family:'Poppins',sans-serif]"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-36" />

            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-medium text-slate-950">Students</h1>

            <div className="flex flex-wrap gap-2">
              {selectedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-normal text-white transition hover:bg-red-600"
                >
                  <FiTrash2 />
                  Delete Selected ({selectedStudentIds.length})
                </button>
              )}

              <button
                type="button"
                onClick={handleExportStudents}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
              >
                <FiDownload />
                Export
              </button>

              <button
                type="button"
                onClick={openImportModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-normal text-white transition hover:bg-cyan-700"
              >
                <FiUploadCloud />
                Import Student
              </button>
            </div>
          </>
        )}
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <SummaryCards columns={4} loading={isLoading} items={summaryItems} />

      {/* =================================================
          STUDENT LIST
      ================================================= */}

      <DataTable
        title="Student List"
        subtitle="Manage student numbers, RFID assignments, classes, and enrollment status."
        columns={studentColumns}
        rows={paginatedStudents}
        rowKey="id"
        loading={isLoading}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search student, ID, RFID...",
        }}
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            {
              label: "All Status",
              value: "All",
            },
            ...studentStatusOptions.map((status) => ({
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
        renderCard={(student) => (
          <StudentCard
            student={student}
            selected={selectedStudentIds.includes(student.id)}
            moving={movingStudentId === student.id}
            popped={poppedStudentId === student.id}
            disabled={Boolean(movingStudentId)}
            onSelect={handleToggleSelect}
            onView={handleViewStudent}
            onDelete={handleDeleteStudent}
            onToggleStatus={handleToggleStudentStatus}
          />
        )}
        pagination={{
          currentPage,
          totalPages,
          rowsPerPage,
          totalRows: displayedStudents.length,
          showingStart,
          showingEnd,
          onRowsPerPageChange: setRowsPerPage,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No students found"
        emptyDescription="Try changing your filters or import student records."
      />

      {/* =================================================
          IMPORT MODAL
      ================================================= */}

      <ImportStudentModal
        isOpen={isImportModalOpen}
        importFiles={importFiles}
        isImporting={isImporting}
        importProgress={importProgress}
        onClose={closeImportModal}
        onChooseFiles={handleChooseImportFiles}
        onRemoveImportFile={handleRemoveImportFile}
        onImport={handleImportStudents}
      />

      {/* =================================================
          STATUS ANIMATION
      ================================================= */}

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

/* =========================================================
   STUDENT NAME
========================================================= */

const StudentNameBlock = ({ student, inactive = false }) => {
  return (
    <p
      className={`whitespace-nowrap text-sm font-normal ${
        inactive ? "text-slate-500" : "text-slate-900"
      }`}
    >
      {getStudentDisplayName(student)}
    </p>
  );
};

/* =========================================================
   RFID
========================================================= */

const RfidInfo = ({ rfid }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiCreditCard className="shrink-0 text-slate-400" />

      <span>{rfid || "-"}</span>
    </div>
  );
};

/* =========================================================
   CLASS
========================================================= */

const ClassInfo = ({ student }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiBookOpen className="shrink-0 text-slate-400" />

      <span>
        {student.gradeLevel} - {student.section}
      </span>
    </div>
  );
};

/* =========================================================
   STUDENT CARD
========================================================= */

const StudentCard = ({
  student,
  selected,
  moving,
  popped,
  disabled,
  onSelect,
  onView,
  onDelete,
  onToggleStatus,
}) => {
  const isInactive = student.status === "Inactive";

  return (
    <div
      className={`relative overflow-hidden rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-cyan-300 ring-4 ring-cyan-50" : "border-slate-200"
      } ${isInactive ? "bg-slate-50 opacity-75" : "bg-white"} ${
        moving ? "student-pop-out" : ""
      } ${popped ? "student-pop-in" : ""}`}
    >
      <div className="flex items-center justify-between">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(student.id)}
          aria-label={`Select ${getStudentDisplayName(student)}`}
          className="h-4 w-4 cursor-pointer accent-cyan-600"
        />

        <div className="flex gap-2">
          <IconButton type="view" onClick={() => onView(student)} />

          <IconButton type="delete" onClick={() => onDelete(student)} />
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <StudentAvatar student={student} size="hero" inactive={isInactive} />

        <div className="mt-5 text-center">
          <StudentNameBlock student={student} inactive={isInactive} />
        </div>

        <p className="mt-1 font-mono text-[11px] text-[#94a3b8]">
          {student.studentId || "-"}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-left">
        <div>
          <p className="mb-1 text-xs font-normal uppercase tracking-wide text-slate-400">
            RFID
          </p>

          <RfidInfo rfid={student.rfid} />
        </div>

        <div>
          <p className="mb-1 text-xs font-normal uppercase tracking-wide text-slate-400">
            Class
          </p>

          <ClassInfo student={student} />
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <StatusToggle
          status={student.status}
          disabled={disabled}
          onClick={() => onToggleStatus(student)}
        />
      </div>
    </div>
  );
};

/* =========================================================
   AVATAR
========================================================= */

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
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-normal ring-4 ${
        inactive
          ? "bg-slate-100 text-slate-400 ring-slate-200"
          : getAvatarStyle(student.id)
      }`}
    >
      {getInitials(student)}
    </div>
  );
};

/* =========================================================
   GRID STATUS SWITCH
========================================================= */

const StatusToggle = ({ status, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Click to change status"
      className={`flex h-8 w-20 cursor-pointer items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        status === "Enrolled"
          ? "bg-emerald-500"
          : status === "Unenrolled"
            ? "bg-orange-400"
            : "bg-slate-300"
      }`}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition ${
          status === "Enrolled"
            ? "translate-x-12"
            : status === "Unenrolled"
              ? "translate-x-6"
              : "translate-x-0"
        }`}
      />
    </button>
  );
};

/* =========================================================
   TABLE STATUS
========================================================= */

const StatusButton = ({ status, disabled = false, onClick }) => {
  const statusClass =
    status === "Enrolled"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : status === "Unenrolled"
        ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200";

  const dotClass =
    status === "Enrolled"
      ? "bg-emerald-500"
      : status === "Unenrolled"
        ? "bg-orange-500"
        : "bg-slate-400";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Click to change status"
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal transition disabled:cursor-not-allowed disabled:opacity-60 ${statusClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />

      {status}
    </button>
  );
};

/* =========================================================
   ACTION BUTTON
========================================================= */

const IconButton = ({ type, onClick }) => {
  const buttonStyles = {
    view: "bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white",

    delete: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  const icons = {
    view: <FiEye />,

    delete: <FiTrash2 />,
  };

  const labels = {
    view: "View Student",

    delete: "Delete Student",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={labels[type]}
      aria-label={labels[type]}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${buttonStyles[type]}`}
    >
      {icons[type]}
    </button>
  );
};

export default Students;
