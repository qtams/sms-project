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
import { apiDebugRequest } from "../utils/apiDebugger";
import "react-datepicker/dist/react-datepicker.css";

const rowsPerPageOptions = [5, 10, 25, 50];

const rfidLogs = [
  {
    id: 1,
    studentId: "STD-0001",
    rfid: "RFID-000001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    date: "2026-07-16",
    timeIn: "07:18 AM",
    timeOut: "04:12 PM",
    status: "Complete",
  },
  {
    id: 2,
    studentId: "STD-0001",
    rfid: "RFID-000001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    date: "2026-07-15",
    timeIn: "07:25 AM",
    timeOut: "04:08 PM",
    status: "Complete",
  },
  {
    id: 3,
    studentId: "STD-0001",
    rfid: "RFID-000001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    date: "2026-07-14",
    timeIn: "07:41 AM",
    timeOut: "",
    status: "Time In Only",
  },
  {
    id: 4,
    studentId: "STD-0002",
    rfid: "RFID-000002",
    firstName: "Ana",
    middleName: "",
    lastName: "Santos",
    gradeLevel: "Grade 8",
    section: "B",
    date: "2026-07-16",
    timeIn: "07:31 AM",
    timeOut: "",
    status: "Time In Only",
  },
  {
    id: 5,
    studentId: "STD-0003",
    rfid: "RFID-000003",
    firstName: "Carlo",
    middleName: "",
    lastName: "Reyes",
    gradeLevel: "Grade 11",
    section: "STEM A",
    date: "2026-07-15",
    timeIn: "07:42 AM",
    timeOut: "04:05 PM",
    status: "Complete",
  },
  {
    id: 6,
    studentId: "STD-0004",
    rfid: "RFID-000004",
    firstName: "Mark",
    middleName: "",
    lastName: "Villanueva",
    gradeLevel: "Grade 9",
    section: "C",
    date: "2026-07-14",
    timeIn: "",
    timeOut: "",
    status: "No Tap",
  },
];

const getFullName = (record) => {
  return [record.firstName, record.middleName, record.lastName]
    .filter(Boolean)
    .join(" ");
};

const getDisplayName = (record) => {
  return `${record.lastName}, ${record.firstName}`;
};

const getInitials = (record) => {
  return `${record.firstName?.[0] || ""}${
    record.lastName?.[0] || ""
  }`.toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getDateValue = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseTimeToMinutes = (timeValue) => {
  if (!timeValue) return null;

  const [time, period] = timeValue.split(" ");
  const [hourValue, minuteValue] = time.split(":").map(Number);

  let hour = hourValue;

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minuteValue;
};

const getDuration = (timeIn, timeOut) => {
  const start = parseTimeToMinutes(timeIn);
  const end = parseTimeToMinutes(timeOut);

  if (start === null || end === null || end < start) return "-";

  const totalMinutes = end - start;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

const RfidDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const studentLogs = useMemo(() => {
    return rfidLogs.filter((record) => record.studentId === studentId);
  }, [studentId]);

  const student = studentLogs[0];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState(new Date("2026-07-13"));
  const [endDate, setEndDate] = useState(new Date("2026-07-16"));

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredLogs = useMemo(() => {
    return studentLogs.filter((record) => {
      const searchValue = searchTerm.toLowerCase();
      const recordDate = getDateValue(record.date);

      const matchesSearch =
        record.rfid.toLowerCase().includes(searchValue) ||
        record.status.toLowerCase().includes(searchValue) ||
        record.date.toLowerCase().includes(searchValue) ||
        String(record.timeIn || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(record.timeOut || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const matchesDate =
        (!startDate || recordDate >= getDateValue(startDate)) &&
        (!endDate || recordDate <= getDateValue(endDate));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [studentLogs, searchTerm, statusFilter, startDate, endDate]);

  const displayedLogs = useMemo(() => {
    return [...filteredLogs].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, [filteredLogs]);

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

  const completeCount = studentLogs.filter(
    (item) => item.status === "Complete",
  ).length;

  const timeInOnlyCount = studentLogs.filter(
    (item) => item.status === "Time In Only",
  ).length;

  const noTapCount = studentLogs.filter(
    (item) => item.status === "No Tap",
  ).length;

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    const rows = displayedLogs.map((record) => ({
      date: record.date,
      studentId: record.studentId,
      rfid: record.rfid,
      name: getDisplayName(record),
      class: `${record.gradeLevel} - ${record.section}`,
      timeIn: record.timeIn,
      timeOut: record.timeOut,
      duration: getDuration(record.timeIn, record.timeOut),
      status: record.status,
    }));

    await apiDebugRequest({
      module: "rfid",
      action: "export-student-logs",
      method: "POST",
      payload: {
        studentId,
        totalRows: rows.length,
        rows,
        exportedAt: new Date().toISOString(),
      },
    });

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
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Student RFID logs exported.");
  };

  if (!student) {
    return (
      <div data-aos="fade-up" className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/rfid")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to RFID
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            RFID record not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            No RFID logs found for this student.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Student RFID Logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View all time in and time out records of this student.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={() => navigate("/rfid")}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>
      </div>

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-2xl font-semibold text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(student)}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Student</p>
              <h2 className="text-xl font-semibold text-slate-950">
                {getFullName(student)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-500">
                  <FiHash />
                  {student.studentId}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <FiCreditCard />
                  {student.rfid}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Class</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {student.gradeLevel} - {student.section}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Total Records" value={studentLogs.length} />
          <SummaryCard label="Complete" value={completeCount} />
          <SummaryCard label="Time In Only" value={timeInOnlyCount} />
          <SummaryCard label="No Tap" value={noTapCount} />
        </div>
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Time In / Time Out History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter this student's RFID logs by status and date range.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_180px_240px_240px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search RFID, status, date..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All Status</option>
              <option value="Complete">Complete</option>
              <option value="Time In Only">Time In Only</option>
              <option value="No Tap">No Tap</option>
            </select>

            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" />

              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={endDate || undefined}
                placeholderText="Start date"
                dateFormat="MMM dd, yyyy"
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" />

              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                placeholderText="End date"
                dateFormat="MMM dd, yyyy"
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <button
              type="button"
              onClick={handleResetFilter}
              className="h-11 rounded-md bg-slate-100 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            >
              Reset
            </button>
          </div>
        </div>

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
                    key={record.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <FiCreditCard className="text-slate-400" />
                        {record.rfid}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <TimeText value={record.timeIn || "-"} />
                    </td>

                    <td className="px-5 py-4">
                      <TimeText value={record.timeOut || "-"} />
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
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
            font-weight: 600;
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
    </div>
  );
};

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
      <FiClock className="text-slate-400" />
      {value}
    </div>
  );
};

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

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
        styles[status] || styles["No Tap"]
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          dotStyles[status] || dotStyles["No Tap"]
        }`}
      />
      {status}
    </span>
  );
};

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
          <span className="text-sm text-slate-500">Show</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="text-sm text-slate-500">entries</span>
        </div>

        <p className="text-sm text-slate-500">
          Showing {showingStart} to {showingEnd} of {totalRows} records
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronLeft />
          Prev
        </button>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </th>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{value}</h2>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-semibold text-slate-900">No RFID logs found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing the search, status, or date range.
      </p>
    </div>
  );
};

export default RfidDetails;
