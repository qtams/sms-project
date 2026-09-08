import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import {
  FiBookOpen,
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

const rowsPerPageOptions = [8, 16, 24, 32];

const fallbackStudents = [
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
  {
    id: 5,
    studentId: "STD-0002",
    firstName: "Ana",
    middleName: "",
    lastName: "Santos",
    gradeLevel: "Grade 8",
    section: "B",
    teacherId: "TCH-0002",
    teacherName: "Buendia, Arvin",
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

const getClassName = (record) => {
  return `${record.gradeLevel} - ${record.section}`;
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

const formatLocalDate = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

const Attendance = () => {
  const navigate = useNavigate();

  const [assignedStudents, setAssignedStudents] = useState(fallbackStudents);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [teacherName, setTeacherName] = useState("Authorized staff");

  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("grid");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const assignedSections = useMemo(
    () => [...new Set(assignedStudents.map(getClassName))].sort(),
    [assignedStudents],
  );

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      try {
        const response = await api.get("/api/attendance", {
          params: { date: formatLocalDate(selectedDate) },
        });
        if (cancelled) return;

        const records = response.data.records || [];
        setAssignedStudents(records);
        setAttendanceRecords(
          records.map((record) => ({
            id: record.attendanceId,
            enrollmentId: record.enrollmentId,
            studentId: record.studentId,
            date: record.date,
            timeIn: record.timeIn,
            status: record.status,
          })),
        );
        setTeacherName(records.find((record) => record.teacherName)?.teacherName || "Authorized staff");
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load attendance:", error);
          toast.error(error.response?.data?.message || "Unable to load attendance records.");
        }
      }
    };

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const studentsWithAttendance = useMemo(() => {
    const selectedDateText = selectedDate ? formatLocalDate(selectedDate) : "";

    return assignedStudents.map((student) => {
      const attendance = attendanceRecords.find(
        (record) =>
          record.studentId === student.studentId &&
          record.date === selectedDateText,
      );

      return {
        ...student,
        attendanceId: attendance?.id || null,
        date: attendance?.date || selectedDateText,
        timeIn: attendance?.timeIn || "-",
        status: attendance?.status || "Absent",
      };
    });
  }, [assignedStudents, attendanceRecords, selectedDate]);

  const filteredRecords = useMemo(() => {
    return studentsWithAttendance.filter((record) => {
      const searchValue = searchTerm.toLowerCase();
      const recordClass = getClassName(record);

      const matchesSearch =
        getFullName(record).toLowerCase().includes(searchValue) ||
        getDisplayName(record).toLowerCase().includes(searchValue) ||
        record.studentId.toLowerCase().includes(searchValue) ||
        recordClass.toLowerCase().includes(searchValue);

      const matchesSection =
        sectionFilter === "All" || recordClass === sectionFilter;

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [studentsWithAttendance, searchTerm, sectionFilter, statusFilter]);

  const displayedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      return getDisplayName(a).localeCompare(getDisplayName(b));
    });
  }, [filteredRecords]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedRecords.length / rowsPerPage),
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRecords = displayedRecords.slice(startIndex, endIndex);

  const showingStart = displayedRecords.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, displayedRecords.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sectionFilter, statusFilter, selectedDate, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const presentCount = filteredRecords.filter(
    (record) => record.status === "Present",
  ).length;

  const absentCount = filteredRecords.filter(
    (record) => record.status === "Absent",
  ).length;

  const handleResetFilter = () => {
    setSearchTerm("");
    setSectionFilter("All");
    setStatusFilter("All");
    setSelectedDate(new Date());
    setCurrentPage(1);
  };

  const updateAttendanceStatus = async (record, nextStatus) => {
    const selectedDateText = formatLocalDate(selectedDate);

    const nextAttendance =
      nextStatus === "Present"
        ? {
            id: record.attendanceId || Date.now(),
            enrollmentId: record.enrollmentId,
            studentId: record.studentId,
            date: selectedDateText,
            timeIn: record.timeIn === "-" ? getManilaDateTime().time : record.timeIn,
            status: "Present",
          }
        : {
            id: record.attendanceId || Date.now(),
            enrollmentId: record.enrollmentId,
            studentId: record.studentId,
            date: selectedDateText,
            timeIn: "-",
            status: "Absent",
          };

    const response = await api.post("/api/attendance/records/status", {
      enrollment_id: record.enrollmentId,
      date: nextAttendance.date,
      status: nextStatus.toLowerCase(),
      reason: "Updated from the attendance management page.",
    });
    nextAttendance.id = response.data.record.id;

    setAttendanceRecords((current) => {
      const exists = current.some((item) => item.id === nextAttendance.id);

      const nextRecords = exists
        ? current.map((item) =>
            item.id === nextAttendance.id ? nextAttendance : item,
          )
        : [nextAttendance, ...current];

      return nextRecords;
    });

    toast.success(
      nextStatus === "Present"
        ? "Student marked present using Manila time."
        : "Student marked absent.",
    );
  };

  const handleView = async (record) => {
    navigate(`/attendance/${record.studentId}`);
  };

  const handleExport = async () => {
    const rows = displayedRecords.map((record) => ({
      date: record.date,
      studentId: record.studentId,
      name: getDisplayName(record),
      class: getClassName(record),
      teacher: record.teacherName,
      timeIn: record.timeIn,
      status: record.status,
    }));

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
    link.download = "teacher-attendance-export.csv";
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Attendance exported.");
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            My Class Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select your assigned section and mark students as present or absent.
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

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Teacher</p>
            <h2 className="text-xl font-semibold text-slate-950">
              {teacherName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Students are populated from the selected assigned section.
            </p>
          </div>

          <div className="rounded-md bg-cyan-50 px-4 py-3 text-cyan-700">
            <p className="text-xs font-medium">Assigned Sections</p>
            <p className="mt-1 text-sm font-semibold">
              {assignedSections.length} section(s)
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Students" value={filteredRecords.length} />
        <SummaryCard label="Present" value={presentCount} />
        <SummaryCard label="Absent" value={absentCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Section Attendance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Present uses current Manila date and time. Absent uses "-".
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

          <div className="grid gap-3 xl:grid-cols-[1fr_240px_180px_220px_auto]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student or ID..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All My Sections</option>
              {assignedSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>

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
                selected={selectedDate}
                onChange={setSelectedDate}
                placeholderText="Select date"
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
          <AttendanceGrid
            records={paginatedRecords}
            onView={handleView}
            onUpdateStatus={updateAttendanceStatus}
          />
        ) : (
          <AttendanceTable
            records={paginatedRecords}
            onView={handleView}
            onUpdateStatus={updateAttendanceStatus}
          />
        )}

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={displayedRecords.length}
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

const AttendanceGrid = ({ records, onView, onUpdateStatus }) => {
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
              title="View individual attendance"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-violet-50 px-3 text-xs font-medium text-violet-600 transition hover:bg-violet-600 hover:text-white"
            >
              <FiEye />
              View
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
                icon={<FiBookOpen />}
                label="Section"
                value={getClassName(record)}
              />

              <InfoRow
                icon={<FiCalendar />}
                label="Date"
                value={formatDate(record.date)}
              />

              <InfoRow
                icon={<FiClock />}
                label="Time In"
                value={record.timeIn}
              />

              <div className="flex items-end justify-start">
                <StatusBadge status={record.status} />
              </div>
            </div>

            <StatusActionButtons
              record={record}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AttendanceTable = ({ records, onView, onUpdateStatus }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <TableHeader label="Student" />
            <TableHeader label="Section" />
            <TableHeader label="Date" />
            <TableHeader label="Time In" />
            <TableHeader label="Status" />
            <TableHeader label="Set Attendance" />

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

                <td className="px-5 py-4 text-sm font-medium text-slate-600">
                  {getClassName(record)}
                </td>

                <td className="px-5 py-4 text-sm font-medium text-slate-600">
                  {formatDate(record.date)}
                </td>

                <td className="px-5 py-4">
                  <TimeText value={record.timeIn} />
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={record.status} />
                </td>

                <td className="px-5 py-4">
                  <StatusActionButtons
                    record={record}
                    onUpdateStatus={onUpdateStatus}
                    compact
                  />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onView(record)}
                      title="View individual attendance"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-violet-50 px-3 text-xs font-medium text-violet-600 transition hover:bg-violet-600 hover:text-white"
                    >
                      <FiEye />
                      View
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

const StatusActionButtons = ({ record, onUpdateStatus, compact = false }) => {
  return (
    <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "mt-3"}`}>
      <button
        type="button"
        onClick={() => onUpdateStatus(record, "Present")}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
          record.status === "Present"
            ? "bg-emerald-600 text-white"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
        }`}
      >
        <FiUserCheck />
        Present
      </button>

      <button
        type="button"
        onClick={() => onUpdateStatus(record, "Absent")}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
          record.status === "Absent"
            ? "bg-red-600 text-white"
            : "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
        }`}
      >
        <FiUserX />
        Absent
      </button>
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
        <span className="truncate">{value || "-"}</span>
      </div>
    </div>
  );
};

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
      <FiClock className="text-slate-400" />
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
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
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
      <p className="font-semibold text-slate-900">
        No attendance records found
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing the section, status, date, or search.
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
        .react-datepicker__day--keyboard-selected {
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

export default Attendance;
