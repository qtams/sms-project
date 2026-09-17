import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import {
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiHash,
} from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../../services/api";
import { Skeleton } from "../../components/skeleton";
import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { ViewButton } from "../../components/actions";

import "react-datepicker/dist/react-datepicker.css";

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
    const start = getDateValue(startDate);
    const end = getDateValue(endDate);

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

  const summaryItems = [
    {
      key: "students",
      label: "Students",
      value: latestStudentLogs.length,
    },
    {
      key: "complete",
      label: "Complete",
      value: completeCount,
    },
    {
      key: "time-in-only",
      label: "Time In Only",
      value: timeInOnlyCount,
    },
    {
      key: "no-tap",
      label: "No Tap",
      value: noTapCount,
    },
  ];

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
  ======================================================= */

  const handleExport = () => {
    if (isLoading) {
      return;
    }

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
  ======================================================= */

  const handleView = (record) => {
    if (!record.studentId) {
      toast.error("Student ID is missing.");

      return;
    }

    navigate(`/rfid/${encodeURIComponent(record.studentId)}`);
  };

  /* =======================================================
     DATA TABLE COLUMNS
  ======================================================= */

  const rfidColumns = [
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

            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
              <FiHash />
              {record.studentId || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "rfid",
      label: "RFID",
      render: (record) => <RfidText value={record.rfid} />,
    },
    {
      key: "class",
      label: "Class",
      render: (record) => (
        <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiBookOpen className="text-[#94a3b8]" />
          <span>
            {record.gradeLevel || "-"} - {record.section || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Latest Date",
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
      render: (record) => <TimeText value={record.timeIn || "-"} />,
    },
    {
      key: "timeOut",
      label: "Time Out",
      render: (record) => <TimeText value={record.timeOut || "-"} />,
    },
    {
      key: "status",
      label: "Status",
      render: (record) => <StatusBadge status={record.status} />,
    },
    {
      key: "action",
      label: "Action",
      render: (record) => (
        <ViewButton
          variant="table"
          label="View"
          onClick={() => handleView(record)}
        />
      ),
    },
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      data-aos="fade-up"
      className="space-y-5 [font-family:'Poppins',sans-serif]"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-medium text-slate-950">
                RFID Attendance
              </h1>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[12px] text-[#69768b] transition hover:border-[#01B8E5]/40 hover:text-[#01B8E5]"
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
          -> SummaryCards automatically renders SummarySkeleton
      =================================================== */}

      <SummaryCards columns={4} loading={isLoading} items={summaryItems} />

      {/* ===================================================
          DATA TABLE

          table mode + loading -> TableSkeleton
          cards mode + loading -> CardSkeleton
      =================================================== */}

      <DataTable
        title="Student RFID Summary"
        subtitle="View the latest RFID attendance summary per student."
        columns={rfidColumns}
        rows={paginatedLogs}
        rowKey="studentId"
        loading={isLoading}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search student, RFID, ID, class...",
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
              label: "Complete",
              value: "Complete",
            },
            {
              label: "Time In Only",
              value: "Time In Only",
            },
            {
              label: "No Tap",
              value: "No Tap",
            },
          ],
        }}
        extraFilters={
          <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-2">
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
          </div>
        }
        onReset={handleResetFilter}
        view={{
          mode: viewMode,
          onChange: setViewMode,
        }}
        renderCard={(record) => (
          <RfidCard record={record} onView={handleView} />
        )}
        pagination={{
          currentPage,
          totalPages,
          rowsPerPage,
          totalRows: displayedLogs.length,
          showingStart,
          showingEnd,
          onRowsPerPageChange: setRowsPerPage,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No RFID records found"
        emptyDescription="Try changing the search, status, or date range."
      />

      <DatePickerStyles />
    </div>
  );
};

/* =========================================================
   RFID CARD
========================================================= */

const RfidCard = ({ record, onView }) => {
  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#01B8E5]/30 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[12px] font-medium ring-2 ${getAvatarStyle(
                record.id,
              )}`}
            >
              {getInitials(record)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-slate-900">
                {getDisplayName(record)}
              </p>

              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
                <FiHash />
                {record.studentId || "-"}
              </p>
            </div>
          </div>

          <ViewButton label="View" onClick={() => onView(record)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoBox
            icon={<FiCreditCard />}
            label="RFID"
            value={record.rfid || "-"}
          />

          <InfoBox
            icon={<FiBookOpen />}
            label="Class"
            value={`${record.gradeLevel || "-"} - ${record.section || "-"}`}
          />

          <InfoBox
            icon={<FiCalendar />}
            label="Date"
            value={formatDate(record.date)}
          />

          <div className="rounded-md border border-slate-100 bg-white p-3">
            <p className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              Status
            </p>

            <div className="mt-2">
              <StatusBadge status={record.status} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <TimeBox label="Time In" value={record.timeIn || "-"} />
          <TimeBox label="Time Out" value={record.timeOut || "-"} />
        </div>

        <div className="mt-4">
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
    <div className="relative w-full xl:w-[220px]">
      <FiCalendar className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#94a3b8]" />

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
        wrapperClassName="w-full"
        className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-[12px] text-[#69768b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#01B8E5]"
      />
    </div>
  );
};

/* =========================================================
   INFO
========================================================= */

const InfoBox = ({ icon, label, value }) => {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-2 truncate text-[11px] text-[#69768b]">{value || "-"}</p>
    </div>
  );
};

/* =========================================================
   TIME / RFID TEXT
========================================================= */

const TimeBox = ({ label, value }) => {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-[10px] text-[#94a3b8]">{label}</p>

      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#69768b]">
        <FiClock className="shrink-0 text-[#01B8E5]" />
        {value}
      </p>
    </div>
  );
};

const TimeText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-[12px] text-[#69768b]">
      <FiClock className="text-[#94a3b8]" />
      {value}
    </div>
  );
};

const RfidText = ({ value }) => {
  return (
    <div className="inline-flex items-center gap-2 text-[12px] text-[#69768b]">
      <FiCreditCard className="text-[#94a3b8]" />
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
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] ${
        styles[currentStatus] || styles["No Tap"]
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[currentStatus] || dotStyles["No Tap"]
        }`}
      />

      {currentStatus}
    </span>
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
        .react-datepicker__day--keyboard-selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--in-selecting-range {
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

export default Rfid;
