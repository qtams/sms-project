import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";

import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiGrid,
  FiHash,
  FiList,
  FiSearch,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

import { toast } from "react-toastify";
import api from "../lib/api";

import "react-datepicker/dist/react-datepicker.css";

/* =========================================================
   CONFIG
========================================================= */

const USE_DUMMY_DATA = true;

const rowsPerPageOptions = [5, 10, 25, 50];

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
   MAIN PAGE
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
            window.setTimeout(resolve, 200);
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

    try {
      let attendanceId = record.attendanceId || record.id || Date.now();

      if (!USE_DUMMY_DATA) {
        const response = await api.post("/api/attendance/records/status", {
          enrollment_id: record.enrollmentId,
          date: selectedDateText,
          status: nextStatus.toLowerCase(),
          reason: "Updated from attendance management.",
        });

        attendanceId = response.data?.record?.id || attendanceId;
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

      toast.success(`Student marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update attendance.",
      );
    }
  };

  /* =======================================================
     VIEW STUDENT HISTORY
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

    toast.success("Attendance exported.");
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
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
              font-normal
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

          <p className="mt-1 text-[13px] font-normal text-[#94a3b8]">
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
            font-normal
            text-[#69768b]
            transition
            hover:border-[#01B8E5]/40
            hover:text-[#01B8E5]
          "
        >
          <FiDownload />
          Export
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Students" value={records.length} />

        <SummaryCard label="Present" value={presentCount} />

        <SummaryCard label="Absent" value={absentCount} />
      </div>

      {/* ATTENDANCE */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        {/* FILTERS */}

        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[14px] font-medium text-slate-900">
                Attendance
              </p>

              <p className="mt-1 text-[11px] text-[#94a3b8]">
                View and manage student attendance.
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_auto_auto]">
              {/* SEARCH */}

              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search student or ID..."
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
                    font-normal
                    text-[#69768b]
                    outline-none
                    transition
                    placeholder:text-[#a8b3c2]
                    focus:border-[#01B8E5]
                    focus:ring-4
                    focus:ring-[#01B8E5]/5
                  "
                />
              </div>

              {/* STATUS */}

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="
                  h-11
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-[12px]
                  font-normal
                  text-[#69768b]
                  outline-none
                  transition
                  focus:border-[#01B8E5]
                "
              >
                <option value="All">All Status</option>

                <option value="Present">Present</option>

                <option value="Absent">Absent</option>
              </select>

              {/* DATE */}

              <div className="relative">
                <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#94a3b8]" />

                <DatePicker
                  selected={selectedDate}
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
                    font-normal
                    text-[#69768b]
                    outline-none
                    transition
                    focus:border-[#01B8E5]
                  "
                />
              </div>

              {/* RESET */}

              <button
                type="button"
                onClick={handleResetFilter}
                className="
                  h-11
                  rounded-md
                  bg-slate-100
                  px-4
                  text-[12px]
                  font-normal
                  text-[#69768b]
                  transition
                  hover:bg-slate-200
                "
              >
                Reset
              </button>

              {/* VIEW SWITCH */}

              <div className="flex h-11 rounded-md border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded
                    px-3
                    text-[12px]
                    font-normal
                    transition
                    ${
                      viewMode === "grid"
                        ? "bg-slate-100 text-slate-900"
                        : "text-[#94a3b8] hover:bg-slate-50 hover:text-[#69768b]"
                    }
                  `}
                >
                  <FiGrid />
                  Cards
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded
                    px-3
                    text-[12px]
                    font-normal
                    transition
                    ${
                      viewMode === "table"
                        ? "bg-slate-100 text-slate-900"
                        : "text-[#94a3b8] hover:bg-slate-50 hover:text-[#69768b]"
                    }
                  `}
                >
                  <FiList />
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}

        {isLoading ? (
          <AttendanceLoading />
        ) : viewMode === "grid" ? (
          <AttendanceGrid
            records={paginatedRecords}
            onView={handleViewStudent}
            onUpdateStatus={updateAttendanceStatus}
          />
        ) : (
          <AttendanceTable
            records={paginatedRecords}
            onView={handleViewStudent}
            onUpdateStatus={updateAttendanceStatus}
          />
        )}

        {/* PAGINATION */}

        {!isLoading && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={filteredRecords.length}
            showingStart={showingStart}
            showingEnd={showingEnd}
            onRowsPerPageChange={setRowsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DatePickerStyles />
    </div>
  );
};

/* =========================================================
   GRID VIEW
========================================================= */

const AttendanceGrid = ({ records, onView, onUpdateStatus }) => {
  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {records.map((record) => (
        <div
          key={record.studentId}
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

          <div className="relative border-b border-slate-100 px-5 pb-5 pt-6">
            {/* VIEW BUTTON */}

            <button
              type="button"
              onClick={() => onView(record)}
              title="View Attendance History"
              className="
                absolute
                right-4
                top-4
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-md
                bg-slate-100
                text-[#69768b]
                transition
                duration-200
                hover:bg-[#01B8E5]
                hover:text-white
              "
            >
              <FiEye />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* AVATAR */}

              <div
                className={`
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  text-xl
                  font-medium
                  ring-4
                  ${getAvatarStyle(record.id)}
                `}
              >
                {getInitials(record)}
              </div>

              {/* NAME */}

              <p className="mt-4 text-[14px] font-medium text-slate-800">
                {getFullName(record)}
              </p>

              {/* STUDENT ID */}

              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
                <FiHash />

                <span>{record.studentId}</span>
              </div>

              {/* SECTION */}

              <div className="mt-3 rounded-md bg-slate-50 px-3 py-1.5 text-[10px] text-[#69768b]">
                {record.gradeLevel} - {record.section}
              </div>
            </div>
          </div>

          {/* ATTENDANCE INFORMATION */}

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

            {/* STATUS */}

            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
                  Status
                </span>

                <StatusBadge status={record.status} />
              </div>
            </div>

            {/* PRESENT / ABSENT */}

            <div className="mt-4">
              <StatusActionButtons
                record={record}
                onUpdateStatus={onUpdateStatus}
                fullWidth
              />
            </div>

            {/* VIEW PROFILE / HISTORY */}

            <button
              type="button"
              onClick={() => onView(record)}
              className="
                mt-3
                inline-flex
                h-9
                w-full
                items-center
                justify-center
                gap-2
                rounded-md
                border
                border-slate-200
                bg-white
                text-[11px]
                font-normal
                text-[#69768b]
                transition
                hover:border-[#01B8E5]/30
                hover:bg-[#01B8E5]/5
                hover:text-[#019BC2]
              "
            >
              <FiEye />
              View Attendance History
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   TABLE VIEW
========================================================= */

const AttendanceTable = ({ records, onView, onUpdateStatus }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <TableHeader label="Student Number" />

            <TableHeader label="Student" />

            <TableHeader label="Date" />

            <TableHeader label="Time In" />

            <TableHeader label="Status" />

            <TableHeader label="Attendance" />

            <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {records.length > 0 ? (
            records.map((record) => (
              <tr
                key={record.studentId}
                className="
                  border-b
                  border-slate-100
                  transition
                  duration-200
                  hover:bg-slate-50
                "
              >
                {/* STUDENT NUMBER */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
                    <FiHash className="text-[#94a3b8]" />

                    {record.studentId}
                  </div>
                </td>

                {/* STUDENT PROFILE */}

                <td className="px-5 py-4">
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
                      <p className="truncate text-[12px] font-normal text-[#69768b]">
                        {getDisplayName(record)}
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                        {record.gradeLevel} - {record.section}
                      </p>
                    </div>
                  </div>
                </td>

                {/* DATE */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
                    <FiCalendar className="text-[#94a3b8]" />

                    {formatDate(record.date)}
                  </div>
                </td>

                {/* TIME */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
                    <FiClock className="text-[#94a3b8]" />

                    {record.timeIn || "-"}
                  </div>
                </td>

                {/* STATUS */}

                <td className="px-5 py-4">
                  <StatusBadge status={record.status} />
                </td>

                {/* ATTENDANCE */}

                <td className="px-5 py-4">
                  <StatusActionButtons
                    record={record}
                    onUpdateStatus={onUpdateStatus}
                  />
                </td>

                {/* ACTION */}

                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onView(record)}
                      title="View Attendance History"
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-md
                        bg-slate-100
                        text-[#69768b]
                        transition
                        hover:bg-[#01B8E5]
                        hover:text-white
                      "
                    >
                      <FiEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))
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

/* =========================================================
   STATUS BUTTONS
========================================================= */

const StatusActionButtons = ({ record, onUpdateStatus, fullWidth = false }) => {
  return (
    <div className={`flex items-center gap-2 ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
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
          font-normal
          transition
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
          font-normal
          transition
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
        font-normal
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
   SUMMARY
========================================================= */

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-[12px] font-normal text-[#94a3b8]">{label}</p>

      <p className="mt-2 text-[20px] font-medium text-[#475569]">{value}</p>
    </div>
  );
};

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
      {label}
    </th>
  );
};

/* =========================================================
   PAGINATION
========================================================= */

const PaginationFooter = ({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  showingStart,
  showingEnd,
  onRowsPerPageChange,
  onPageChange,
}) => {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#94a3b8]">Show</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            className="
              h-8
              rounded-md
              border
              border-slate-200
              bg-white
              px-2
              text-[11px]
              text-[#69768b]
              outline-none
              focus:border-[#01B8E5]
            "
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-[#94a3b8]">entries</span>
        </div>

        <p className="text-[11px] text-[#94a3b8]">
          Showing {showingStart} to {showingEnd} of {totalRows}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="
            inline-flex
            h-8
            items-center
            gap-1
            rounded-md
            border
            border-slate-200
            bg-white
            px-2.5
            text-[11px]
            text-[#69768b]
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <FiChevronLeft />
          Prev
        </button>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-[#69768b]">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="
            inline-flex
            h-8
            items-center
            gap-1
            rounded-md
            border
            border-slate-200
            bg-white
            px-2.5
            text-[11px]
            text-[#69768b]
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[13px] text-[#69768b]">No attendance records found</p>

      <p className="mt-1 text-[11px] text-[#94a3b8]">
        Try changing your filters.
      </p>
    </div>
  );
};

/* =========================================================
   LOADING
========================================================= */

const AttendanceLoading = () => {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#01B8E5]" />

      <p className="mt-3 text-[12px] text-[#94a3b8]">Loading attendance...</p>
    </div>
  );
};

/* =========================================================
   DATE PICKER STYLE
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
