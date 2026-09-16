import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiHash,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { toast } from "react-toastify";

import api from "../../services/api";

import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { Skeleton } from "../../components/skeleton";

/* =========================================================
   CONFIG
========================================================= */

const USE_DUMMY_DATA = true;

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   DUMMY HISTORY
========================================================= */

const buildDummyHistory = (studentId, fallbackStudent) => ({
  student: fallbackStudent || {
    studentId,

    firstName: "Juan",

    middleName: "",

    lastName: "Dela Cruz",

    gradeLevel: "Grade 7",

    section: "A",
  },

  records: [
    {
      id: 1,
      date: "2026-09-16",
      timeIn: "07:42 AM",
      status: "Present",
    },
    {
      id: 2,
      date: "2026-09-15",
      timeIn: "-",
      status: "Absent",
    },
    {
      id: 3,
      date: "2026-09-14",
      timeIn: "07:39 AM",
      status: "Present",
    },
    {
      id: 4,
      date: "2026-09-13",
      timeIn: "07:45 AM",
      status: "Present",
    },
    {
      id: 5,
      date: "2026-09-12",
      timeIn: "07:50 AM",
      status: "Present",
    },
    {
      id: 6,
      date: "2026-09-11",
      timeIn: "-",
      status: "Absent",
    },
    {
      id: 7,
      date: "2026-09-10",
      timeIn: "07:41 AM",
      status: "Present",
    },
  ],
});

/* =========================================================
   MAIN
========================================================= */

const StudentAttendanceHistory = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { studentId } = useParams();

  const decodedStudentId = decodeURIComponent(studentId || "");

  const studentFromState = location.state?.student || null;

  const backTo = location.state?.backTo || "/attendance";

  const [student, setStudent] = useState(studentFromState);

  const [records, setRecords] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  /* TABLE STATE */

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [viewMode, setViewMode] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* =======================================================
     LOAD HISTORY
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        if (USE_DUMMY_DATA) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));

          const data = buildDummyHistory(decodedStudentId, studentFromState);

          if (!cancelled) {
            setStudent(data.student);

            setRecords(data.records);
          }

          return;
        }

        const response = await api.get(
          `/api/attendance/students/${encodeURIComponent(
            decodedStudentId,
          )}/history`,
        );

        if (!cancelled) {
          setStudent(response.data?.student || studentFromState);

          setRecords(response.data?.records || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load student attendance history:", error);

          setRecords([]);

          toast.error(
            error.response?.data?.message ||
              "Unable to load student attendance history.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [decodedStudentId, studentFromState]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const presentCount = useMemo(
    () => records.filter((record) => record.status === "Present").length,
    [records],
  );

  const absentCount = useMemo(
    () => records.filter((record) => record.status === "Absent").length,
    [records],
  );

  const attendanceRate = useMemo(() => {
    if (records.length === 0) {
      return 0;
    }

    return Math.round((presentCount / records.length) * 100);
  }, [records.length, presentCount]);

  const summaryItems = [
    {
      key: "attendance-rate",

      label: "Attendance Rate",

      value: `${attendanceRate}%`,
    },

    {
      key: "present",

      label: "Present",

      value: presentCount,
    },

    {
      key: "absent",

      label: "Absent",

      value: absentCount,
    },
  ];

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => {
        const formattedDate = formatDate(record.date).toLowerCase();

        const rawDate = String(record.date || "").toLowerCase();

        const timeIn = String(record.timeIn || "").toLowerCase();

        const status = String(record.status || "").toLowerCase();

        const matchesSearch =
          !query ||
          formattedDate.includes(query) ||
          rawDate.includes(query) ||
          timeIn.includes(query) ||
          status.includes(query);

        const matchesStatus =
          statusFilter === "All" || record.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        return new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`);
      });
  }, [records, searchTerm, statusFilter]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / rowsPerPage),
  );

  const startIndex = (currentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const showingStart = filteredRecords.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, filteredRecords.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =======================================================
     RESET
  ======================================================= */

  const handleResetFilter = () => {
    setSearchTerm("");

    setStatusFilter("All");

    setCurrentPage(1);
  };

  /* =======================================================
     STUDENT NAME
  ======================================================= */

  const fullName = student
    ? [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
    : "Student";

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExport = () => {
    if (isLoading) {
      return;
    }

    if (filteredRecords.length === 0) {
      toast.warning("No attendance records available to export.");
      return;
    }

    const header = [
      "Date",
      "Student ID",
      "Student Name",
      "Section",
      "Time In",
      "Status",
    ];

    const rows = filteredRecords.map((record) =>
      [
        record.date,
        student?.studentId || decodedStudentId,
        fullName,
        `${student?.gradeLevel || "-"}${
          student?.section ? ` - ${student.section}` : ""
        }`,
        record.timeIn,
        record.status,
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

    link.download = `${student?.studentId || decodedStudentId}-attendance.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Attendance history exported successfully.");
  };

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const columns = [
    {
      key: "date",

      label: "Date",

      render: (record) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiCalendar className="text-[#94a3b8]" />

          {formatDate(record.date)}
        </div>
      ),
    },

    {
      key: "timeIn",

      label: "Time In",

      render: (record) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiClock className="text-[#94a3b8]" />

          {record.timeIn || "-"}
        </div>
      ),
    },

    {
      key: "status",

      label: "Status",

      render: (record) => <StatusBadge status={record.status} />,
    },
  ];

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        {isLoading ? (
          <>
            <div>
              <Skeleton className="mb-4 h-3 w-36" />

              <Skeleton className="h-7 w-48" />

              <Skeleton className="mt-2 h-4 w-60" />
            </div>

            <Skeleton className="h-10 w-24 rounded-md" />
          </>
        ) : (
          <>
            <div>
              <button
                type="button"
                onClick={() => navigate(backTo)}
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  text-[12px]
                  text-[#94a3b8]
                  transition
                  hover:text-[#01B8E5]
                "
              >
                <FiArrowLeft />
                Back to Attendance
              </button>

              <h1 className="text-[22px] font-medium text-slate-900">
                Attendance History
              </h1>

              <p className="mt-1 text-[13px] text-[#94a3b8]">
                View the student's attendance records.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="
                inline-flex
                h-10
                w-fit
                items-center
                justify-center
                gap-2
                rounded-md
                border
                border-slate-200
                bg-white
                px-4
                text-[12px]
                text-[#69768b]
                transition
                hover:border-[#01B8E5]/40
                hover:text-[#01B8E5]
              "
            >
              <FiDownload />
              Export
            </button>
          </>
        )}
      </div>

      {/* ===================================================
          STUDENT
      =================================================== */}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-44" />

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                <Skeleton className="h-3 w-32" />

                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#01B8E5]/10 text-[#01B8E5]">
              <FiUser size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[16px] font-medium text-slate-900">
                {fullName}
              </h2>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#69768b]">
                <span className="inline-flex items-center gap-1.5">
                  <FiHash className="text-[#94a3b8]" />

                  {student?.studentId || decodedStudentId}
                </span>

                <span>
                  {student?.gradeLevel || "-"}{" "}
                  {student?.section ? `- ${student.section}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          SUMMARY

          loading=true
          -> SummaryCards automatically renders
             SummarySkeleton
      =================================================== */}

      <SummaryCards columns={3} loading={isLoading} items={summaryItems} />

      {/* ===================================================
          DATA TABLE

          table mode + loading
          -> TableSkeleton

          cards mode + loading
          -> CardSkeleton
      =================================================== */}

      <DataTable
        title="Attendance Records"
        subtitle="View the student's daily attendance history."
        columns={columns}
        rows={paginatedRecords}
        rowKey={(record) => record.id || `${record.date}-${record.status}`}
        /* SHARED SKELETON LOADING */
        loading={isLoading}
        search={{
          value: searchTerm,

          onChange: setSearchTerm,

          placeholder: "Search date, time or status...",
        }}
        statusFilter={{
          value: statusFilter,

          onChange: setStatusFilter,

          options: [
            {
              label: "All Status",

              value: "All",
            },

            {
              label: "Present",

              value: "Present",
            },

            {
              label: "Absent",

              value: "Absent",
            },
          ],
        }}
        onReset={handleResetFilter}
        view={{
          mode: viewMode,
          onChange: setViewMode,
        }}
        renderCard={(record) => <HistoryCard record={record} />}
        pagination={{
          currentPage,
          totalPages,

          rowsPerPage,

          totalRows: filteredRecords.length,

          showingStart,
          showingEnd,

          onRowsPerPageChange: setRowsPerPage,

          onPageChange: setCurrentPage,
        }}
        emptyTitle="No attendance history found"
        emptyDescription="No attendance records match your current filters."
      />
    </div>
  );
};

/* =========================================================
   HISTORY CARD
========================================================= */

const HistoryCard = ({ record }) => {
  return (
    <div
      className="
        group
        overflow-hidden
        rounded-lg
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[#01B8E5]/30
        hover:shadow-md
      "
    >
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoBox
            icon={<FiCalendar />}
            label="Date"
            value={formatDate(record.date)}
          />

          <InfoBox
            icon={<FiClock />}
            label="Time In"
            value={record.timeIn || "-"}
          />
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              Status
            </span>

            <StatusBadge status={record.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const present = status === "Present";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-md
        px-2.5
        py-1.5
        text-[10px]
        ${
          present
            ? "bg-[#01B8E5]/10 text-[#019BC2]"
            : "bg-slate-100 text-[#69768b]"
        }
      `}
    >
      {present ? <FiCheckCircle /> : <FiXCircle />}

      {status}
    </span>
  );
};

/* =========================================================
   INFO BOX
========================================================= */

const InfoBox = ({ label, icon, value }) => {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
        {icon}

        <span>{label}</span>
      </div>

      <p className="mt-2 truncate text-[11px] text-[#69768b]">{value}</p>
    </div>
  );
};

export default StudentAttendanceHistory;
