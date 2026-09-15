import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import DatePicker from "react-datepicker";

import {
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiGrid,
  FiHash,
  FiList,
  FiSearch,
} from "react-icons/fi";

import { toast } from "react-toastify";

import api from "../lib/api";

import "react-datepicker/dist/react-datepicker.css";

/* =========================================================
   OPTIONS
========================================================= */

const rowsPerPageOptions = [5, 10, 25, 50];

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

const normalizeRecord = (record) => {
  if (!record) {
    return null;
  }

  return {
    ...record,

    id: record.id ?? record.attendance_id ?? record.attendanceId,

    studentId: record.studentId ?? record.student_id ?? "",

    rfid: record.rfid ?? record.rfid_number ?? "",

    firstName: record.firstName ?? record.first_name ?? "",

    middleName: record.middleName ?? record.middle_name ?? "",

    lastName: record.lastName ?? record.last_name ?? "",

    gradeLevel: record.gradeLevel ?? record.grade_level ?? "",

    section: record.section ?? "",

    date: record.date ?? record.attendance_date ?? "",

    timeIn: record.timeIn ?? record.time_in ?? "",

    timeOut: record.timeOut ?? record.time_out ?? "",

    status: record.status ?? "No Tap",
  };
};

const extractRecords = (response) => {
  const data = response?.data ?? {};

  let records = [];

  if (Array.isArray(data)) {
    records = data;
  } else if (Array.isArray(data.records)) {
    records = data.records;
  } else if (Array.isArray(data.data)) {
    records = data.data;
  } else if (Array.isArray(data.data?.records)) {
    records = data.data.records;
  }

  return records.map(normalizeRecord).filter(Boolean);
};

const getAvatarStyle = (id) => {
  const numericId = Number(id) || 0;

  return avatarStyles[numericId % avatarStyles.length];
};

const getFullName = (record) => {
  return [record.firstName, record.middleName, record.lastName]
    .filter(Boolean)
    .join(" ");
};

const getDisplayName = (record) => {
  const lastName = record.lastName || "";

  const firstName = record.firstName || "";

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  return getFullName(record) || "-";
};

const getInitials = (record) => {
  const first = record.firstName?.[0] || "";

  const last = record.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "?";
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
};

const parseTimeToMinutes = (timeValue) => {
  if (!timeValue) {
    return -1;
  }

  const parts = String(timeValue).trim().split(" ");

  if (parts.length < 2) {
    return -1;
  }

  const [time, period] = parts;

  const [hourValue, minuteValue] = time.split(":").map(Number);

  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) {
    return -1;
  }

  let hour = hourValue;

  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minuteValue;
};

const getRecordTimestamp = (record) => {
  const dateValue = getDateValue(record.date);

  if (!dateValue) {
    return 0;
  }

  const minutes = Math.max(0, parseTimeToMinutes(record.timeIn));

  return dateValue.getTime() + minutes * 60 * 1000;
};

const getLatestLogPerStudent = (logs) => {
  const grouped = new Map();

  logs.forEach((record) => {
    const key = record.studentId;

    if (!key) {
      return;
    }

    const current = grouped.get(key);

    if (!current || getRecordTimestamp(record) > getRecordTimestamp(current)) {
      grouped.set(key, record);
    }
  });

  return Array.from(grouped.values());
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   PAGE
========================================================= */

const Rfid = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [viewMode, setViewMode] = useState("table");

  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* =======================================================
     LOAD REAL RFID HISTORY
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      setIsLoading(true);

      try {
        const response = await api.get("/api/attendance/history");

        if (cancelled) {
          return;
        }

        setLogs(extractRecords(response));
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Unable to load RFID history:", error);

        setLogs([]);

        toast.error(
          error.response?.data?.message || "Unable to load RFID history.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LATEST LOG PER STUDENT
  ======================================================= */

  const latestStudentLogs = useMemo(() => {
    return getLatestLogPerStudent(logs);
  }, [logs]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return latestStudentLogs.filter((record) => {
      const recordDate = getDateValue(record.date);

      const matchesSearch =
        !query ||
        [
          getFullName(record),

          getDisplayName(record),

          record.studentId,
          record.rfid,
          record.gradeLevel,
          record.section,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const start = getDateValue(startDate);

      const end = getDateValue(endDate);

      const matchesDate =
        (!start || (recordDate && recordDate >= start)) &&
        (!end || (recordDate && recordDate <= end));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [latestStudentLogs, searchTerm, statusFilter, startDate, endDate]);

  /* =======================================================
     SORT
  ======================================================= */

  const displayedLogs = useMemo(() => {
    return [...filteredLogs].sort(
      (a, b) => getRecordTimestamp(b) - getRecordTimestamp(a),
    );
  }, [filteredLogs]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(displayedLogs.length / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedLogs = displayedLogs.slice(startIndex, endIndex);

  const showingStart = displayedLogs.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, displayedLogs.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const completeCount = latestStudentLogs.filter(
    (item) => item.status === "Complete",
  ).length;

  const timeInOnlyCount = latestStudentLogs.filter(
    (item) => item.status === "Time In Only",
  ).length;

  const noTapCount = latestStudentLogs.filter(
    (item) => item.status === "No Tap",
  ).length;

  /* =======================================================
     RESET
  ======================================================= */

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  /* =======================================================
     EXPORT
     API DEBUGGER REMOVED
  ======================================================= */

  const handleExport = () => {
    if (displayedLogs.length === 0) {
      toast.info("There are no RFID records to export.");

      return;
    }

    const rows = displayedLogs.map((record) => ({
      date: record.date,

      studentId: record.studentId,

      rfid: record.rfid,

      name: getDisplayName(record),

      class: `${record.gradeLevel} - ${record.section}`,

      latestTimeIn: record.timeIn,

      latestTimeOut: record.timeOut,

      latestStatus: record.status,
    }));

    const header = [
      "Date",
      "Student ID",
      "RFID",
      "Name",
      "Class",
      "Latest Time In",
      "Latest Time Out",
      "Latest Status",
    ];

    const csvRows = rows.map((row) =>
      [
        row.date,
        row.studentId,
        row.rfid,
        row.name,
        row.class,
        row.latestTimeIn,
        row.latestTimeOut,
        row.latestStatus,
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

    link.download = "rfid-latest-student-logs.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    toast.success("RFID logs exported.");
  };

  /* =======================================================
     VIEW
     API DEBUGGER REMOVED
  ======================================================= */

  const handleView = (record) => {
    if (!record.studentId) {
      toast.error("Student ID is missing.");

      return;
    }

    navigate(`/rfid/${encodeURIComponent(record.studentId)}`);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return <RfidSkeleton />;
  }

  /* =======================================================
     UI
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
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            RFID Attendance
          </h1>

          <p className="mt-1 text-sm font-normal text-slate-500">
            View the latest RFID attendance summary per student.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
        >
          <FiDownload />
          Export
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Students" value={latestStudentLogs.length} />

        <SummaryCard label="Complete" value={completeCount} />

        <SummaryCard label="Time In Only" value={timeInOnlyCount} />

        <SummaryCard label="No Tap" value={noTapCount} />
      </div>

      {/* =================================================
          LIST
      ================================================= */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        {/* HEADER */}

        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="text-base font-medium text-slate-900">
                Student RFID Summary
              </p>

              <p className="mt-1 text-sm font-normal text-slate-500">
                Click the eye button to view the student's complete time in and
                time out history.
              </p>
            </div>

            {/* VIEW MODE */}

            <div className="flex h-11 w-fit rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center justify-center gap-2 rounded px-3 text-sm font-normal transition ${
                  viewMode === "grid"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiGrid />
                Cards
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center justify-center gap-2 rounded px-3 text-sm font-normal transition ${
                  viewMode === "table"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiList />
                Table
              </button>
            </div>
          </div>

          {/* FILTERS */}

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_220px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, RFID, ID, class..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All Status</option>

              <option value="Complete">Complete</option>

              <option value="Time In Only">Time In Only</option>

              <option value="No Tap">No Tap</option>
            </select>

            <DateFilter
              selected={startDate}
              onChange={setStartDate}
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate || undefined}
              selectsStart
              placeholder="Start date"
            />

            <DateFilter
              selected={endDate}
              onChange={setEndDate}
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              selectsEnd
              placeholder="End date"
            />

            <button
              type="button"
              onClick={handleResetFilter}
              className="h-11 rounded-md bg-slate-100 px-4 text-sm font-normal text-slate-600 transition hover:bg-slate-200"
            >
              Reset
            </button>
          </div>
        </div>

        {/* =================================================
            GRID / TABLE
        ================================================= */}

        {viewMode === "grid" ? (
          <RfidGrid records={paginatedLogs} onView={handleView} />
        ) : (
          <RfidTable records={paginatedLogs} onView={handleView} />
        )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={displayedLogs.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onRowsPerPageChange={setRowsPerPage}
          onPageChange={setCurrentPage}
          label="students"
        />
      </div>

      <DatePickerStyles />
    </div>
  );
};

/* =========================================================
   GRID
========================================================= */

const RfidGrid = ({ records, onView }) => {
  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {records.map((record) => (
        <div
          key={record.studentId}
          className="overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {/* ACTION */}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onView(record)}
              title="View all logs"
              aria-label="View all logs"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-slate-900 hover:text-white"
            >
              <FiEye />
            </button>
          </div>

          {/* STUDENT */}

          <div className="mt-2 flex flex-col items-center text-center">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-normal ring-4 ${getAvatarStyle(
                record.id,
              )}`}
            >
              {getInitials(record)}
            </div>

            <p className="mt-4 text-sm font-normal text-slate-900">
              {getDisplayName(record)}
            </p>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-normal text-slate-400">
              <FiHash />

              {record.studentId}
            </div>
          </div>

          {/* INFO */}

          <div className="mt-5 rounded-md bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={<FiCreditCard />}
                label="RFID"
                value={record.rfid}
              />

              <InfoRow
                icon={<FiBookOpen />}
                label="Class"
                value={`${record.gradeLevel} - ${record.section}`}
              />

              <InfoRow
                icon={<FiCalendar />}
                label="Date"
                value={formatDate(record.date)}
              />

              <div>
                <p className="mb-1 text-xs font-normal uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <StatusBadge status={record.status} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <TimeBox label="Time In" value={record.timeIn || "-"} />

              <TimeBox label="Time Out" value={record.timeOut || "-"} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   TABLE
========================================================= */

const RfidTable = ({ records, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <TableHeader label="Student" />

            <TableHeader label="RFID" />

            <TableHeader label="Class" />

            <TableHeader label="Latest Date" />

            <TableHeader label="Time In" />

            <TableHeader label="Time Out" />

            <TableHeader label="Status" />

            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {records.length > 0 ? (
            records.map((record) => (
              <tr
                key={record.studentId}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-normal ring-4 ${getAvatarStyle(
                        record.id,
                      )}`}
                    >
                      {getInitials(record)}
                    </div>

                    <div>
                      <p className="text-sm font-normal text-slate-900">
                        {getDisplayName(record)}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs font-normal text-slate-400">
                        <FiHash />

                        {record.studentId}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <RfidText value={record.rfid} />
                </td>

                <td className="px-5 py-4 text-sm font-normal text-slate-600">
                  {record.gradeLevel} - {record.section}
                </td>

                <td className="px-5 py-4 text-sm font-normal text-slate-600">
                  {formatDate(record.date)}
                </td>

                <td className="px-5 py-4">
                  <TimeText value={record.timeIn || "-"} />
                </td>

                <td className="px-5 py-4">
                  <TimeText value={record.timeOut || "-"} />
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={record.status} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onView(record)}
                      title="View all logs"
                      aria-label="View all logs"
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-slate-900 hover:text-white"
                    >
                      <FiEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">
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
   DATE FILTER
========================================================= */

const DateFilter = ({
  selected,
  onChange,
  startDate,
  endDate,
  minDate,
  maxDate,
  selectsStart,
  selectsEnd,
  placeholder,
}) => {
  return (
    <div className="relative">
      <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" />

      <DatePicker
        selected={selected}
        onChange={onChange}
        selectsStart={selectsStart}
        selectsEnd={selectsEnd}
        startDate={startDate}
        endDate={endDate}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        dateFormat="MMM dd, yyyy"
        className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      />
    </div>
  );
};

/* =========================================================
   INFO
========================================================= */

const InfoRow = ({ icon, label, value }) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-normal uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-normal text-slate-600">
        <span className="shrink-0 text-slate-400">{icon}</span>

        <span className="truncate">{value || "-"}</span>
      </div>
    </div>
  );
};

/* =========================================================
   TIME
========================================================= */

const TimeBox = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-xs font-normal text-slate-400">{label}</p>

      <p className="mt-1 flex items-center gap-1.5 text-sm font-normal text-slate-900">
        <FiClock className="shrink-0 text-cyan-600" />

        {value}
      </p>
    </div>
  );
};

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiClock className="text-slate-400" />

      {value}
    </div>
  );
};

const RfidText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiCreditCard className="text-slate-400" />

      {value || "-"}
    </div>
  );
};

/* =========================================================
   STATUS
========================================================= */

const StatusBadge = ({ status }) => {
  const styles = {
    Complete: "bg-emerald-50 text-emerald-700",

    "Time In Only": "bg-orange-50 text-orange-700",

    "No Tap": "bg-slate-100 text-slate-500",
  };

  const dotStyles = {
    Complete: "bg-emerald-500",

    "Time In Only": "bg-orange-500",

    "No Tap": "bg-slate-400",
  };

  const currentStatus = status || "No Tap";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal ${
        styles[currentStatus] || styles["No Tap"]
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          dotStyles[currentStatus] || dotStyles["No Tap"]
        }`}
      />

      {currentStatus}
    </span>
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
  label,
}) => {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal text-slate-500">Show</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="text-sm font-normal text-slate-500">entries</span>
        </div>

        <p className="text-sm font-normal text-slate-500">
          Showing {showingStart} to {showingEnd} of {totalRows} {label}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
        >
          <FiChevronLeft />
          Prev
        </button>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-normal text-slate-600">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </th>
  );
};

/* =========================================================
   SUMMARY
========================================================= */

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-sm font-normal text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-medium text-slate-950">{value}</p>
    </div>
  );
};

/* =========================================================
   EMPTY
========================================================= */

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-normal text-slate-600">
        No RFID records found.
      </p>

      <p className="mt-1 text-xs font-normal text-slate-400">
        Try changing the search, status, or date range.
      </p>
    </div>
  );
};

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
};

const RfidSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Skeleton className="h-8 w-48" />

          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>

        <Skeleton className="h-10 w-24" />
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div key={index} className="rounded-md bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-24" />

            <Skeleton className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>

      {/* LIST */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="flex justify-between gap-4">
            <div>
              <Skeleton className="h-5 w-40" />

              <Skeleton className="mt-2 h-3 w-72" />
            </div>

            <Skeleton className="h-11 w-40" />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_220px_auto]">
            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <th key={index} className="px-5 py-4">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: 6,
              }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />

                      <div>
                        <Skeleton className="h-4 w-32" />

                        <Skeleton className="mt-2 h-3 w-20" />
                      </div>
                    </div>
                  </td>

                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <td key={index} className="px-5 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}

                  <td className="px-5 py-5">
                    <div className="flex justify-end">
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationSkeleton />
      </div>
    </div>
  );
};

/* =========================================================
   PAGINATION SKELETON
========================================================= */

const PaginationSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-8" />

        <Skeleton className="h-9 w-16" />

        <Skeleton className="h-4 w-12" />

        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20" />

        <Skeleton className="h-9 w-24" />

        <Skeleton className="h-9 w-20" />
      </div>
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
          border-radius: 10px;
          overflow: hidden;
          font-family: inherit;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }

        .react-datepicker__header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: #0f172a;
          font-weight: 500;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--in-selecting-range {
          background-color: #0891b2 !important;
          color: white !important;
        }

        .react-datepicker__day:hover {
          background-color: #cffafe;
        }
      `}
    </style>
  );
};

export default Rfid;
