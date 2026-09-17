import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";

/* =========================================================
   ROUTE CONFIG
========================================================= */

const staticRoutes = {
  "/dashboard": {
    label: "Dashboard",
    parents: [],
  },

  "/log-monitoring": {
    label: "Log Monitoring",
    parents: [],
  },

  "/account-information": {
    label: "Account Information",
    parents: [],
  },

  "/students": {
    label: "Students",
    parents: [{ label: "School Management", path: null }],
  },

  "/teachers": {
    label: "Teachers",
    parents: [{ label: "School Management", path: null }],
  },

  "/academic-setup": {
    label: "Academic Setup",
    parents: [{ label: "School Management", path: null }],
  },

  "/enrollment": {
    label: "Enrollment",
    parents: [],
  },

  "/enrollment/application": {
    label: "Application",
    parents: [{ label: "Enrollment", path: "/enrollment" }],
  },

  "/enrollment/verification": {
    label: "Verification",
    parents: [{ label: "Enrollment", path: "/enrollment" }],
  },

  "/attendance": {
    label: "Attendance",
    parents: [{ label: "Academic Records", path: null }],
  },

  "/rfid": {
    label: "RFID Attendance",
    parents: [{ label: "Academic Records", path: null }],
  },

  "/time-logger": {
    label: "Time Logger",
    parents: [{ label: "Academic Records", path: null }],
  },

  "/user-management/admin": {
    label: "Admin",
    parents: [{ label: "User Management", path: null }],
  },

  "/user-management/guard": {
    label: "Guard",
    parents: [{ label: "User Management", path: null }],
  },

  "/user-management/registrar": {
    label: "Registrar",
    parents: [{ label: "User Management", path: null }],
  },

  "/grades": {
    label: "Grades",
    parents: [{ label: "Academic Records", path: null }],
  },

  "/payments": {
    label: "Payments",
    parents: [{ label: "Finance", path: null }],
  },

  "/reports": {
    label: "Reports",
    parents: [{ label: "Finance", path: null }],
  },

  "/settings": {
    label: "Settings",
    parents: [],
  },
};

/* =========================================================
   HELPERS
========================================================= */

const safeDecode = (value = "") => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizePath = (pathname = "/") => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized = pathname.replace(/\/+$/, "");

  return normalized || "/";
};

const formatSegment = (value = "") => {
  return safeDecode(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getDynamicRoute = (path) => {
  const segments = path.split("/").filter(Boolean);

  /* STUDENT DETAILS
     /students/:studentId
  */
  if (segments.length === 2 && segments[0] === "students") {
    return {
      label: "Student Details",
      parents: [
        { label: "School Management", path: null },
        { label: "Students", path: "/students" },
      ],
    };
  }

  /* TEACHER DETAILS
     /teachers/:teacherId
  */
  if (segments.length === 2 && segments[0] === "teachers") {
    return {
      label: "Teacher Details",
      parents: [
        { label: "School Management", path: null },
        { label: "Teachers", path: "/teachers" },
      ],
    };
  }

  /* RFID DETAILS
     /rfid/:studentId
  */
  if (segments.length === 2 && segments[0] === "rfid") {
    return {
      label: "RFID Details",
      parents: [
        { label: "Academic Records", path: null },
        { label: "RFID Attendance", path: "/rfid" },
      ],
    };
  }

  /* ATTENDANCE SECTION
     /attendance/section/:gradeLevel/:section
  */
  if (
    segments.length === 4 &&
    segments[0] === "attendance" &&
    segments[1] === "section"
  ) {
    const gradeLevel = safeDecode(segments[2]);
    const section = safeDecode(segments[3]);

    return {
      label: `${gradeLevel} - ${section}`,
      parents: [
        { label: "Academic Records", path: null },
        { label: "Attendance", path: "/attendance" },
      ],
    };
  }

  /* STUDENT ATTENDANCE HISTORY
     /attendance/student/:studentId
  */
  if (
    segments.length === 3 &&
    segments[0] === "attendance" &&
    segments[1] === "student"
  ) {
    return {
      label: "Attendance History",
      parents: [
        { label: "Academic Records", path: null },
        { label: "Attendance", path: "/attendance" },
      ],
    };
  }

  /* USER MANAGEMENT DETAILS
     /user-management/admin/:userId
     /user-management/guard/:userId
     /user-management/registrar/:userId
  */
  if (
    segments.length === 3 &&
    segments[0] === "user-management" &&
    ["admin", "guard", "registrar"].includes(segments[1])
  ) {
    const role = formatSegment(segments[1]);
    const listPath = `/user-management/${segments[1]}`;

    return {
      label: `${role} Details`,
      parents: [
        { label: "User Management", path: null },
        { label: role, path: listPath },
      ],
    };
  }

  return null;
};

const getFallbackRoute = (path) => {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return {
      label: "Dashboard",
      parents: [],
    };
  }

  const currentSegment = segments[segments.length - 1];

  const parents = segments.slice(0, -1).map((segment, index) => {
    const parentPath = `/${segments.slice(0, index + 1).join("/")}`;

    return {
      label: staticRoutes[parentPath]?.label || formatSegment(segment),
      path: staticRoutes[parentPath] ? parentPath : null,
    };
  });

  return {
    label: formatSegment(currentSegment),
    parents,
  };
};

const getBreadcrumbRoute = (path) => {
  return staticRoutes[path] || getDynamicRoute(path) || getFallbackRoute(path);
};

/* =========================================================
   COMPONENT
========================================================= */

const Breadcrumbs = () => {
  const location = useLocation();

  const currentPath = normalizePath(location.pathname);

  if (currentPath === "/" || currentPath === "/dashboard") {
    return (
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-2 text-sm [font-family:'Poppins',sans-serif]"
      >
        <span className="flex items-center gap-2 font-normal text-slate-900">
          <FiHome className="text-slate-500" />
          Dashboard
        </span>
      </nav>
    );
  }

  const route = getBreadcrumbRoute(currentPath);

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-2 text-sm [font-family:'Poppins',sans-serif]"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-normal text-slate-600 transition hover:text-[#01B8E5]"
      >
        <FiHome className="text-slate-500" />
        Dashboard
      </Link>

      {route.parents.map((parent, index) => (
        <div
          key={`${parent.label}-${index}`}
          className="flex items-center gap-2"
        >
          <FiChevronRight size={14} className="shrink-0 text-slate-400" />

          {parent.path ? (
            <Link
              to={parent.path}
              className="font-normal text-slate-600 transition hover:text-[#01B8E5]"
            >
              {parent.label}
            </Link>
          ) : (
            <span className="font-normal text-slate-500">{parent.label}</span>
          )}
        </div>
      ))}

      <div className="flex min-w-0 items-center gap-2">
        <FiChevronRight size={14} className="shrink-0 text-slate-400" />

        <span
          className="max-w-[280px] truncate font-normal text-[#019BC2] sm:max-w-none"
          title={route.label}
        >
          {route.label}
        </span>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
