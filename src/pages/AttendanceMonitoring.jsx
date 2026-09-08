import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRefreshCw,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import api from "../lib/api";

const formatTimestamp = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

const studentName = (student) =>
  student
    ? [student.first_name, student.middle_name, student.last_name]
        .filter(Boolean)
        .join(" ")
    : "Unknown card";

const eventLabel = (type) =>
  String(type || "event")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AttendanceMonitoring() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);

    try {
      const response = await api.get("/api/attendance/logs", {
        params: { limit: 100 },
      });
      setLogs(response.data.logs || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load attendance monitoring events.",
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const timer = window.setInterval(() => loadLogs({ quiet: true }), 3000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadLogs]);

  const counts = useMemo(
    () => ({
      successful: logs.filter((log) => log.result === "success").length,
      rejected: logs.filter((log) => log.result === "rejected").length,
      checkIns: logs.filter((log) => log.event_type === "check_in").length,
      checkOuts: logs.filter((log) => log.event_type === "check_out").length,
    }),
    [logs],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-cyan-600">
              <FiActivity />
              <span className="text-xs font-bold uppercase tracking-[0.25em]">
                Live attendance feed
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold">Attendance Monitoring</h1>
            <p className="mt-1 text-sm text-slate-500">
              RFID and manual time-logger events refresh every three seconds.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((value) => !value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                autoRefresh
                  ? "border border-cyan-200 bg-cyan-50 text-cyan-700"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              Auto refresh {autoRefresh ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={() => loadLogs()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Successful",
              counts.successful,
              FiCheckCircle,
              "text-emerald-600",
              "bg-emerald-50",
            ],
            [
              "Rejected",
              counts.rejected,
              FiXCircle,
              "text-rose-600",
              "bg-rose-50",
            ],
            [
              "Check-ins",
              counts.checkIns,
              FiUser,
              "text-cyan-600",
              "bg-cyan-50",
            ],
            [
              "Check-outs",
              counts.checkOuts,
              FiClock,
              "text-blue-600",
              "bg-blue-50",
            ],
          ].map(([label, value, Icon, color, iconBackground]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBackground}`}
              >
                <Icon className={`text-xl ${color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {error && (
            <div className="border-b border-rose-200 bg-rose-50 p-4 text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-blue-100 bg-blue-50 text-xs uppercase tracking-wider text-blue-700">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">RFID</th>
                  <th className="px-5 py-4">Result</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-cyan-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{studentName(log.student)}</p>
                      <p className="text-xs text-slate-500">
                        {log.student?.student_no || "No student match"}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {eventLabel(log.event_type)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 font-mono text-slate-600">
                        <FiCreditCard /> {log.scanned_uid || "Manual"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          log.result === "success"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatTimestamp(log.scanned_at)}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-500">
                      {log.message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && logs.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No attendance events have been recorded yet.
            </div>
          )}
          {loading && logs.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              Loading attendance events…
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
