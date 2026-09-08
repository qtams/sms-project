import { useCallback, useEffect, useReducer, useRef } from "react";

import { useNavigate } from "react-router-dom";

import {
  FiCheck,
  FiClock,
  FiCreditCard,
  FiLogOut,
  FiUser,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import SpryLogo from "../assets/Sprylogo.webp";
import SprytechIcon from "../assets/Sprytechicon.webp";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const API_BASE = import.meta.env.VITE_ATTENDANCE_API_URL || "";

const DEFAULT_PROFILE =
  "/attendance-monitoring-system/images/Profile/defaultProfile.jpg";

const RFID_MIN_LENGTH = 8;
const STUDENT_ID_LENGTH = 11;

const SCAN_DEBOUNCE = 500;
const COOLDOWN_TIME = 30_000;
const PROFILE_HIDE_TIME = 5_000;
const SCREENSAVER_TIME = 15_000;
const ALERT_TIME = 3_000;

/*
|--------------------------------------------------------------------------
| EMPTY STUDENT
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  rfid: "",
  studentId: "",

  student: EMPTY_STUDENT,

  showProfileModal: false,
  showStudentIdModal: false,

  isLoading: false,

  showCooldownMessage: false,
  cooldownSecondsLeft: 0,
  cooldownStudentId: "",

  showSaver: false,

  alert: null,

  currentDate: "",
  currentTime: "",
};

/*
|--------------------------------------------------------------------------
| REDUCER
|--------------------------------------------------------------------------
*/

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_RFID":
      return {
        ...state,
        rfid: action.payload,
      };

    case "SET_STUDENT_ID":
      return {
        ...state,
        studentId: action.payload,
      };

    case "SET_STUDENT":
      return {
        ...state,
        student: action.payload,
      };

    case "RESET_STUDENT":
      return {
        ...state,
        student: EMPTY_STUDENT,
        showProfileModal: false,
      };

    case "SET_PROFILE_MODAL":
      return {
        ...state,
        showProfileModal: action.payload,
      };

    case "SET_STUDENT_ID_MODAL":
      return {
        ...state,
        showStudentIdModal: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SHOW_ALERT":
      return {
        ...state,
        alert: action.payload,
      };

    case "HIDE_ALERT":
      return {
        ...state,
        alert: null,
      };

    case "SHOW_COOLDOWN":
      return {
        ...state,
        showCooldownMessage: true,
        cooldownStudentId: action.payload.id,
        cooldownSecondsLeft: action.payload.seconds,
      };

    case "UPDATE_COOLDOWN":
      return {
        ...state,
        cooldownSecondsLeft: action.payload,
      };

    case "HIDE_COOLDOWN":
      return {
        ...state,
        showCooldownMessage: false,
      };

    case "SET_SAVER":
      return {
        ...state,
        showSaver: action.payload,
      };

    case "SET_DATE_TIME":
      return {
        ...state,
        currentDate: action.payload.date,
        currentTime: action.payload.time,
      };

    default:
      return state;
  }
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getApiUrl = (path) => {
  if (!API_BASE) {
    return path;
  }

  const cleanBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${cleanBase}/${cleanPath}`;
};

const cleanRFID = (rfid = "") => {
  return String(rfid).replace(/[^a-zA-Z0-9]/g, "");
};

const normalizeStudent = (student = {}) => {
  return {
    ...student,

    first_name: student.first_name ?? "",

    middle_name: student.middle_name ?? "",

    last_name: student.last_name ?? "",

    academic_level: student.academic_level ?? "",

    course: student.course ?? "",

    student_profile: student.student_profile ?? "",

    status: student.status ?? "",

    rfid: student.rfid ?? "",

    email: student.email ?? "",

    level: student.level ?? "",

    student_id: student.student_id ?? "",
  };
};

const getFullName = (student) => {
  const name = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name.toUpperCase() || "N/A";
};

const getProfileImage = (student) => {
  const photo = student?.student_profile;

  if (!photo || photo.trim() === "" || photo === "null") {
    return DEFAULT_PROFILE;
  }

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  if (photo.startsWith("images/")) {
    return `/admission-management-system/${photo}`;
  }

  return `/admission-management-system/images/StudentPhoto/${photo}`;
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

const LogMonitoring = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const navigate = useNavigate();

  const { logout } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const rfidInputRef = useRef(null);
  const studentIdInputRef = useRef(null);

  const cooldownMapRef = useRef({});

  const autoHideTimerRef = useRef(null);
  const alertTimerRef = useRef(null);
  const cooldownMessageTimerRef = useRef(null);

  const screensaverTimerRef = useRef(null);

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /*
  |--------------------------------------------------------------------------
  | RFID FOCUS
  |--------------------------------------------------------------------------
  */

  const focusRFID = useCallback(() => {
    window.requestAnimationFrame(() => {
      rfidInputRef.current?.focus();
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ALERT
  |--------------------------------------------------------------------------
  */

  const showAlert = useCallback((type, title, message) => {
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
    }

    dispatch({
      type: "SHOW_ALERT",
      payload: {
        type,
        title,
        message,
      },
    });

    alertTimerRef.current = window.setTimeout(() => {
      dispatch({
        type: "HIDE_ALERT",
      });
    }, ALERT_TIME);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RESET STUDENT
  |--------------------------------------------------------------------------
  */

  const resetStudentData = useCallback(() => {
    if (autoHideTimerRef.current) {
      window.clearTimeout(autoHideTimerRef.current);

      autoHideTimerRef.current = null;
    }

    dispatch({
      type: "RESET_STUDENT",
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ADD MONITORING LOG
  |--------------------------------------------------------------------------
  */

  const addToMonitoringTable = useCallback(
    async (studentId, rfid, studentData) => {
      const response = await fetch(
        getApiUrl("databases/add_monitoring_log.php"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: studentId,
            rfid,
            student_data: studentData,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | SEND EMAIL
  |--------------------------------------------------------------------------
  */

  const sendEmail = useCallback(async (rfid, email) => {
    if (!email) {
      return;
    }

    try {
      const response = await fetch(getApiUrl("send-email.php"), {
        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          rfid,
          email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Email send failed:", data.message);
      }
    } catch (error) {
      console.error("Email send error:", error);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | COOLDOWN
  |--------------------------------------------------------------------------
  */

  const triggerCooldown = useCallback((key, expiresAt) => {
    const seconds = Math.ceil((expiresAt - Date.now()) / 1000);

    dispatch({
      type: "SHOW_COOLDOWN",
      payload: {
        id: key,
        seconds,
      },
    });

    if (cooldownMessageTimerRef.current) {
      window.clearTimeout(cooldownMessageTimerRef.current);
    }

    cooldownMessageTimerRef.current = window.setTimeout(() => {
      dispatch({
        type: "HIDE_COOLDOWN",
      });
    }, 3000);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SHOW MONITORING RESULT
  |--------------------------------------------------------------------------
  */

  const showMonitoringResult = useCallback(
    (foundStudent, response) => {
      const action = response.action;

      const updatedStudent = {
        ...foundStudent,

        monitoring_action: action,

        monitoring_message: response.message || "",

        monitoring_timestamp: response.timestamp || "",

        monitoring_duration: response.duration?.formatted || "",

        monitoring_action_display:
          action === "check-in" ? "Checked In" : "Checked Out",
      };

      dispatch({
        type: "SET_STUDENT",
        payload: updatedStudent,
      });

      dispatch({
        type: "SET_PROFILE_MODAL",
        payload: true,
      });

      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
      }

      autoHideTimerRef.current = window.setTimeout(() => {
        resetStudentData();
      }, PROFILE_HIDE_TIME);
    },
    [resetStudentData],
  );

  /*
  |--------------------------------------------------------------------------
  | GET STUDENT BY RFID
  |--------------------------------------------------------------------------
  */

  const getStudentByRFID = useCallback(
    async (rawRFID) => {
      if (stateRef.current.isLoading) {
        return;
      }

      const scannedRFID = cleanRFID(rawRFID);

      if (scannedRFID.length < RFID_MIN_LENGTH) {
        return;
      }

      dispatch({
        type: "SET_RFID",
        payload: "",
      });

      dispatch({
        type: "SET_PROFILE_MODAL",
        payload: false,
      });

      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);

        autoHideTimerRef.current = null;
      }

      focusRFID();

      const now = Date.now();

      dispatch({
        type: "SET_LOADING",
        payload: true,
      });

      try {
        const response = await fetch(
          getApiUrl(
            `getData/student-table-data.php?get_data=students&rfid=${encodeURIComponent(
              scannedRFID,
            )}`,
          ),
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.error || !Array.isArray(data) || data.length === 0) {
          resetStudentData();

          showAlert(
            "error",
            "RFID Not Found",
            `RFID '${scannedRFID}' is not registered in the system.`,
          );

          return;
        }

        const foundStudent = normalizeStudent(data[0]);

        const cooldown = cooldownMapRef.current[scannedRFID];

        if (cooldown && now < cooldown) {
          triggerCooldown(scannedRFID, cooldown);

          return;
        }

        if (foundStudent.status !== "officially_enrolled") {
          resetStudentData();

          showAlert(
            "warning",
            "Account Inactive",
            "This student account is not officially enrolled.",
          );

          return;
        }

        const monitoringResponse = await addToMonitoringTable(
          foundStudent.student_id,
          scannedRFID,
          foundStudent,
        );

        if (!monitoringResponse.success) {
          resetStudentData();

          showAlert(
            "error",
            "Monitoring Error",
            monitoringResponse.message || "Failed to record monitoring log.",
          );

          return;
        }

        cooldownMapRef.current[scannedRFID] = now + COOLDOWN_TIME;

        showMonitoringResult(foundStudent, monitoringResponse);

        if (foundStudent.email) {
          sendEmail(scannedRFID, foundStudent.email);
        }
      } catch (error) {
        console.error("RFID fetch error:", error);

        resetStudentData();

        showAlert(
          "error",
          "Network Error",
          "Failed to fetch student data. Please try again.",
        );
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: false,
        });

        focusRFID();
      }
    },
    [
      addToMonitoringTable,
      focusRFID,
      resetStudentData,
      sendEmail,
      showAlert,
      showMonitoringResult,
      triggerCooldown,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | GET STUDENT BY ID
  |--------------------------------------------------------------------------
  */

  const getStudentByID = useCallback(async () => {
    const inputId = stateRef.current.studentId.trim();

    if (inputId.length !== STUDENT_ID_LENGTH) {
      return;
    }

    if (stateRef.current.isLoading) {
      return;
    }

    dispatch({
      type: "SET_STUDENT_ID",
      payload: "",
    });

    dispatch({
      type: "SET_STUDENT_ID_MODAL",
      payload: false,
    });

    dispatch({
      type: "SET_PROFILE_MODAL",
      payload: false,
    });

    if (autoHideTimerRef.current) {
      window.clearTimeout(autoHideTimerRef.current);

      autoHideTimerRef.current = null;
    }

    const now = Date.now();

    dispatch({
      type: "SET_LOADING",
      payload: true,
    });

    try {
      const response = await fetch(
        getApiUrl("getData/student-table-data.php?get_data=students&all=true"),
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const students = await response.json();

      const rawStudent = students.find(
        (student) => student.student_id === inputId,
      );

      if (!rawStudent) {
        resetStudentData();

        showAlert(
          "error",
          "Student Not Found",
          "This student ID is not registered in the system.",
        );

        return;
      }

      const foundStudent = normalizeStudent(rawStudent);

      const cooldown = cooldownMapRef.current[inputId];

      if (cooldown && now < cooldown) {
        triggerCooldown(inputId, cooldown);

        return;
      }

      if (foundStudent.status !== "officially_enrolled") {
        resetStudentData();

        showAlert(
          "warning",
          "Account Inactive",
          "This student account is not officially enrolled.",
        );

        return;
      }

      const monitoringResponse = await addToMonitoringTable(
        foundStudent.student_id,
        "",
        foundStudent,
      );

      if (!monitoringResponse.success) {
        resetStudentData();

        showAlert(
          "error",
          "Monitoring Error",
          monitoringResponse.message || "Failed to record monitoring log.",
        );

        return;
      }

      cooldownMapRef.current[inputId] = now + COOLDOWN_TIME;

      showMonitoringResult(foundStudent, monitoringResponse);
    } catch (error) {
      console.error("Student ID error:", error);

      resetStudentData();

      showAlert(
        "error",
        "Network Error",
        "Failed to fetch student data. Please try again.",
      );
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: false,
      });

      focusRFID();
    }
  }, [
    addToMonitoringTable,
    focusRFID,
    resetStudentData,
    showAlert,
    showMonitoringResult,
    triggerCooldown,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RFID AUTO DETECTION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !state.rfid ||
      state.rfid.length < RFID_MIN_LENGTH ||
      state.isLoading ||
      state.showStudentIdModal
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      getStudentByRFID(state.rfid);
    }, SCAN_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [getStudentByRFID, state.isLoading, state.rfid, state.showStudentIdModal]);

  /*
  |--------------------------------------------------------------------------
  | DATE / TIME
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const date = now
        .toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        .toUpperCase();

      const time = now
        .toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        .toUpperCase();

      dispatch({
        type: "SET_DATE_TIME",

        payload: {
          date,
          time,
        },
      });
    };

    updateDateTime();

    const interval = window.setInterval(updateDateTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | COOLDOWN TIMER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();

      Object.keys(cooldownMapRef.current).forEach((key) => {
        if (cooldownMapRef.current[key] <= now) {
          delete cooldownMapRef.current[key];
        }
      });

      if (stateRef.current.cooldownStudentId) {
        const expires =
          cooldownMapRef.current[stateRef.current.cooldownStudentId];

        if (expires) {
          const seconds = Math.max(Math.ceil((expires - now) / 1000), 0);

          dispatch({
            type: "UPDATE_COOLDOWN",
            payload: seconds,
          });
        }
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SCREENSAVER
  |--------------------------------------------------------------------------
  */

  const resetScreensaverTimer = useCallback(() => {
    dispatch({
      type: "SET_SAVER",
      payload: false,
    });

    if (screensaverTimerRef.current) {
      window.clearTimeout(screensaverTimerRef.current);
    }

    screensaverTimerRef.current = window.setTimeout(() => {
      dispatch({
        type: "SET_SAVER",
        payload: true,
      });
    }, SCREENSAVER_TIME);
  }, []);

  useEffect(() => {
    resetScreensaverTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((eventName) => {
      document.addEventListener(eventName, resetScreensaverTimer, {
        passive: true,
      });
    });

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, resetScreensaverTimer);
      });

      if (screensaverTimerRef.current) {
        window.clearTimeout(screensaverTimerRef.current);
      }
    };
  }, [resetScreensaverTimer]);

  /*
  |--------------------------------------------------------------------------
  | GLOBAL KEYBOARD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    focusRFID();

    const handleClick = () => {
      if (!stateRef.current.showStudentIdModal) {
        focusRFID();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Tab" && !stateRef.current.showStudentIdModal) {
        event.preventDefault();

        dispatch({
          type: "SET_STUDENT_ID_MODAL",
          payload: true,
        });

        window.setTimeout(() => {
          studentIdInputRef.current?.focus();
        }, 50);

        return;
      }

      if (event.key === "Escape" && stateRef.current.showStudentIdModal) {
        dispatch({
          type: "SET_STUDENT_ID_MODAL",
          payload: false,
        });

        dispatch({
          type: "SET_STUDENT_ID",
          payload: "",
        });

        focusRFID();
      }
    };

    document.addEventListener("click", handleClick);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClick);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusRFID]);

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MANUAL INPUT
  |--------------------------------------------------------------------------
  */

  const closeStudentIdModal = () => {
    dispatch({
      type: "SET_STUDENT_ID_MODAL",
      payload: false,
    });

    dispatch({
      type: "SET_STUDENT_ID",
      payload: "",
    });

    window.setTimeout(focusRFID, 50);
  };

  /*
  |--------------------------------------------------------------------------
  | PROFILE FALLBACK
  |--------------------------------------------------------------------------
  */

  const handleProfileImageError = (event) => {
    if (event.currentTarget.src.includes("defaultProfile.jpg")) {
      return;
    }

    event.currentTarget.src = DEFAULT_PROFILE;
  };

  const showScreensaver =
    state.showSaver &&
    !state.showStudentIdModal &&
    !state.showProfileModal &&
    !state.showCooldownMessage &&
    !state.isLoading;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <style>{`
        @keyframes lm-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes lm-modal-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes lm-profile-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lm-page-bg {
          background:
            radial-gradient(
              circle at 12% 18%,
              rgba(0, 169, 214, 0.07),
              transparent 28%
            ),
            radial-gradient(
              circle at 88% 82%,
              rgba(255, 123, 25, 0.055),
              transparent 26%
            ),
            linear-gradient(
              135deg,
              #f5f8fa 0%,
              #edf5f7 45%,
              #f7f8f9 100%
            );
        }

        .lm-modal-in {
          animation:
            lm-modal-in
            .2s ease-out;
        }

        .lm-profile-in {
          animation:
            lm-profile-in
            .25s ease-out;
        }

        .lm-spinner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 4px solid #e2e8f0;
          border-top-color: #089ec4;
          animation:
            lm-spin
            .8s linear infinite;
        }
      `}</style>

      {/* ================================================================
          MAIN PAGE
      ================================================================= */}

      <div
        className="
          lm-page-bg
          relative
          min-h-screen
          w-full
          overflow-hidden
          text-slate-900
        "
      >
        {/* HIDDEN RFID INPUT */}

        <input
          ref={rfidInputRef}
          type="text"
          value={state.rfid}
          onChange={(event) => {
            dispatch({
              type: "SET_RFID",
              payload: event.target.value,
            });
          }}
          autoFocus
          autoComplete="off"
          aria-label="RFID scanner input"
          className="
            pointer-events-none
            absolute
            -left-[9999px]
            h-px
            w-px
            opacity-0
          "
        />

        {/* ==============================================================
            LOGOUT
        ============================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="
            fixed
            right-5
            top-5
            z-30

            flex
            h-11
            w-11
            items-center
            justify-center

            rounded-xl

            border
            border-slate-200

            bg-white

            text-slate-500

            shadow-sm

            transition

            hover:border-slate-300
            hover:text-slate-900
            hover:shadow-md
          "
        >
          <FiLogOut size={18} />
        </button>

        {/* ==============================================================
            TITLE
        ============================================================== */}

        <div
          className="
            relative
            z-10

            mx-auto
            flex
            max-w-[1400px]
            flex-col
            items-center

            px-6
            pb-4
            pt-8

            text-center

            md:pt-10
          "
        >
          <img
            src={SpryLogo}
            alt="SPRYtech"
            className="
              h-auto
              w-[190px]
              object-contain

              sm:w-[220px]
            "
          />

          <h1
            className="
              mt-4

              text-2xl
              font-semibold
              tracking-tight
              text-slate-900

              sm:text-3xl
            "
          >
            Log Monitoring
          </h1>

          <p
            className="
              mt-1.5
              text-sm
              text-slate-500
            "
          >
            Student RFID monitoring and attendance logging
          </p>
        </div>

        {/* ==============================================================
            MAIN CONTENT
        ============================================================== */}

        <main
          className="
            relative
            z-10

            mx-auto

            grid
            min-h-[calc(100vh-180px)]
            w-full
            max-w-[1350px]

            items-center

            gap-6

            px-5
            pb-10
            pt-3

            lg:grid-cols-[0.8fr_1.2fr]
            lg:gap-8

            xl:gap-10
          "
        >
          {/* ============================================================
              LEFT INFORMATION
          ============================================================ */}

          <section
            className="
              flex
              h-full
              min-h-[460px]

              flex-col
              items-center
              justify-center

              rounded-2xl

              border
              border-slate-200/80

              bg-white

              px-7
              py-8

              shadow-sm
            "
          >
            {/* SPRYTECH ICON */}

            <div
              className="
                flex
                h-[210px]
                w-[210px]

                items-center
                justify-center

                rounded-full

                bg-slate-50

                sm:h-[240px]
                sm:w-[240px]
              "
            >
              <img
                src={SprytechIcon}
                alt="SPRYtech"
                className="
                  h-[72%]
                  w-[72%]
                  object-contain
                "
              />
            </div>

            {/* DATE */}

            <div
              className="
                mt-7
                text-center
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                {state.currentDate}
              </p>

              <p
                className="
                  mt-2

                  text-3xl
                  font-semibold
                  tracking-[0.03em]
                  text-slate-900

                  sm:text-4xl
                "
              >
                {state.currentTime}
              </p>
            </div>

            {/* SYSTEM STATUS */}

            <div
              className="
                mt-6

                inline-flex
                items-center
                gap-2

                rounded-full

                bg-emerald-50

                px-3.5
                py-2

                text-xs
                font-medium
                text-emerald-700
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />
              System Online
            </div>
          </section>

          {/* ============================================================
              RFID CARD
          ============================================================ */}

          <section
            className="
              flex
              h-full
              min-h-[460px]

              flex-col

              rounded-2xl

              border
              border-slate-200/80

              bg-white

              shadow-sm
            "
          >
            <div
              className="
                flex
                flex-1
                flex-col
                items-center
                justify-center

                px-6
                py-9

                text-center

                sm:px-10
              "
            >
              {/* SCANNER ICON */}

              <div
                className="
                  flex
                  h-[72px]
                  w-[72px]
                  items-center
                  justify-center

                  rounded-2xl

                  bg-[#eff9fc]

                  text-[#059ec7]
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="
                    h-8
                    w-8
                  "
                >
                  <path
                    d="M8.5 8.5a5 5 0 0 0 0 7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <path
                    d="M5.5 5.5a9 9 0 0 0 0 13"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <path
                    d="M15.5 8.5a5 5 0 0 1 0 7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <path
                    d="M18.5 5.5a9 9 0 0 1 0 13"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <circle cx="12" cy="12" r="1.8" fill="#ff7a1a" />
                </svg>
              </div>

              <h2
                className="
                  mt-6

                  text-2xl
                  font-semibold
                  tracking-tight
                  text-slate-900

                  sm:text-[28px]
                "
              >
                Waiting for RFID Scan
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500

                  sm:text-base
                "
              >
                Tap or scan a student's RFID card to record their log.
              </p>

              {/* INSTRUCTION */}

              <div
                className="
                  mt-8
                  w-full
                  max-w-[520px]

                  rounded-xl

                  border
                  border-slate-200

                  bg-slate-50/70

                  p-4

                  text-left
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >
                  <div
                    className="
                      mt-0.5

                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center

                      rounded-lg

                      bg-white

                      text-slate-500

                      shadow-sm
                    "
                  >
                    <FiCreditCard size={17} />
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-800
                      "
                    >
                      RFID scanning is active
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      Card information is detected and submitted automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* MANUAL INPUT */}

              <div
                className="
                  mt-3
                  w-full
                  max-w-[520px]

                  rounded-xl

                  border
                  border-slate-200

                  bg-slate-50/70

                  p-4

                  text-left
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center

                      rounded-lg

                      bg-white

                      text-slate-500

                      shadow-sm
                    "
                  >
                    <FiUser size={17} />
                  </div>

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-800
                      "
                    >
                      Manual Student ID
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-slate-500
                      "
                    >
                      Press Tab if an RFID card is unavailable.
                    </p>
                  </div>

                  <span
                    className="
                      rounded-md

                      border
                      border-slate-200

                      bg-white

                      px-2
                      py-1

                      text-[11px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    TAB
                  </span>
                </div>
              </div>

              {/* READY */}

              <div
                className="
                  mt-7

                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  bg-cyan-50

                  px-4
                  py-2

                  text-xs
                  font-medium
                  text-cyan-700
                "
              >
                <span
                  className="
                    h-2
                    w-2

                    rounded-full

                    bg-cyan-500
                  "
                />
                RFID Reader Ready
              </div>
            </div>

            {/* FOOTER */}

            <div
              className="
                border-t
                border-slate-100

                px-6
                py-4

                text-center
              "
            >
              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Monitoring records are saved automatically after every
                successful scan.
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* ================================================================
          MANUAL STUDENT ID MODAL
      ================================================================= */}

      {state.showStudentIdModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]

            flex
            items-center
            justify-center

            bg-slate-950/35

            p-4

            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();

              getStudentByID();
            }}
            className="
              lm-modal-in

              w-full
              max-w-md

              rounded-2xl

              border
              border-slate-200

              bg-white

              p-6

              shadow-2xl
            "
          >
            {/* MODAL TITLE */}

            <div
              className="
                flex
                items-start
                justify-between
              "
            >
              <div>
                <h2
                  className="
                    text-xl
                    font-semibold
                    text-slate-900
                  "
                >
                  Manual Student Entry
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Enter the student's ID to continue.
                </p>
              </div>

              <button
                type="button"
                onClick={closeStudentIdModal}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-lg

                  text-slate-400

                  transition

                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                <FiX size={18} />
              </button>
            </div>

            {/* INPUT */}

            <div
              className="
                mt-6
              "
            >
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Student ID
              </label>

              <input
                ref={studentIdInputRef}
                type="text"
                value={state.studentId}
                maxLength={STUDENT_ID_LENGTH}
                autoComplete="off"
                placeholder="Enter Student ID"
                onChange={(event) => {
                  dispatch({
                    type: "SET_STUDENT_ID",

                    payload: event.target.value,
                  });
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();

                  if (event.key === "Escape") {
                    closeStudentIdModal();
                  }
                }}
                className="
                  h-12
                  w-full

                  rounded-lg

                  border
                  border-slate-200

                  bg-white

                  px-4

                  text-sm
                  font-medium
                  text-slate-800

                  outline-none

                  transition

                  placeholder:font-normal
                  placeholder:text-slate-400

                  focus:border-[#09a6cc]
                  focus:ring-4
                  focus:ring-cyan-100
                "
              />

              <div
                className="
                  mt-2

                  flex
                  justify-between

                  text-xs
                  text-slate-400
                "
              >
                <span>Press Enter to submit</span>

                <span>
                  {state.studentId.length}/{STUDENT_ID_LENGTH}
                </span>
              </div>
            </div>

            {/* BUTTONS */}

            <div
              className="
                mt-6

                flex
                justify-end
                gap-2
              "
            >
              <button
                type="button"
                onClick={closeStudentIdModal}
                className="
                  h-10

                  rounded-lg

                  border
                  border-slate-200

                  bg-white

                  px-4

                  text-sm
                  font-medium
                  text-slate-600

                  transition

                  hover:bg-slate-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  state.studentId.length !== STUDENT_ID_LENGTH ||
                  state.isLoading
                }
                className="
                  h-10

                  rounded-lg

                  bg-[#079fc5]

                  px-5

                  text-sm
                  font-semibold
                  text-white

                  transition

                  hover:bg-[#078eb0]

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================
          STUDENT RESULT
      ================================================================= */}

      {state.showProfileModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]

            flex
            items-center
            justify-center

            bg-slate-950/35

            p-4

            backdrop-blur-[2px]
          "
        >
          <div
            className="
              lm-modal-in

              w-full
              max-w-[940px]

              overflow-hidden

              rounded-2xl

              border
              border-slate-200

              bg-white

              shadow-2xl
            "
          >
            <div
              className="
                flex
                flex-col
                gap-7

                p-6

                md:flex-row
                md:items-center

                md:p-8
              "
            >
              {/* PROFILE */}

              <div
                className="
                  shrink-0
                "
              >
                <div
                  className="
                    h-[230px]
                    w-[230px]

                    overflow-hidden

                    rounded-2xl

                    bg-slate-100

                    sm:h-[260px]
                    sm:w-[260px]
                  "
                >
                  <img
                    src={getProfileImage(state.student)}
                    alt="Student"
                    onError={handleProfileImageError}
                    className="
                      lm-profile-in

                      h-full
                      w-full

                      object-cover
                    "
                  />
                </div>
              </div>

              {/* INFO */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <span
                    className={`
                      inline-flex
                      items-center
                      gap-1.5

                      rounded-full

                      px-3
                      py-1.5

                      text-xs
                      font-medium

                      ${
                        state.student.monitoring_action === "check-in"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }
                    `}
                  >
                    <FiCheck size={13} />

                    {state.student.monitoring_action_display}
                  </span>

                  {state.student.monitoring_timestamp && (
                    <span
                      className="
                        text-sm
                        text-slate-400
                      "
                    >
                      {state.student.monitoring_timestamp}
                    </span>
                  )}
                </div>

                <h2
                  className="
                    mt-3

                    break-words

                    text-3xl
                    font-semibold
                    leading-tight
                    text-slate-900
                  "
                >
                  {getFullName(state.student)}
                </h2>

                {/* DETAILS */}

                <div
                  className="
                    mt-6

                    grid

                    gap-5

                    sm:grid-cols-2
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        font-medium
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Student ID
                    </p>

                    <p
                      className="
                        mt-1
                        text-base
                        font-semibold
                        text-slate-800
                      "
                    >
                      {state.student.student_id || "N/A"}
                    </p>
                  </div>

                  {state.student.academic_level && (
                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                      >
                        Department
                      </p>

                      <p
                        className="
                          mt-1
                          text-base
                          font-semibold
                          text-slate-800
                        "
                      >
                        {state.student.academic_level}
                      </p>
                    </div>
                  )}

                  {state.student.course && (
                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                      >
                        Course & Section
                      </p>

                      <p
                        className="
                          mt-1
                          text-base
                          font-semibold
                          text-slate-800
                        "
                      >
                        {state.student.course}
                      </p>
                    </div>
                  )}

                  {state.student.level && (
                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                      >
                        Year Level
                      </p>

                      <p
                        className="
                          mt-1
                          text-base
                          font-semibold
                          text-slate-800
                        "
                      >
                        {state.student.level}
                      </p>
                    </div>
                  )}
                </div>

                {/* MONITORING MESSAGE */}

                {state.student.monitoring_message && (
                  <div
                    className="
                      mt-6

                      rounded-xl

                      border
                      border-slate-200

                      bg-slate-50

                      p-4
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-700
                      "
                    >
                      {state.student.monitoring_message}
                    </p>

                    <div
                      className="
                        mt-2

                        flex
                        flex-wrap
                        gap-4

                        text-xs
                        text-slate-500
                      "
                    >
                      {state.student.monitoring_timestamp && (
                        <span
                          className="
                            flex
                            items-center
                            gap-1.5
                          "
                        >
                          <FiClock />

                          {state.student.monitoring_timestamp}
                        </span>
                      )}

                      {state.student.monitoring_duration && (
                        <span>
                          Duration: {state.student.monitoring_duration}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <p
                  className="
                    mt-5
                    text-xs
                    text-slate-400
                  "
                >
                  This information will automatically close in 5 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          LOADING
      ================================================================= */}

      {state.isLoading && (
        <div
          className="
            fixed
            inset-0
            z-[110]

            flex
            items-center
            justify-center

            bg-slate-950/25

            backdrop-blur-[2px]
          "
        >
          <div
            className="
              flex
              min-w-[220px]
              flex-col
              items-center

              rounded-2xl

              border
              border-slate-200

              bg-white

              p-7

              shadow-xl
            "
          >
            <div
              className="
                lm-spinner
              "
            />

            <p
              className="
                mt-5
                text-sm
                font-medium
                text-slate-600
              "
            >
              Processing monitoring log...
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          ALERT
      ================================================================= */}

      {state.alert && (
        <div
          className="
            fixed
            inset-0
            z-[120]

            flex
            items-center
            justify-center

            bg-slate-950/20

            p-4
          "
        >
          <div
            className="
              lm-modal-in

              w-full
              max-w-sm

              rounded-2xl

              border
              border-slate-200

              bg-white

              p-6

              text-center

              shadow-2xl
            "
          >
            <div
              className={`
                mx-auto

                flex
                h-12
                w-12

                items-center
                justify-center

                rounded-full

                text-xl
                font-semibold

                ${
                  state.alert.type === "error"
                    ? "bg-rose-50 text-rose-600"
                    : state.alert.type === "warning"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-emerald-50 text-emerald-600"
                }
              `}
            >
              {state.alert.type === "error"
                ? "×"
                : state.alert.type === "warning"
                  ? "!"
                  : "✓"}
            </div>

            <h3
              className="
                mt-4
                text-lg
                font-semibold
                text-slate-900
              "
            >
              {state.alert.title}
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              {state.alert.message}
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          COOLDOWN
      ================================================================= */}

      {state.showCooldownMessage && (
        <div
          className="
            fixed
            bottom-6
            left-1/2
            z-[130]

            w-[calc(100%-2rem)]
            max-w-md

            -translate-x-1/2

            rounded-xl

            border
            border-slate-200

            bg-white

            px-5
            py-4

            text-center

            text-sm
            text-slate-600

            shadow-xl
          "
        >
          <span
            className="
              font-medium
              text-slate-900
            "
          >
            RFID recently detected.
          </span>{" "}
          Please try again in{" "}
          <strong
            className="
              text-orange-600
            "
          >
            {state.cooldownSecondsLeft}s
          </strong>
          .
        </div>
      )}

      {/* ================================================================
          SCREENSAVER
      ================================================================= */}

      {showScreensaver && (
        <div
          className="
            lm-page-bg

            fixed
            inset-0
            z-[200]

            flex
            flex-col
            items-center
            justify-center

            px-6

            text-center
          "
        >
          <img
            src={SprytechIcon}
            alt="SPRYtech"
            className="
              h-[150px]
              w-[150px]
              object-contain

              sm:h-[180px]
              sm:w-[180px]
            "
          />

          <img
            src={SpryLogo}
            alt="SPRYtech"
            className="
              mt-6
              w-[230px]
              object-contain
            "
          />

          <h2
            className="
              mt-6

              text-2xl
              font-semibold
              text-slate-900
            "
          >
            Log Monitoring
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            Student RFID monitoring system
          </p>

          <div
            className="
              mt-8

              inline-flex
              items-center
              gap-2

              rounded-full

              border
              border-slate-200

              bg-white

              px-4
              py-2

              text-xs
              text-slate-500

              shadow-sm
            "
          >
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-500
              "
            />
            Touch screen or press any key to continue
          </div>
        </div>
      )}
    </>
  );
};

export default LogMonitoring;
