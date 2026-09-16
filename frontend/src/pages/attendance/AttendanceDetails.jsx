import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import { Skeleton } from "../../components/skeleton";

import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiDownload,
  FiEye,
  FiHash,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

import { toast } from "react-toastify";
import Swal from "sweetalert2";

import api from "../../services/api";

import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { ViewButton } from "../../components/actions";

import "react-datepicker/dist/react-datepicker.css";

/* =========================================================
   CONFIG
========================================================= */

const USE_DUMMY_DATA = true;

/* =========================================================
   HELPERS
========================================================= */

const formatLocalDate = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getDisplayName = (record) => {
  return `${record.lastName}, ${record.firstName}`;
};

const getFullName = (record) => {
  return [record.firstName, record.middleName, record.lastName]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (record) => {
  return `${record.firstName?.[0] || ""}${
    record.lastName?.[0] || ""
  }`.toUpperCase();
};

const getManilaTime = () => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   AVATAR COLORS
========================================================= */

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (id) => {
  const numericId = Number(id) || 0;

  return avatarStyles[numericId % avatarStyles.length];
};

/* =========================================================
   DUMMY DATA
========================================================= */

const getDummyStudents = (date) => [
  {
    id: 1,
    enrollmentId: 101,
    attendanceId: 1001,
    studentId: "STD-2026-001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    date,
    timeIn: "07:42 AM",
    status: "Present",
  },
  {
    id: 2,
    enrollmentId: 102,
    attendanceId: 1002,
    studentId: "STD-2026-002",
    firstName: "Angela",
    middleName: "",
    lastName: "Reyes",
    gradeLevel: "Grade 7",
    section: "A",
    date,
    timeIn: "07:48 AM",
    status: "Present",
  },
  {
    id: 3,
    enrollmentId: 103,
    attendanceId: 1003,
    studentId: "STD-2026-003",
    firstName: "Miguel",
    middleName: "",
    lastName: "Garcia",
    gradeLevel: "Grade 7",
    section: "A",
    date,
    timeIn: "-",
    status: "Absent",
  },
  {
    id: 4,
    enrollmentId: 104,
    attendanceId: 1004,
    studentId: "STD-2026-004",
    firstName: "Nicole",
    middleName: "",
    lastName: "Mendoza",
    gradeLevel: "Grade 7",
    section: "A",
    date,
    timeIn: "07:39 AM",
    status: "Present",
  },
  {
    id: 5,
    enrollmentId: 105,
    attendanceId: 1005,
    studentId: "STD-2026-005",
    firstName: "Joshua",
    middleName: "",
    lastName: "Ramos",
    gradeLevel: "Grade 8",
    section: "B",
    date,
    timeIn: "07:51 AM",
    status: "Present",
  },
  {
    id: 6,
    enrollmentId: 106,
    attendanceId: 1006,
    studentId: "STD-2026-006",
    firstName: "Sophia",
    middleName: "",
    lastName: "Flores",
    gradeLevel: "Grade 8",
    section: "B",
    date,
    timeIn: "07:55 AM",
    status: "Present",
  },
  {
    id: 7,
    enrollmentId: 107,
    attendanceId: 1007,
    studentId: "STD-2026-007",
    firstName: "Carlo",
    middleName: "",
    lastName: "Villanueva",
    gradeLevel: "Grade 8",
    section: "B",
    date,
    timeIn: "-",
    status: "Absent",
  },
  {
    id: 8,
    enrollmentId: 108,
    attendanceId: 1008,
    studentId: "STD-2026-008",
    firstName: "Patricia",
    middleName: "",
    lastName: "Navarro",
    gradeLevel: "Grade 9",
    section: "C",
    date,
    timeIn: "07:35 AM",
    status: "Present",
  },
  {
    id: 9,
    enrollmentId: 109,
    attendanceId: 1009,
    studentId: "STD-2026-009",
    firstName: "Gabriel",
    middleName: "",
    lastName: "Torres",
    gradeLevel: "Grade 9",
    section: "C",
    date,
    timeIn: "07:44 AM",
    status: "Present",
  },
  {
    id: 10,
    enrollmentId: 110,
    attendanceId: 1010,
    studentId: "STD-2026-010",
    firstName: "Andrea",
    middleName: "",
    lastName: "Castillo",
    gradeLevel: "Grade 9",
    section: "C",
    date,
    timeIn: "07:58 AM",
    status: "Present",
  },
  {
    id: 11,
    enrollmentId: 111,
    attendanceId: 1011,
    studentId: "STD-2026-011",
    firstName: "Nathan",
    middleName: "",
    lastName: "Aquino",
    gradeLevel: "Grade 10",
    section: "D",
    date,
    timeIn: "10:41 AM",
    status: "Present",
  },
  {
    id: 12,
    enrollmentId: 112,
    attendanceId: 1012,
    studentId: "STD-2026-012",
    firstName: "Beatrice",
    middleName: "",
    lastName: "Lim",
    gradeLevel: "Grade 10",
    section: "D",
    date,
    timeIn: "-",
    status: "Absent",
  },
];

/* =========================================================
   MAIN
========================================================= */

const AttendanceDetails = () => {
  const navigate = useNavigate();
  const { gradeLevel, section } = useParams();

  const decodedGradeLevel = decodeURIComponent(gradeLevel || "");
  const decodedSection = decodeURIComponent(section || "");

  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [viewMode, setViewMode] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(true);

  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  /* =======================================================
     LOAD ATTENDANCE
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      setIsLoading(true);

      const selectedDateText = formatLocalDate(selectedDate);

      try {
        let loadedRecords = [];

        if (USE_DUMMY_DATA) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 500);
          });

          loadedRecords = getDummyStudents(selectedDateText);
        } else {
          const response = await api.get("/api/attendance", {
            params: {
              date: selectedDateText,
            },
          });

          loadedRecords = response.data?.records || [];
        }

        if (cancelled) return;

        setRecords(
          loadedRecords.filter(
            (record) =>
              record.gradeLevel === decodedGradeLevel &&
              record.section === decodedSection,
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load attendance:", error);

          setRecords([]);

          toast.error(
            error.response?.data?.message ||
              "Unable to load attendance records.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [decodedGradeLevel, decodedSection, selectedDate]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => {
        const fullName = getFullName(record).toLowerCase();
        const displayName = getDisplayName(record).toLowerCase();

        const matchesSearch =
          !query ||
          fullName.includes(query) ||
          displayName.includes(query) ||
          String(record.studentId).toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" || record.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        return getDisplayName(a).localeCompare(getDisplayName(b));
      });
  }, [records, searchTerm, statusFilter]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const presentCount = records.filter(
    (record) => record.status === "Present",
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "Absent",
  ).length;

  const summaryItems = [
    {
      key: "students",
      label: "Students",
      value: records.length,
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
  }, [searchTerm, statusFilter, selectedDate, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =======================================================
     UPDATE ATTENDANCE
  ======================================================= */

  const updateAttendanceStatus = async (record, nextStatus) => {
    const selectedDateText = formatLocalDate(selectedDate);

    if (record.status === nextStatus) {
      toast.info(
        `${getFullName(record)} is already marked ${nextStatus.toLowerCase()}.`,
      );

      return;
    }

    const result = await Swal.fire({
      title: `Mark as ${nextStatus}?`,

      text: `Are you sure you want to mark ${getFullName(
        record,
      )} as ${nextStatus.toLowerCase()} for ${formatDate(selectedDateText)}?`,

      icon: "question",

      showCancelButton: true,

      confirmButtonText: `Yes, mark ${nextStatus}`,

      cancelButtonText: "Cancel",

      confirmButtonColor: nextStatus === "Present" ? "#01B8E5" : "#69768b",

      cancelButtonColor: "#cbd5e1",

      reverseButtons: true,

      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setUpdatingStudentId(record.studentId);

      let attendanceId = record.attendanceId || record.id || Date.now();

      if (!USE_DUMMY_DATA) {
        const response = await api.post("/api/attendance/records/status", {
          enrollment_id: record.enrollmentId,
          date: selectedDateText,
          status: nextStatus.toLowerCase(),
          reason: "Updated from attendance management.",
        });

        attendanceId = response.data?.record?.id || attendanceId;
      } else {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 250);
        });
      }

      setRecords((current) =>
        current.map((item) => {
          if (item.studentId !== record.studentId) {
            return item;
          }

          return {
            ...item,

            attendanceId,

            date: selectedDateText,

            status: nextStatus,

            timeIn:
              nextStatus === "Present"
                ? item.timeIn && item.timeIn !== "-"
                  ? item.timeIn
                  : getManilaTime()
                : "-",
          };
        }),
      );

      toast.success(
        `${getFullName(
          record,
        )} marked ${nextStatus.toLowerCase()} successfully.`,
      );
    } catch (error) {
      console.error("Unable to update attendance:", error);

      toast.error(
        error.response?.data?.message || "Unable to update attendance.",
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  /* =======================================================
     VIEW HISTORY
  ======================================================= */

  const handleViewStudent = (record) => {
    navigate(`/attendance/student/${encodeURIComponent(record.studentId)}`, {
      state: {
        student: record,

        backTo: `/attendance/section/${encodeURIComponent(
          decodedGradeLevel,
        )}/${encodeURIComponent(decodedSection)}`,
      },
    });
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setSelectedDate(new Date());
    setCurrentPage(1);
  };

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
        record.studentId,
        getDisplayName(record),
        `${decodedGradeLevel} - ${decodedSection}`,
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

    link.download = `${decodedGradeLevel}-${decodedSection}-attendance.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Attendance exported successfully.");
  };

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const attendanceColumns = [
    {
      key: "studentId",
      label: "Student Number",

      render: (record) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiHash className="text-[#94a3b8]" />

          {record.studentId}
        </div>
      ),
    },

    {
      key: "student",
      label: "Student",

      render: (record) => (
        <div className="flex items-center gap-3">
          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[10px]
              font-medium
              ring-2
              ${getAvatarStyle(record.id)}
            `}
          >
            {getInitials(record)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[12px] text-[#69768b]">
              {getDisplayName(record)}
            </p>

            <p className="mt-0.5 text-[10px] text-[#94a3b8]">
              {record.gradeLevel} - {record.section}
            </p>
          </div>
        </div>
      ),
    },

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

    {
      key: "attendance",
      label: "Attendance",

      render: (record) => (
        <StatusActionButtons
          record={record}
          onUpdateStatus={updateAttendanceStatus}
          disabled={updatingStudentId === record.studentId}
        />
      ),
    },

    {
      key: "action",
      label: "Action",
      align: "right",

      render: (record) => (
        <ViewButton
          variant="table"
          label="View"
          onClick={() => handleViewStudent(record)}
        />
      ),
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
              <Skeleton className="mb-4 h-3 w-28" />

              <Skeleton className="h-7 w-36" />

              <Skeleton className="mt-2 h-4 w-56" />
            </div>

            <Skeleton className="h-10 w-24 rounded-md" />
          </>
        ) : (
          <>
            <div>
              <button
                type="button"
                onClick={() => navigate("/attendance")}
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
                Back to Sections
              </button>

              <h1 className="text-[22px] font-medium text-slate-900">
                {decodedGradeLevel} - {decodedSection}
              </h1>

              <p className="mt-1 text-[13px] text-[#94a3b8]">
                Manage attendance for this section.
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
        title="Attendance"
        subtitle="View and manage student attendance."
        columns={attendanceColumns}
        rows={paginatedRecords}
        rowKey="studentId"
        /* SHARED SKELETON LOADING */
        loading={isLoading}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search student or ID...",
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
        extraFilters={
          <div className="relative w-full xl:w-[220px]">
            <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#94a3b8]" />

            <DatePicker
              selected={selectedDate}
              disabled={isLoading}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              dateFormat="MMM dd, yyyy"
              className="
                h-11
                w-full
                rounded-md
                border
                border-slate-200
                bg-white
                pl-11
                pr-4
                text-[12px]
                text-[#69768b]
                outline-none
                transition
                focus:border-[#01B8E5]
                disabled:cursor-not-allowed
                disabled:bg-slate-50
                disabled:opacity-70
              "
            />
          </div>
        }
        onReset={handleResetFilter}
        view={{
          mode: viewMode,
          onChange: setViewMode,
        }}
        renderCard={(record) => (
          <AttendanceCard
            record={record}
            onView={handleViewStudent}
            onUpdateStatus={updateAttendanceStatus}
            disabled={updatingStudentId === record.studentId}
          />
        )}
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
        emptyTitle="No attendance records found"
        emptyDescription="Try changing your filters."
      />

      <DatePickerStyles />
    </div>
  );
};

/* =========================================================
   ATTENDANCE CARD
========================================================= */

const AttendanceCard = ({ record, onView, onUpdateStatus, disabled }) => {
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
      {/* PROFILE */}

      <div className="absolute right-4 top-4">
        <ViewButton label="View" onClick={() => onView(record)} />
      </div>

      {/* DETAILS */}

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

        <div className="mt-4">
          <StatusActionButtons
            record={record}
            onUpdateStatus={onUpdateStatus}
            disabled={disabled}
            fullWidth
          />
        </div>

        <div className="mt-3">
          <ViewButton
            label="View Attendance History"
            onClick={() => onView(record)}
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   ATTENDANCE BUTTONS
========================================================= */

const StatusActionButtons = ({
  record,
  onUpdateStatus,
  fullWidth = false,
  disabled = false,
}) => {
  return (
    <div className={`flex items-center gap-2 ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onUpdateStatus(record, "Present")}
        className={`
          inline-flex
          h-8
          items-center
          justify-center
          gap-1.5
          rounded-md
          px-3
          text-[10px]
          transition
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${fullWidth ? "flex-1" : ""}
          ${
            record.status === "Present"
              ? "bg-[#01B8E5] text-white"
              : "bg-[#01B8E5]/10 text-[#019BC2] hover:bg-[#01B8E5]/15"
          }
        `}
      >
        <FiUserCheck />
        Present
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onUpdateStatus(record, "Absent")}
        className={`
          inline-flex
          h-8
          items-center
          justify-center
          gap-1.5
          rounded-md
          px-3
          text-[10px]
          transition
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${fullWidth ? "flex-1" : ""}
          ${
            record.status === "Absent"
              ? "bg-[#69768b] text-white"
              : "bg-slate-100 text-[#69768b] hover:bg-slate-200"
          }
        `}
      >
        <FiUserX />
        Absent
      </button>
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
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${present ? "bg-[#01B8E5]" : "bg-slate-400"}
        `}
      />

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

/* =========================================================
   DATE PICKER STYLES
========================================================= */

const DatePickerStyles = () => {
  return (
    <style>
      {`
        .react-datepicker {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          font-family: inherit;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.10);
        }

        .react-datepicker__header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: #69768b;
          font-weight: 500;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #01B8E5 !important;
          color: #ffffff !important;
        }

        .react-datepicker__day--today {
          font-weight: 500;
          color: #01B8E5;
        }

        .react-datepicker__day:hover {
          background-color: rgba(1, 184, 229, 0.08);
        }

        .react-datepicker__navigation-icon::before {
          border-color: #94a3b8;
        }

        .react-datepicker__navigation:hover
          .react-datepicker__navigation-icon::before {
          border-color: #01B8E5;
        }
      `}
    </style>
  );
};

export default AttendanceDetails;
