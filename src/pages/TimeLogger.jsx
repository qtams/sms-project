import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";

import spryIcon from "../assets/Spryicon.png";
import api from "../lib/api";

/* =========================================================
   CONFIG
========================================================= */

const SCAN_DEBOUNCE = 500;
const DUPLICATE_COOLDOWN = 30000;
const PROFILE_AUTO_HIDE = 5000;
const SCREENSAVER_DELAY = 15000;

/* =========================================================
   STUDENT DATA
========================================================= */

const EMPTY_STUDENT = {
  student_id: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  academic_level: "",
  level: "",
  course: "",
  email: "",
  student_profile: "",
  status: "",
  rfid: "",
  monitoring_action: "",
  monitoring_message: "",
  monitoring_timestamp: "",
  monitoring_duration: "",
  monitoring_action_display: "",
};

/* =========================================================
   UI STATE
========================================================= */

const initialUIState = {
  studentIdModal: false,
  profileModal: false,

  loading: false,

  cooldownVisible: false,
  cooldownSeconds: 0,
  cooldownKey: "",

  screensaver: false,
};

const ACTION = {
  OPEN_STUDENT_MODAL: "OPEN_STUDENT_MODAL",
  CLOSE_STUDENT_MODAL: "CLOSE_STUDENT_MODAL",

  SHOW_PROFILE: "SHOW_PROFILE",
  HIDE_PROFILE: "HIDE_PROFILE",

  START_LOADING: "START_LOADING",
  STOP_LOADING: "STOP_LOADING",

  SHOW_COOLDOWN: "SHOW_COOLDOWN",
  HIDE_COOLDOWN: "HIDE_COOLDOWN",
  UPDATE_COOLDOWN: "UPDATE_COOLDOWN",

  SHOW_SCREENSAVER: "SHOW_SCREENSAVER",
  HIDE_SCREENSAVER: "HIDE_SCREENSAVER",
};

function uiReducer(state, action) {
  switch (action.type) {
    case ACTION.OPEN_STUDENT_MODAL:
      return {
        ...state,
        studentIdModal: true,
        screensaver: false,
      };

    case ACTION.CLOSE_STUDENT_MODAL:
      return {
        ...state,
        studentIdModal: false,
      };

    case ACTION.SHOW_PROFILE:
      return {
        ...state,
        profileModal: true,
        studentIdModal: false,
        screensaver: false,
      };

    case ACTION.HIDE_PROFILE:
      return {
        ...state,
        profileModal: false,
      };

    case ACTION.START_LOADING:
      return {
        ...state,
        loading: true,
        screensaver: false,
      };

    case ACTION.STOP_LOADING:
      return {
        ...state,
        loading: false,
      };

    case ACTION.SHOW_COOLDOWN:
      return {
        ...state,
        cooldownVisible: true,
        cooldownSeconds: action.seconds,
        cooldownKey: action.key,
        screensaver: false,
      };

    case ACTION.HIDE_COOLDOWN:
      return {
        ...state,
        cooldownVisible: false,
      };

    case ACTION.UPDATE_COOLDOWN:
      return {
        ...state,
        cooldownSeconds: action.seconds,
      };

    case ACTION.SHOW_SCREENSAVER:
      return {
        ...state,
        screensaver: true,
      };

    case ACTION.HIDE_SCREENSAVER:
      return {
        ...state,
        screensaver: false,
      };

    default:
      return state;
  }
}

/* =========================================================
   ICONS
========================================================= */

function UserIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />

      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyboardIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 13h.01M10 13h.01M13 13h4M8 16h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignalIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5.5 9.5a9.3 9.3 0 0 1 13 0M8.7 12.7a4.7 4.7 0 0 1 6.6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

/* =========================================================
   RFID CARD SCAN ANIMATION
========================================================= */

function RFIDScannerVisual() {
  return (
    <div className="relative mx-auto h-[275px] w-full max-w-[500px]">
      <div className="absolute left-1/2 top-1/2 h-[225px] w-[380px] -translate-x-1/2 -translate-y-1/2">
        {/* SCANNER CORNERS */}

        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-[#0089BC]/40" />

        <div className="absolute right-0 top-0 h-10 w-10 border-r-2 border-t-2 border-[#0089BC]/40" />

        <div className="absolute bottom-0 left-0 h-10 w-10 border-b-2 border-l-2 border-[#0089BC]/40" />

        <div className="absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 border-[#0089BC]/40" />

        {/* CARD SHADOW */}

        <motion.div
          animate={{
            opacity: [0.08, 0.16, 0.16, 0.08],
            scale: [0.9, 1, 1, 0.9],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[4px] left-1/2 h-5 w-[250px] -translate-x-1/2 rounded-[50%] bg-slate-950 blur-xl"
        />

        {/* STUDENT CARD */}

        <motion.div
          animate={{
            y: [-12, 10, 10, -12],
            rotateZ: [-1, 0, 0, -1],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.68, 1],
          }}
          className="absolute left-1/2 top-1/2 h-[182px] w-[305px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.14)]"
        >
          {/* BRAND STRIPE */}

          <div className="absolute left-0 top-0 z-20 flex h-[4px] w-full">
            <div className="w-[32%] bg-[#FD8901]" />
            <div className="w-[34%] bg-[#04BDE8]" />
            <div className="w-[34%] bg-[#0089BC]" />
          </div>

          <div className="flex h-full pt-[4px]">
            {/* PHOTO */}

            <div className="relative flex w-[96px] shrink-0 items-center justify-center border-r border-slate-100 bg-[#f5f7f8]">
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border border-slate-200 bg-white text-[#286C8E]">
                <UserIcon className="h-7 w-7" />
              </div>

              <div className="absolute bottom-0 left-0 h-[4px] w-full bg-[#04BDE8]" />
            </div>

            {/* CARD INFORMATION */}

            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <img src={spryIcon} alt="" className="h-8 w-8 object-contain" />

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#286C8E]">
                    Student ID
                  </div>

                  <div className="mt-0.5 text-[7px] text-slate-400">
                    Identification Card
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="h-2.5 w-[120px] rounded-full bg-slate-200" />

                <div className="mt-2 h-2 w-[88px] rounded-full bg-slate-100" />

                <div className="mt-2 h-2 w-[103px] rounded-full bg-slate-100" />
              </div>

              <div className="mt-auto flex items-end justify-between">
                <div className="font-mono text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                  2026 • 0000001
                </div>

                <div className="h-7 w-7 rounded-full border-[5px] border-[#FD8901]/15 border-r-[#FD8901]" />
              </div>
            </div>
          </div>

          {/* SCAN GLOW */}

          <motion.div
            animate={{
              y: [-60, 185, -60],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute left-0 top-0 z-20 h-16 w-full bg-gradient-to-b from-transparent via-[#04BDE8]/10 to-transparent"
          />

          {/* SCAN LINE */}

          <motion.div
            animate={{
              y: [-2, 180, -2],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute left-0 top-0 z-30 h-[2px] w-full bg-[#FD8901] shadow-[0_0_8px_rgba(253,137,1,0.4)]"
          />
        </motion.div>

        {/* LEFT RFID SIGNAL */}

        <motion.div
          animate={{
            opacity: [0, 0.3, 0],
            scale: [0.7, 1, 1.35],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute left-[6px] top-1/2 h-[100px] w-[100px] -translate-y-1/2 rounded-full border border-[#04BDE8]/35"
        />

        <motion.div
          animate={{
            opacity: [0, 0.18, 0],
            scale: [0.7, 1.2, 1.6],
          }}
          transition={{
            duration: 2,
            delay: 0.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute left-[6px] top-1/2 h-[100px] w-[100px] -translate-y-1/2 rounded-full border border-[#0089BC]/25"
        />

        {/* RIGHT RFID SIGNAL */}

        <motion.div
          animate={{
            opacity: [0, 0.3, 0],
            scale: [0.7, 1, 1.35],
          }}
          transition={{
            duration: 2,
            delay: 0.15,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute right-[6px] top-1/2 h-[100px] w-[100px] -translate-y-1/2 rounded-full border border-[#04BDE8]/35"
        />

        <motion.div
          animate={{
            opacity: [0, 0.18, 0],
            scale: [0.7, 1.2, 1.6],
          }}
          transition={{
            duration: 2,
            delay: 0.55,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute right-[6px] top-1/2 h-[100px] w-[100px] -translate-y-1/2 rounded-full border border-[#0089BC]/25"
        />

        {/* STATUS */}

        <div className="absolute -bottom-9 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <motion.span
              animate={{
                opacity: [0.45, 0, 0.45],
                scale: [1, 2, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-full bg-[#04BDE8]"
            />

            <span className="relative h-2 w-2 rounded-full bg-[#0089BC]" />
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#286C8E]">
            Ready to scan
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TimeLogger() {
  const [ui, dispatch] = useReducer(uiReducer, initialUIState);

  const [rfid, setRfid] = useState("");
  const [studentId, setStudentId] = useState("");

  const [student, setStudent] = useState(EMPTY_STUDENT);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  const rfidInputRef = useRef(null);
  const studentIdInputRef = useRef(null);

  const rfidDebounceRef = useRef(null);
  const autoHideTimerRef = useRef(null);
  const cooldownMessageTimerRef = useRef(null);
  const screensaverTimerRef = useRef(null);

  const cooldownMapRef = useRef({});

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const fullName = useMemo(() => {
    return (
      [student.first_name, student.middle_name, student.last_name]
        .filter(Boolean)
        .join(" ")
        .toUpperCase() || "N/A"
    );
  }, [student.first_name, student.middle_name, student.last_name]);

  const initials = useMemo(() => {
    const first = student.first_name?.charAt(0) || "";
    const last = student.last_name?.charAt(0) || "";

    return `${first}${last}` || "ST";
  }, [student.first_name, student.last_name]);

  const dateText = useMemo(() => {
    return currentTime
      .toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  }, [currentTime]);

  const timeText = useMemo(() => {
    return currentTime
      .toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  }, [currentTime]);

  const profileImageUrl = useMemo(() => {
    const photo = student.student_profile;

    if (!photo || photo.trim() === "" || photo === "null") {
      return "";
    }

    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      return photo;
    }

    if (photo.startsWith("images/")) {
      return `/admission-management-system/${photo}`;
    }

    return `/admission-management-system/images/StudentPhoto/${photo}`;
  }, [student.student_profile]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const normalizeStudent = useCallback((data = {}) => {
    return {
      ...EMPTY_STUDENT,
      ...data,

      first_name: data.first_name ?? "",
      middle_name: data.middle_name ?? "",
      last_name: data.last_name ?? "",

      academic_level: data.academic_level ?? "",
      level: data.level ?? "",
      course: data.course ?? "",

      email: data.email ?? "",
      student_profile: data.student_profile ?? "",

      status: data.status ?? "",
      rfid: data.rfid ?? "",
      student_id: data.student_id ?? "",
    };
  }, []);

  const cleanRFID = useCallback((value) => {
    return value.replace(/[^a-zA-Z0-9]/g, "");
  }, []);

  const focusRFID = useCallback(() => {
    window.requestAnimationFrame(() => {
      rfidInputRef.current?.focus();
    });
  }, []);

  /* =========================================================
     ALERT
  ========================================================= */

  const showAlert = useCallback((icon, title, text) => {
    Swal.close();

    Swal.fire({
      icon,
      title,
      text,

      showConfirmButton: false,

      timer: 3000,
      timerProgressBar: true,

      background: "#ffffff",
      color: "#111827",

      customClass: {
        popup: "rounded-xl border border-slate-200 shadow-xl",
        title: "text-xl font-semibold text-slate-900",
        htmlContainer: "text-sm text-slate-500",
      },
    });
  }, []);

  /* =========================================================
     RESET STUDENT
  ========================================================= */

  const resetStudent = useCallback(() => {
    setStudent(EMPTY_STUDENT);

    dispatch({
      type: ACTION.HIDE_PROFILE,
    });

    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);

      autoHideTimerRef.current = null;
    }
  }, []);

  /* =========================================================
     SCREENSAVER
  ========================================================= */

  const resetScreensaver = useCallback(() => {
    dispatch({
      type: ACTION.HIDE_SCREENSAVER,
    });

    if (screensaverTimerRef.current) {
      clearTimeout(screensaverTimerRef.current);
    }

    screensaverTimerRef.current = setTimeout(() => {
      dispatch({
        type: ACTION.SHOW_SCREENSAVER,
      });
    }, SCREENSAVER_DELAY);
  }, []);

  /* =========================================================
     COOLDOWN
  ========================================================= */

  const showCooldown = useCallback((key) => {
    const expiresAt = cooldownMapRef.current[key];

    if (!expiresAt) return;

    const seconds = Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0);

    dispatch({
      type: ACTION.SHOW_COOLDOWN,
      key,
      seconds,
    });

    if (cooldownMessageTimerRef.current) {
      clearTimeout(cooldownMessageTimerRef.current);
    }

    cooldownMessageTimerRef.current = setTimeout(() => {
      dispatch({
        type: ACTION.HIDE_COOLDOWN,
      });
    }, 3000);
  }, []);

  const isCoolingDown = useCallback(
    (key) => {
      const expiresAt = cooldownMapRef.current[key];

      if (!expiresAt || expiresAt <= Date.now()) {
        return false;
      }

      showCooldown(key);

      return true;
    },
    [showCooldown],
  );

  const createCooldown = useCallback((key) => {
    cooldownMapRef.current[key] = Date.now() + DUPLICATE_COOLDOWN;
  }, []);

  /* =========================================================
     MONITORING API
  ========================================================= */

  const addToMonitoringTable = useCallback(
    async (studentNumber, rfidValue) => {
      const response = rfidValue
        ? await api.post("/api/attendance/scan", { rfid_uid: rfidValue })
        : await api.post("/api/attendance/manual", {
            student_no: studentNumber,
          });

      return response.data;
    },
    [],
  );

  /* =========================================================
     EMAIL
  ========================================================= */

  const sendEmail = useCallback(async (rfidValue, email) => {
    try {
      const response = await fetch("send-email.php", {
        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          rfid: rfidValue,
          email,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Email send failed:", result.message);
      }
    } catch (error) {
      console.error("Email send error:", error);
    }
  }, []);

  /* =========================================================
     SHOW ATTENDANCE
  ========================================================= */

  const displayAttendance = useCallback(
    (foundStudent, response) => {
      setStudent({
        ...foundStudent,

        monitoring_action: response.action,

        monitoring_message: response.message,

        monitoring_timestamp: response.timestamp || "",

        monitoring_duration: response.duration?.formatted || "",

        monitoring_action_display:
          response.action === "check-in" ? "Checked In" : "Checked Out",
      });

      dispatch({
        type: ACTION.SHOW_PROFILE,
      });

      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }

      autoHideTimerRef.current = setTimeout(() => {
        resetStudent();

        focusRFID();
      }, PROFILE_AUTO_HIDE);
    },
    [focusRFID, resetStudent],
  );

  /* =========================================================
     RECORD ATTENDANCE
  ========================================================= */

  const recordAttendance = useCallback(
    async ({ cooldownKey, scannedRFID = "", studentNumber = "" }) => {
      if (isCoolingDown(cooldownKey)) {
        return;
      }

      try {
        const monitoringResponse = await addToMonitoringTable(
          studentNumber,
          scannedRFID,
        );
        const foundStudent = normalizeStudent(monitoringResponse.student);

        if (!monitoringResponse.success) {
          resetStudent();

          showAlert(
            "error",
            "Monitoring Error",
            monitoringResponse.message || "Unable to record attendance.",
          );

          return;
        }

        createCooldown(cooldownKey);

        displayAttendance(foundStudent, monitoringResponse);

        if (scannedRFID && foundStudent.email) {
          sendEmail(scannedRFID, foundStudent.email);
        }
      } catch (error) {
        console.error("Attendance error:", error);

        resetStudent();

        if (error.response?.data?.code === "duplicate_scan") {
          cooldownMapRef.current[cooldownKey] =
            Date.now() +
            (error.response.data.cooldown_seconds || 30) * 1000;
          showCooldown(cooldownKey);
          return;
        }

        showAlert(
          "error",
          error.response?.status === 404 ? "Student Not Found" : "Monitoring Error",
          error.response?.data?.message ||
            "Unable to record attendance. Please try again.",
        );
      }
    },
    [
      addToMonitoringTable,
      createCooldown,
      displayAttendance,
      isCoolingDown,
      normalizeStudent,
      resetStudent,
      sendEmail,
      showAlert,
      showCooldown,
    ],
  );

  /* =========================================================
     RFID LOOKUP
  ========================================================= */

  const getStudentByRFID = useCallback(
    async (rawRFID) => {
      if (ui.loading) return;

      const scannedRFID = cleanRFID(rawRFID);

      setRfid("");

      focusRFID();

      if (scannedRFID.length < 8) {
        return;
      }

      dispatch({
        type: ACTION.START_LOADING,
      });

      try {
        await recordAttendance({
          cooldownKey: scannedRFID,
          scannedRFID,
        });
      } catch (error) {
        console.error("RFID lookup error:", error);

        resetStudent();

        showAlert(
          "error",
          "Network Error",
          "Unable to retrieve student information.",
        );
      } finally {
        dispatch({
          type: ACTION.STOP_LOADING,
        });
      }
    },
    [
      cleanRFID,
      focusRFID,
      recordAttendance,
      resetStudent,
      showAlert,
      ui.loading,
    ],
  );

  /* =========================================================
     STUDENT NUMBER LOOKUP
  ========================================================= */

  const getStudentByID = useCallback(async () => {
    if (ui.loading || studentId.length !== 11) {
      return;
    }

    const inputId = studentId.trim();

    setStudentId("");

    dispatch({
      type: ACTION.CLOSE_STUDENT_MODAL,
    });

    focusRFID();

    dispatch({
      type: ACTION.START_LOADING,
    });

    try {
      await recordAttendance({
        cooldownKey: inputId,
        studentNumber: inputId,
      });
    } catch (error) {
      console.error("Student lookup error:", error);

      resetStudent();

      showAlert(
        "error",
        "Network Error",
        "Unable to retrieve student information.",
      );
    } finally {
      dispatch({
        type: ACTION.STOP_LOADING,
      });
    }
  }, [
    focusRFID,
    recordAttendance,
    resetStudent,
    showAlert,
    studentId,
    ui.loading,
  ]);

  /* =========================================================
     RFID INPUT
  ========================================================= */

  const handleRFIDChange = useCallback(
    (event) => {
      const value = event.target.value;

      setRfid(value);

      if (rfidDebounceRef.current) {
        clearTimeout(rfidDebounceRef.current);
      }

      if (value.length >= 8) {
        rfidDebounceRef.current = setTimeout(() => {
          getStudentByRFID(value);
        }, SCAN_DEBOUNCE);
      }
    },
    [getStudentByRFID],
  );

  /* =========================================================
     STUDENT NUMBER MODAL
  ========================================================= */

  const openStudentModal = useCallback(() => {
    setStudentId("");

    dispatch({
      type: ACTION.OPEN_STUDENT_MODAL,
    });

    setTimeout(() => {
      studentIdInputRef.current?.focus();
    }, 80);
  }, []);

  const closeStudentModal = useCallback(() => {
    setStudentId("");

    dispatch({
      type: ACTION.CLOSE_STUDENT_MODAL,
    });

    focusRFID();
  }, [focusRFID]);

  /* =========================================================
     CLOCK
  ========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =========================================================
     COOLDOWN TIMER
  ========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      Object.keys(cooldownMapRef.current).forEach((key) => {
        if (cooldownMapRef.current[key] <= now) {
          delete cooldownMapRef.current[key];
        }
      });

      if (ui.cooldownKey && cooldownMapRef.current[ui.cooldownKey]) {
        const seconds = Math.max(
          Math.ceil((cooldownMapRef.current[ui.cooldownKey] - now) / 1000),
          0,
        );

        dispatch({
          type: ACTION.UPDATE_COOLDOWN,
          seconds,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ui.cooldownKey]);

  /* =========================================================
     SCREENSAVER ACTIVITY
  ========================================================= */

  useEffect(() => {
    resetScreensaver();

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart"];

    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, resetScreensaver);
    });

    return () => {
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, resetScreensaver);
      });
    };
  }, [resetScreensaver]);

  /* =========================================================
     KEYBOARD
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === "Tab" &&
        !ui.studentIdModal &&
        !ui.profileModal &&
        !ui.loading
      ) {
        event.preventDefault();

        openStudentModal();
      }

      if (event.key === "Escape" && ui.studentIdModal) {
        closeStudentModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    closeStudentModal,
    openStudentModal,
    ui.loading,
    ui.profileModal,
    ui.studentIdModal,
  ]);

  /* =========================================================
     KEEP RFID INPUT READY
  ========================================================= */

  useEffect(() => {
    const handleMouseDown = () => {
      if (!ui.studentIdModal && !ui.profileModal) {
        focusRFID();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [focusRFID, ui.profileModal, ui.studentIdModal]);

  /* =========================================================
     INITIALIZE
  ========================================================= */

  useEffect(() => {
    focusRFID();

    return () => {
      if (rfidDebounceRef.current) {
        clearTimeout(rfidDebounceRef.current);
      }

      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }

      if (cooldownMessageTimerRef.current) {
        clearTimeout(cooldownMessageTimerRef.current);
      }

      if (screensaverTimerRef.current) {
        clearTimeout(screensaverTimerRef.current);
      }
    };
  }, [focusRFID]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f5f6f7] text-slate-900">
      {/* HIDDEN RFID INPUT */}

      <input
        ref={rfidInputRef}
        type="text"
        value={rfid}
        onChange={handleRFIDChange}
        autoFocus
        aria-label="RFID Scanner"
        className="fixed -left-[9999px] top-0 h-px w-px opacity-0"
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex h-[88px] items-center justify-between border-b border-slate-200 bg-white px-10 xl:px-14">
        <div className="flex items-center gap-4">
          <img src={spryIcon} alt="Spry" className="h-12 w-12 object-contain" />

          <div className="h-9 w-px bg-slate-200" />

          <div>
            <div className="text-[16px] font-semibold tracking-[-0.01em] text-slate-900">
              Student Time Logger
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              RFID reader connected
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {dateText}
          </div>

          <div className="mt-1 text-[23px] font-semibold tabular-nums tracking-[-0.02em] text-slate-950">
            {timeText}
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="flex h-[calc(100vh-88px)] items-center justify-center px-8 py-8 xl:px-12">
        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="grid h-[min(720px,calc(100vh-130px))] w-full max-w-[1280px] grid-cols-[1fr_370px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
        >
          {/* =================================================
              SCANNER AREA
          ================================================= */}

          <div className="relative flex min-h-0 items-center justify-center px-14 py-10 xl:px-20">
            {/* BRAND TOP LINE */}

            <div className="absolute left-0 top-0 flex h-[4px] w-full">
              <div className="w-[28%] bg-[#FD8901]" />
              <div className="w-[36%] bg-[#04BDE8]" />
              <div className="flex-1 bg-[#0089BC]" />
            </div>

            <div className="w-full max-w-[690px] text-center">
              {/* CARD SCANNING ANIMATION */}

              <RFIDScannerVisual />

              <h1 className="mt-7 text-[40px] font-semibold tracking-[-0.045em] text-slate-950">
                Tap your school ID
              </h1>

              <p className="mx-auto mt-3 max-w-[500px] text-[15px] leading-7 text-slate-500">
                Place your RFID card near the reader and hold it steady until
                your attendance confirmation appears.
              </p>

              {/* WAITING */}

              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#04BDE8]/20 bg-[#04BDE8]/[0.06] px-4 py-2.5 text-xs font-semibold text-[#286C8E]">
                  <span className="relative flex h-2 w-2">
                    <motion.span
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.4, 0, 0.4],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 rounded-full bg-[#04BDE8]"
                    />

                    <span className="relative h-2 w-2 rounded-full bg-[#0089BC]" />
                  </span>
                  Waiting for RFID card
                </div>
              </div>

              {/* DIVIDER */}

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* MANUAL ENTRY */}

              <button
                type="button"
                onClick={openStudentModal}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition duration-200 hover:border-[#0089BC]/35 hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0089BC]/[0.07] text-[#286C8E]">
                    <UserIcon />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Enter Student Number
                    </div>

                    <div className="mt-0.5 text-xs text-slate-400">
                      Manual attendance entry
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500">
                  <KeyboardIcon />
                  TAB
                </div>
              </button>
            </div>
          </div>

          {/* =================================================
              INSTRUCTIONS
          ================================================= */}

          <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-[#fafafa] p-9">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#286C8E]">
                How to use
              </div>

              <div className="mt-9 space-y-8">
                {[
                  {
                    number: "01",
                    title: "Present your ID",
                    text: "Place your school RFID card near the reader.",
                  },
                  {
                    number: "02",
                    title: "Hold steady",
                    text: "Wait briefly while the system verifies your student record.",
                  },
                  {
                    number: "03",
                    title: "View confirmation",
                    text: "Your check-in or check-out details will appear automatically.",
                  },
                ].map((item) => (
                  <div key={item.number} className="flex gap-4">
                    <div className="pt-0.5 font-mono text-xs font-bold text-[#FD8901]">
                      {item.number}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SYSTEM */}

            <div className="mt-auto border-t border-slate-200 pt-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0089BC]/[0.08] text-[#0089BC]">
                  <SignalIcon />
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    System ready
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The RFID reader is online and ready to accept your card.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </motion.section>
      </main>

      {/* =====================================================
          STUDENT NUMBER MODAL
      ===================================================== */}

      <AnimatePresence>
        {ui.studentIdModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-8 backdrop-blur-[3px]"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.98,
                y: 14,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: 8,
              }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-[520px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
            >
              <div className="flex h-[4px]">
                <div className="w-1/3 bg-[#FD8901]" />
                <div className="w-1/3 bg-[#04BDE8]" />
                <div className="w-1/3 bg-[#0089BC]" />
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[23px] font-semibold tracking-[-0.025em] text-slate-950">
                      Student Number
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Enter the student's 11-digit student number.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0089BC]/[0.08] text-[#286C8E]">
                    <UserIcon className="h-6 w-6" />
                  </div>
                </div>

                <input
                  ref={studentIdInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={studentId}
                  placeholder="Enter student number"
                  onChange={(event) =>
                    setStudentId(
                      event.target.value.replace(/\D/g, "").slice(0, 11),
                    )
                  }
                  onKeyDown={(event) => {
                    event.stopPropagation();

                    if (event.key === "Enter" && studentId.length === 11) {
                      getStudentByID();
                    }
                  }}
                  className="mt-8 w-full rounded-xl border border-slate-200 bg-white px-5 py-4 font-mono text-xl font-semibold tracking-[0.08em] text-slate-900 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300 focus:border-[#0089BC] focus:ring-4 focus:ring-[#04BDE8]/10"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>Press Enter to continue</span>

                  <span>{studentId.length}/11</span>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeStudentModal}
                    className="rounded-lg px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={studentId.length !== 11}
                    onClick={getStudentByID}
                    className="rounded-lg bg-[#0089BC] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#286C8E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          ATTENDANCE RESULT MODAL
      ===================================================== */}

      <AnimatePresence>
        {ui.profileModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-8 backdrop-blur-[4px]"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.97,
                y: 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: 10,
              }}
              transition={{
                duration: 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="grid h-[min(660px,84vh)] w-full max-w-[1220px] grid-cols-[430px_1fr] overflow-hidden rounded-[18px] bg-white shadow-[0_35px_100px_rgba(15,23,42,0.32)]"
            >
              {/* =================================================
                  STUDENT IMAGE
              ================================================= */}

              <div className="relative overflow-hidden bg-[#eef2f4]">
                {/* INITIALS FALLBACK */}

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full border border-slate-200 bg-white text-5xl font-semibold tracking-[-0.04em] text-[#286C8E]/35">
                    {initials}
                  </div>
                </div>

                {/* REAL IMAGE */}

                {profileImageUrl && (
                  <img
                    src={profileImageUrl}
                    alt={fullName}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {/* BOTTOM INFO */}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent px-9 pb-9 pt-28">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Student Number
                  </div>

                  <div className="mt-2 font-mono text-[25px] font-semibold tracking-[0.08em] text-white">
                    {student.student_id || "N/A"}
                  </div>
                </div>
              </div>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <div className="relative flex min-h-0 flex-col p-11 xl:p-12">
                {/* COLOR ACCENT */}

                <div className="absolute left-0 top-0 flex h-[4px] w-full">
                  <div className="w-[28%] bg-[#FD8901]" />
                  <div className="w-[36%] bg-[#04BDE8]" />
                  <div className="flex-1 bg-[#0089BC]" />
                </div>

                {/* STATUS */}

                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                      student.monitoring_action === "check-in"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        student.monitoring_action === "check-in"
                          ? "bg-emerald-500"
                          : "bg-sky-500"
                      }`}
                    />

                    {student.monitoring_action_display}
                  </div>

                  <span className="text-xs text-slate-400">
                    Closes automatically in 5 seconds
                  </span>
                </div>

                {/* NAME */}

                <div className="mt-9">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#286C8E]">
                    Student
                  </div>

                  <h2 className="mt-3 text-[44px] font-semibold leading-[1.06] tracking-[-0.045em] text-slate-950">
                    {fullName}
                  </h2>
                </div>

                {/* DETAILS GRID */}

                <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-9 border-y border-slate-100 py-9">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Department
                    </div>

                    <div className="mt-2 text-[17px] font-semibold text-slate-800">
                      {student.academic_level || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Year Level
                    </div>

                    <div className="mt-2 text-[17px] font-semibold text-slate-800">
                      {student.level || "N/A"}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Course & Section
                    </div>

                    <div className="mt-2 text-[17px] font-semibold text-slate-800">
                      {student.course || "N/A"}
                    </div>
                  </div>
                </div>

                {/* ATTENDANCE RESULT */}

                {student.monitoring_message && (
                  <div className="mt-auto pt-9">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                          student.monitoring_action === "check-in"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-[#0089BC]/[0.08] text-[#0089BC]"
                        }`}
                      >
                        <CheckIcon className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="text-[15px] font-semibold text-slate-800">
                          {student.monitoring_message}
                        </div>

                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                          <span>{student.monitoring_timestamp}</span>

                          {student.monitoring_duration && (
                            <>
                              <span>•</span>

                              <span>
                                Duration: {student.monitoring_duration}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          LOADING
      ===================================================== */}

      <AnimatePresence>
        {ui.loading && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-white/75 backdrop-blur-[3px]"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-xl"
            >
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#0089BC]" />

              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Verifying student
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Please keep your card near the reader.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          COOLDOWN MESSAGE
      ===================================================== */}

      <AnimatePresence>
        {ui.cooldownVisible && (
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
              x: "-50%",
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: "-50%",
            }}
            exit={{
              opacity: 0,
              y: 10,
              x: "-50%",
            }}
            className="fixed bottom-7 left-1/2 z-[70] rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-xl"
          >
            Attendance already recorded. Try again in{" "}
            <span className="font-semibold">{ui.cooldownSeconds}s</span>.
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          SCREENSAVER
      ===================================================== */}

      <AnimatePresence>
        {ui.screensaver &&
          !ui.studentIdModal &&
          !ui.profileModal &&
          !ui.loading &&
          !ui.cooldownVisible && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.4,
              }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f5f6f7]"
            >
              <div className="text-center">
                <img
                  src={spryIcon}
                  alt="Spry"
                  className="mx-auto h-20 w-20 object-contain"
                />

                <div className="mt-10 text-[74px] font-semibold tracking-[-0.055em] tabular-nums text-slate-950">
                  {timeText}
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {dateText}
                </div>

                <div className="mx-auto mt-10 flex h-[3px] w-20 overflow-hidden">
                  <div className="w-1/3 bg-[#FD8901]" />
                  <div className="w-1/3 bg-[#04BDE8]" />
                  <div className="w-1/3 bg-[#0089BC]" />
                </div>

                <p className="mt-7 text-sm text-slate-400">
                  Tap your school ID or press any key to continue
                </p>
              </div>

              <div className="absolute bottom-9 left-10 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                RFID reader connected
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
