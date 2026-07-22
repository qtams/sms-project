import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiHash,
  FiSearch,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiDebugRequest } from "../utils/apiDebugger";
import "react-datepicker/dist/react-datepicker.css";

const ATTENDANCE_STORAGE_KEY = "spry_teacher_attendance_records";
const rowsPerPageOptions = [5, 10, 25, 50];

const currentTeacher = {
  teacherId: "TCH-0001",
  teacherName: "Buendia, Tamahome",
  assignedSections: ["Grade 7 - A", "Grade 9 - C", "Grade 10 - D"],
};

const classStudents = [
  {
    id: 1,
    studentId: "STD-0001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    teacherId: "TCH-0001",
    teacherName: "Buendia, Tamahome",
  },
  {
    id: 2,
    studentId: "STD-0005",
    firstName: "Aisha",
    middleName: "",
    lastName: "Tinio",
    gradeLevel: "Grade 7",
    section: "A",
    teacherId: "TCH-0001",
    teacherName: "Buendia, Tamahome",
  },
  {
    id: 3,
    studentId: "STD-0004",
    firstName: "Mark",
    middleName: "",
    lastName: "Villanueva",
    gradeLevel: "Grade 9",
    section: "C",
    teacherId: "TCH-0001",
    teacherName: "Buendia, Tamahome",
  },
  {
    id: 4,
    studentId: "STD-0008",
    firstName: "Miguel",
    middleName: "",
    lastName: "Garcia",
    gradeLevel: "Grade 10",
    section: "D",
    teacherId: "TCH-0001",
    teacherName: "Buendia, Tamahome",
  },
];

const initialAttendanceRecords = [
  {
    id: 1,
    studentId: "STD-0001",
    date: "2026-07-16",
    timeIn: "07:18 AM",
    status: "Present",
  },
  {
    id: 2,
    studentId: "STD-0005",
    date: "2026-07-16",
    timeIn: "07:22 AM",
    status: "Present",
  },
  {
    id: 3,
    studentId: "STD-0004",
    date: "2026-07-16",
    timeIn: "-",
    status: "Absent",
  },
  {
    id: 4,
    studentId: "STD-0008",
    date: "2026-07-16",
    timeIn: "07:29 AM",
    status: "Present",
  },
  {
    id: 5,
    studentId: "STD-0001",
    date: "2026-07-15",
    timeIn: "07:25 AM",
    status: "Present",
  },
  {
    id: 6,
    studentId: "STD-0005",
    date: "2026-07-15",
    timeIn: "-",
    status: "Absent",
  },
];

const getStoredAttendanceRecords = () => {
  try {
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(initialAttendanceRecords),
      );

      return initialAttendanceRecords;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : initialAttendanceRecords;
  } catch {
    return initialAttendanceRecords;
  }
};

const saveStoredAttendanceRecords = (records) => {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
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

const getClassName = (record) => {
  return `${record.gradeLevel} - ${record.section}`;
};

const getManilaDateTime = () => {
  const now = new Date();

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  const year = dateParts.find((part) => part.type === "year")?.value;
  const month = dateParts.find((part) => part.type === "month")?.value;
  const day = dateParts.find((part) => part.type === "day")?.value;

  return {
    date: `${year}-${month}-${day}`,
    time,
  };
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

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

const AttendanceDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [attendanceRecords, setAttendanceRecords] = useState(() =>
    getStoredAttendanceRecords(),
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState(new Date("2026-07-14"));
  const [endDate, setEndDate] = useState(new Date("2026-07-16"));

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const student = useMemo(() => {
    return classStudents.find((item) => {
      const isCurrentStudent = item.studentId === studentId;
      const isAssignedToTeacher = item.teacherId === currentTeacher.teacherId;
      const isAssignedSection = currentTeacher.assignedSections.includes(
        getClassName(item),
      );

      return isCurrentStudent && isAssignedToTeacher && isAssignedSection;
    });
  }, [studentId]);

  const studentLogs = useMemo(() => {
    return attendanceRecords.filter((record) => record.studentId === studentId);
  }, [attendanceRecords, studentId]);

  const filteredLogs = useMemo(() => {
    return studentLogs.filter((record) => {
      const searchValue = searchTerm.toLowerCase();
      const recordDate = getDateValue(record.date);

      const matchesSearch =
        record.status.toLowerCase().includes(searchValue) ||
        record.date.toLowerCase().includes(searchValue) ||
        String(record.timeIn || "")
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

  const presentCount = studentLogs.filter(
    (record) => record.status === "Present",
  ).length;

  const absentCount = studentLogs.filter(
    (record) => record.status === "Absent",
  ).length;

  const updateAttendanceStatus = async (record, nextStatus) => {
    const manilaDateTime = getManilaDateTime();

    const updatedRecord =
      nextStatus === "Present"
        ? {
            ...record,
            date: manilaDateTime.date,
            timeIn: manilaDateTime.time,
            status: "Present",
          }
        : {
            ...record,
            date: manilaDateTime.date,
            timeIn: "-",
            status: "Absent",
          };

    await apiDebugRequest({
      module: "attendance",
      action: "teacher-update-individual-status",
      method: "PATCH",
      payload: {
        teacherId: currentTeacher.teacherId,
        teacherName: currentTeacher.teacherName,
        id: record.id,
        studentId: record.studentId,
        studentName: student ? getFullName(student) : record.studentId,
        previousStatus: record.status,
        nextStatus,
        date: updatedRecord.date,
        timeIn: updatedRecord.timeIn,
        timezone: "Asia/Manila",
        updatedAt: new Date().toISOString(),
      },
    });

    setAttendanceRecords((current) => {
      const nextRecords = current.map((item) =>
        item.id === record.id ? updatedRecord : item,
      );

      saveStoredAttendanceRecords(nextRecords);

      return nextRecords;
    });

    setStartDate(null);
    setEndDate(null);

    toast.success(
      nextStatus === "Present"
        ? "Student marked present using Manila time."
        : "Student marked absent.",
    );
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    if (!student) return;

    const rows = displayedLogs.map((record) => ({
      date: record.date,
      studentId: student.studentId,
      name: getDisplayName(student),
      class: getClassName(student),
      teacher: student.teacherName,
      timeIn: record.timeIn,
      status: record.status,
    }));

    await apiDebugRequest({
      module: "attendance",
      action: "teacher-export-individual-attendance",
      method: "POST",
      payload: {
        teacherId: currentTeacher.teacherId,
        studentId,
        totalRows: rows.length,
        rows,
        exportedAt: new Date().toISOString(),
      },
    });

    const header = [
      "Date",
      "Student ID",
      "Name",
      "Class",
      "Teacher",
      "Time In",
      "Status",
    ];

    const csvRows = rows.map((row) =>
      [
        row.date,
        row.studentId,
        row.name,
        row.class,
        row.teacher,
        row.timeIn,
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
    link.download = `${studentId}-attendance-history.csv`;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Student attendance exported.");
  };

  if (!student) {
    return (
      <div data-aos="fade-up" className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/attendance")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to Attendance
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            Attendance record not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            No assigned attendance history found for this student.
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
            Student Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Individual attendance history from teacher view.
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
            onClick={() => navigate("/attendance")}
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
                  <FiBookOpen />
                  {getClassName(student)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Teacher</p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {currentTeacher.teacherName}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SummaryCard label="Total Records" value={studentLogs.length} />
          <SummaryCard label="Present" value={presentCount} />
          <SummaryCard label="Absent" value={absentCount} />
        </div>
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Attendance History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and update this student's attendance records.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_180px_220px_220px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search status, date, time..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
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
          <table className="w-full min-w-[800px] table-fixed border-collapse text-center">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <TableHeader label="Date" className="w-[22%]" />
                <TableHeader label="Time In" className="w-[22%]" />
                <TableHeader label="Status" className="w-[18%]" />
                <TableHeader label="Set Attendance" className="w-[38%]" />
              </tr>
            </thead>

            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <TimeText value={record.timeIn} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={record.status} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusActionButtons
                        record={record}
                        onUpdateStatus={updateAttendanceStatus}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
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

      <DatePickerStyles />
    </div>
  );
};

const StatusActionButtons = ({ record, onUpdateStatus }) => {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onUpdateStatus(record, "Present")}
        className={`inline-flex h-8 min-w-[108px] items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${
          record.status === "Present"
            ? "bg-emerald-600 text-white"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
        }`}
      >
        <FiUserCheck className="text-sm" />
        Present
      </button>

      <button
        type="button"
        onClick={() => onUpdateStatus(record, "Absent")}
        className={`inline-flex h-8 min-w-[108px] items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${
          record.status === "Absent"
            ? "bg-red-600 text-white"
            : "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
        }`}
      >
        <FiUserX className="text-sm" />
        Absent
      </button>
    </div>
  );
};

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-600">
      <FiClock className="text-sm text-slate-400" />
      {value || "-"}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Present: "bg-emerald-50 text-emerald-700",
    Absent: "bg-red-50 text-red-700",
  };

  const dotStyles = {
    Present: "bg-emerald-500",
    Absent: "bg-red-500",
  };

  return (
    <span
      className={`inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium ${
        styles[status] || styles.Absent
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          dotStyles[status] || dotStyles.Absent
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
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span>Show</span>

        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span>entries</span>

        <span className="hidden text-slate-300 sm:inline">|</span>

        <span>
          Showing {showingStart} to {showingEnd} of {totalRows} records
        </span>
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

const TableHeader = ({ label, className = "" }) => {
  return (
    <th
      className={`px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-slate-500 ${className}`}
    >
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
      <p className="font-semibold text-slate-900">
        No attendance records found
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or date filter.
      </p>
    </div>
  );
};

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
  );
};

export default AttendanceDetails;
