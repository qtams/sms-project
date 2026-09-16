import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import DatePicker from "react-datepicker";

import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiHash,
  FiSearch,
} from "react-icons/fi";

import { toast } from "react-toastify";

import api from "../../services/api";

import "react-datepicker/dist/react-datepicker.css";

/* =========================================================
   OPTIONS
========================================================= */

const rowsPerPageOptions = [5, 10, 25, 50];

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

const getFullName = (record) => {
  return [record.firstName, record.middleName, record.lastName]
    .filter(Boolean)
    .join(" ");
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
    return null;
  }

  const parts = String(timeValue).trim().split(" ");

  if (parts.length < 2) {
    return null;
  }

  const [time, period] = parts;

  const [hourValue, minuteValue] = time.split(":").map(Number);

  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) {
    return null;
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

const getDuration = (timeIn, timeOut) => {
  const start = parseTimeToMinutes(timeIn);

  const end = parseTimeToMinutes(timeOut);

  if (start === null || end === null || end < start) {
    return "-";
  }

  const totalMinutes = end - start;

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   PAGE
========================================================= */

const RfidDetails = () => {
  const navigate = useNavigate();

  const { studentId } = useParams();

  const [logs, setLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* =======================================================
     LOAD REAL ATTENDANCE HISTORY
     NO DUMMY DATA
  ======================================================= */

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);

      return;
    }

    let cancelled = false;

    const loadLogs = async () => {
      setIsLoading(true);

      setLoadError("");

      try {
        const response = await api.get("/api/attendance/history");

        if (cancelled) {
          return;
        }

        const records = extractRecords(response);

        const studentRecords = records.filter(
          (record) => String(record.studentId) === String(studentId),
        );

        setLogs(studentRecords);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Unable to load RFID logs:", error);

        setLogs([]);

        setLoadError(
          error.response?.data?.message || "Unable to load RFID logs.",
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
  }, [studentId]);

  /* =======================================================
     STUDENT
  ======================================================= */

  const student = useMemo(() => {
    if (logs.length === 0) {
      return null;
    }

    return [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
  }, [logs]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return logs.filter((record) => {
      const recordDate = getDateValue(record.date);

      const matchesSearch =
        !query ||
        [
          record.rfid,
          record.status,
          record.date,
          record.timeIn,
          record.timeOut,
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
  }, [logs, searchTerm, statusFilter, startDate, endDate]);

  /* =======================================================
     SORT
  ======================================================= */

  const displayedLogs = useMemo(() => {
    return [...filteredLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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

  const completeCount = logs.filter(
    (item) => item.status === "Complete",
  ).length;

  const timeInOnlyCount = logs.filter(
    (item) => item.status === "Time In Only",
  ).length;

  const noTapCount = logs.filter((item) => item.status === "No Tap").length;

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
      toast.info("There are no RFID logs to export.");

      return;
    }

    const rows = displayedLogs.map((record) => ({
      date: record.date,

      studentId: record.studentId,

      rfid: record.rfid,

      name: student ? getFullName(student) : "",

      class: `${record.gradeLevel} - ${record.section}`,

      timeIn: record.timeIn,

      timeOut: record.timeOut,

      duration: getDuration(record.timeIn, record.timeOut),

      status: record.status,
    }));

    const header = [
      "Date",
      "Student ID",
      "RFID",
      "Name",
      "Class",
      "Time In",
      "Time Out",
      "Duration",
      "Status",
    ];

    const csvRows = rows.map((row) =>
      [
        row.date,
        row.studentId,
        row.rfid,
        row.name,
        row.class,
        row.timeIn,
        row.timeOut,
        row.duration,
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

    link.download = `${studentId}-rfid-logs.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Student RFID logs exported.");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return <RfidDetailsSkeleton />;
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!student) {
    return (
      <div className="space-y-5 [font-family:'Poppins',sans-serif]">
        <button
          type="button"
          onClick={() => navigate("/rfid")}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
        >
          <FiArrowLeft />
          Back
        </button>

        <div className="rounded-md bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-normal text-slate-600">
            No RFID logs found.
          </p>

          <p className="mt-1 text-xs font-normal text-slate-400">
            {loadError ||
              "There are no attendance records available for this student."}
          </p>
        </div>
      </div>
    );
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
            Student RFID Logs
          </h1>

          <p className="mt-1 text-sm font-normal text-slate-500">
            View all time in and time out records of this student.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={() => navigate("/rfid")}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-normal text-white transition hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>
      </div>

      {/* =================================================
          STUDENT PROFILE
      ================================================= */}

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-normal text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(student)}
            </div>

            <div>
              <p className="text-sm font-normal text-slate-500">Student</p>

              <p className="text-xl font-medium text-slate-950">
                {getFullName(student)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-normal text-slate-600">
                  <FiHash />

                  {student.studentId}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
                  <FiCreditCard />

                  {student.rfid || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-normal text-slate-500">Class</p>

            <p className="mt-1 text-sm font-normal text-slate-900">
              {student.gradeLevel} - {student.section}
            </p>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Records" value={logs.length} />

          <SummaryCard label="Complete" value={completeCount} />

          <SummaryCard label="Time In Only" value={timeInOnlyCount} />

          <SummaryCard label="No Tap" value={noTapCount} />
        </div>
      </div>

      {/* =================================================
          HISTORY TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <p className="text-base font-medium text-slate-900">
            Time In / Time Out History
          </p>

          <p className="mt-1 text-sm font-normal text-slate-500">
            Filter this student's RFID logs by status and date range.
          </p>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_220px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search RFID, status, date..."
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

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <TableHeader label="Date" />

                <TableHeader label="RFID" />

                <TableHeader label="Time In" />

                <TableHeader label="Time Out" />

                <TableHeader label="Duration" />

                <TableHeader label="Status" />
              </tr>
            </thead>

            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((record) => (
                  <tr
                    key={
                      record.id ??
                      `${record.studentId}-${record.date}-${record.timeIn}`
                    }
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 text-sm font-normal text-slate-600">
                        <FiCreditCard className="text-slate-400" />

                        {record.rfid || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <TimeText value={record.timeIn || "-"} />
                    </td>

                    <td className="px-5 py-4">
                      <TimeText value={record.timeOut || "-"} />
                    </td>

                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      {getDuration(record.timeIn, record.timeOut)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))
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

        {/* PAGINATION */}

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={displayedLogs.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onRowsPerPageChange={setRowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <DatePickerStyles />
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
   TIME
========================================================= */

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiClock className="text-slate-400" />

      {value}
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
          Showing {showingStart} to {showingEnd} of {totalRows} records
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
      <p className="text-sm font-normal text-slate-600">No RFID logs found.</p>

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

const RfidDetailsSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Skeleton className="h-8 w-48" />

          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />

          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* PROFILE */}

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />

            <div>
              <Skeleton className="h-3 w-20" />

              <Skeleton className="mt-2 h-6 w-48" />

              <div className="mt-2 flex gap-3">
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="w-48 rounded-md bg-slate-50 p-4">
            <Skeleton className="h-3 w-12" />

            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div key={index} className="rounded-md bg-white p-4 shadow-sm">
              <Skeleton className="h-4 w-24" />

              <Skeleton className="mt-3 h-7 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <Skeleton className="h-5 w-48" />

          <Skeleton className="mt-2 h-3 w-72" />

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_220px_auto]">
            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-full" />

            <Skeleton className="h-11 w-20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {Array.from({
                  length: 6,
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
                  {Array.from({
                    length: 6,
                  }).map((_, columnIndex) => (
                    <td key={columnIndex} className="px-5 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
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

export default RfidDetails;
