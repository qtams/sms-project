import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../lib/api";

const USE_DUMMY_DATA = true;

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

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
    { id: 1, date: "2026-09-16", timeIn: "07:42 AM", status: "Present" },
    { id: 2, date: "2026-09-15", timeIn: "-", status: "Absent" },
    { id: 3, date: "2026-09-14", timeIn: "07:39 AM", status: "Present" },
    { id: 4, date: "2026-09-13", timeIn: "07:45 AM", status: "Present" },
    { id: 5, date: "2026-09-12", timeIn: "07:50 AM", status: "Present" },
    { id: 6, date: "2026-09-11", timeIn: "-", status: "Absent" },
    { id: 7, date: "2026-09-10", timeIn: "07:41 AM", status: "Present" },
  ],
});

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

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        if (USE_DUMMY_DATA) {
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          const data = buildDummyHistory(decodedStudentId, studentFromState);

          if (!cancelled) {
            setStudent(data.student);
            setRecords(data.records);
          }
          return;
        }

        const response = await api.get(
          `/api/attendance/students/${encodeURIComponent(decodedStudentId)}/history`,
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
        if (!cancelled) setIsLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [decodedStudentId, studentFromState]);

  const presentCount = useMemo(
    () => records.filter((record) => record.status === "Present").length,
    [records],
  );

  const absentCount = useMemo(
    () => records.filter((record) => record.status === "Absent").length,
    [records],
  );

  const attendanceRate = useMemo(() => {
    if (records.length === 0) return 0;
    return Math.round((presentCount / records.length) * 100);
  }, [records.length, presentCount]);

  const fullName = student
    ? [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
    : "Student";

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      <div>
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="mb-3 inline-flex items-center gap-2 text-[12px] text-[#94a3b8] transition hover:text-[#01B8E5]"
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

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Attendance Rate" value={`${attendanceRate}%`} />
        <SummaryCard label="Present" value={presentCount} />
        <SummaryCard label="Absent" value={absentCount} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[14px] font-medium text-[#69768b]">
            Attendance Records
          </p>
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-center text-[13px] text-[#94a3b8]">
            Loading attendance history...
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <TableHeader label="Date" />
                  <TableHeader label="Time In" />
                  <TableHeader label="Status" />
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id || `${record.date}-${record.status}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
                        <FiCalendar className="text-[#94a3b8]" />
                        {formatDate(record.date)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-[12px] text-[#69768b]">
                        <FiClock className="text-[#94a3b8]" />
                        {record.timeIn || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] text-[#69768b]">
              No attendance history found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="rounded-md bg-white p-4 shadow-sm">
    <p className="text-[12px] text-[#94a3b8]">{label}</p>
    <p className="mt-2 text-[20px] font-medium text-[#475569]">{value}</p>
  </div>
);

const TableHeader = ({ label }) => (
  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
    {label}
  </th>
);

const StatusBadge = ({ status }) => {
  const present = status === "Present";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] ${
        present
          ? "bg-[#01B8E5]/10 text-[#019BC2]"
          : "bg-slate-100 text-[#69768b]"
      }`}
    >
      {present ? <FiCheckCircle /> : <FiXCircle />}
      {status}
    </span>
  );
};

export default StudentAttendanceHistory;
