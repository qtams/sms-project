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
import { apiDebugRequest } from "../utils/apiDebugger";
import "react-datepicker/dist/react-datepicker.css";

const rowsPerPageOptions = [8, 16, 24, 32];

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
  {
    id: 7,
    studentId: "STD-0005",
    rfid: "RFID-000005",
    firstName: "Aisha",
    middleName: "",
    lastName: "Tinio",
    gradeLevel: "Grade 7",
    section: "A",
    date: "2026-07-16",
    timeIn: "07:22 AM",
    timeOut: "04:01 PM",
    status: "Complete",
  },
  {
    id: 8,
    studentId: "STD-0006",
    rfid: "RFID-000006",
    firstName: "Kandice",
    middleName: "",
    lastName: "Castro",
    gradeLevel: "Grade 8",
    section: "B",
    date: "2026-07-16",
    timeIn: "07:36 AM",
    timeOut: "04:09 PM",
    status: "Complete",
  },
  {
    id: 9,
    studentId: "STD-0007",
    rfid: "RFID-000007",
    firstName: "Aina",
    middleName: "",
    lastName: "Penales",
    gradeLevel: "Grade 11",
    section: "HUMSS A",
    date: "2026-07-16",
    timeIn: "07:44 AM",
    timeOut: "",
    status: "Time In Only",
  },
  {
    id: 10,
    studentId: "STD-0008",
    rfid: "RFID-000008",
    firstName: "Miguel",
    middleName: "",
    lastName: "Garcia",
    gradeLevel: "Grade 10",
    section: "D",
    date: "2026-07-15",
    timeIn: "07:29 AM",
    timeOut: "04:15 PM",
    status: "Complete",
  },
];

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (id) => {
  return avatarStyles[id % avatarStyles.length];
};

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
  if (!timeValue) return -1;

  const [time, period] = timeValue.split(" ");
  const [hourValue, minuteValue] = time.split(":").map(Number);

  let hour = hourValue;

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minuteValue;
};

const getLatestLogPerStudent = (logs) => {
  const grouped = new Map();

  logs.forEach((record) => {
    const current = grouped.get(record.studentId);

    const currentValue = current
      ? new Date(current.date).getTime() + parseTimeToMinutes(current.timeIn)
      : 0;

    const nextValue =
      new Date(record.date).getTime() + parseTimeToMinutes(record.timeIn);

    if (!current || nextValue > currentValue) {
      grouped.set(record.studentId, record);
    }
  });

  return Array.from(grouped.values());
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

const Rfid = () => {
  const navigate = useNavigate();

  const [logs] = useState(rfidLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  const [startDate, setStartDate] = useState(new Date("2026-07-13"));
  const [endDate, setEndDate] = useState(new Date("2026-07-16"));

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const latestStudentLogs = useMemo(() => {
    return getLatestLogPerStudent(logs);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return latestStudentLogs.filter((record) => {
      const searchValue = searchTerm.toLowerCase();
      const recordDate = getDateValue(record.date);

      const matchesSearch =
        getFullName(record).toLowerCase().includes(searchValue) ||
        getDisplayName(record).toLowerCase().includes(searchValue) ||
        record.studentId.toLowerCase().includes(searchValue) ||
        record.rfid.toLowerCase().includes(searchValue) ||
        record.gradeLevel.toLowerCase().includes(searchValue) ||
        record.section.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const matchesDate =
        (!startDate || recordDate >= getDateValue(startDate)) &&
        (!endDate || recordDate <= getDateValue(endDate));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [latestStudentLogs, searchTerm, statusFilter, startDate, endDate]);

  const displayedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
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

  const completeCount = latestStudentLogs.filter(
    (item) => item.status === "Complete",
  ).length;

  const timeInOnlyCount = latestStudentLogs.filter(
    (item) => item.status === "Time In Only",
  ).length;

  const noTapCount = latestStudentLogs.filter(
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
      latestTimeIn: record.timeIn,
      latestTimeOut: record.timeOut,
      latestStatus: record.status,
    }));

    await apiDebugRequest({
      module: "rfid",
      action: "export-latest-student-logs",
      method: "POST",
      payload: {
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
    link.click();

    URL.revokeObjectURL(url);
    toast.success("RFID logs exported.");
  };

  const handleView = async (record) => {
    await apiDebugRequest({
      module: "rfid",
      action: "view-student-logs-page",
      method: "GET",
      payload: {
        id: record.id,
        studentId: record.studentId,
        rfid: record.rfid,
      },
    });

    navigate(`/rfid/${record.studentId}`);
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            RFID Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View latest RFID attendance summary per student.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FiDownload />
          Export
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Students" value={latestStudentLogs.length} />
        <SummaryCard label="Complete" value={completeCount} />
        <SummaryCard label="Time In Only" value={timeInOnlyCount} />
        <SummaryCard label="No Tap" value={noTapCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Student RFID Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Click the eye button to view all time in and time out records.
              </p>
            </div>

            <div className="flex h-11 w-fit rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
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
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
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

          <div className="grid gap-3 xl:grid-cols-[1fr_180px_220px_220px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, RFID, ID, class..."
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

        {viewMode === "grid" ? (
          <RfidGrid records={paginatedLogs} onView={handleView} />
        ) : (
          <RfidTable records={paginatedLogs} onView={handleView} />
        )}

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

const RfidGrid = ({ records, onView }) => {
  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
      {records.map((record) => (
        <div
          key={record.studentId}
          className="overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-cyan-600"
            />

            <button
              type="button"
              onClick={() => onView(record)}
              title="View all logs"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-violet-600 transition hover:bg-violet-600 hover:text-white"
            >
              <FiEye />
            </button>
          </div>

          <div className="mt-2 flex flex-col items-center text-center">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full text-3xl font-semibold ring-4 ${getAvatarStyle(
                record.id,
              )}`}
            >
              {getInitials(record)}
            </div>

            <h3 className="mt-3 text-sm font-semibold text-slate-950">
              {getDisplayName(record)}
            </h3>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <FiHash />
              {record.studentId}
            </div>
          </div>

          <div className="mt-3 rounded-md bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-3">
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

              <div className="flex items-end justify-start">
                <StatusBadge status={record.status} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <TimeBox label="Time In" value={record.timeIn || "-"} />
              <TimeBox label="Time Out" value={record.timeOut || "-"} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

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
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 ${getAvatarStyle(
                        record.id,
                      )}`}
                    >
                      {getInitials(record)}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {getDisplayName(record)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <FiHash />
                        {record.studentId}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <RfidText value={record.rfid} />
                </td>

                <td className="px-5 py-4 text-sm font-medium text-slate-600">
                  {record.gradeLevel} - {record.section}
                </td>

                <td className="px-5 py-4 text-sm font-medium text-slate-600">
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
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-violet-600 transition hover:bg-violet-600 hover:text-white"
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

const InfoRow = ({ icon, label, value }) => {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
};

const TimeBox = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>

      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <FiClock className="shrink-0 text-cyan-600" />
        {value}
      </p>
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

const RfidText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
      <FiCreditCard className="text-slate-400" />
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
          Showing {showingStart} to {showingEnd} of {totalRows} students
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
      <p className="font-semibold text-slate-900">No RFID records found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing the search, status, or date range.
      </p>
    </div>
  );
};

export default Rfid;
