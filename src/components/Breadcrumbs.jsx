import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";

const routeLabels = {
  "/dashboard": "Dashboard",
  "/account-information": "Account Information",

  "/students": "Students",
  "/teachers": "Teachers",
  "/classes": "Grade & Sections",

  "/enrollment": "Enrollment",
  "/enrollment/application": "Application",
  "/enrollment/verification": "Verification",

  "/attendance": "Attendance",
  "/grades": "Grades",

  "/payments": "Payments",
  "/reports": "Reports",
  "/settings": "Settings",
};

const routeParents = {
  "/students": [{ label: "School Management", path: null }],
  "/teachers": [{ label: "School Management", path: null }],
  "/classes": [{ label: "School Management", path: null }],

  "/enrollment/application": [{ label: "Enrollment", path: "/enrollment" }],
  "/enrollment/verification": [{ label: "Enrollment", path: "/enrollment" }],

  "/attendance": [{ label: "Academic Records", path: null }],
  "/grades": [{ label: "Academic Records", path: null }],

  "/payments": [{ label: "Finance", path: null }],
  "/reports": [{ label: "Finance", path: null }],
};

const formatLabel = (value) => {
  return value
    .replace("/", "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const Breadcrumbs = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const currentLabel = routeLabels[currentPath] || formatLabel(currentPath);
  const parents = routeParents[currentPath] || [];

  if (currentPath === "/dashboard" || currentPath === "/") {
    return (
      <nav className="mb-5 flex items-center gap-2 text-sm [font-family:'Poppins',sans-serif]">
        <span className="flex items-center gap-2 font-normal text-slate-900">
          <FiHome className="text-slate-500" />
          Dashboard
        </span>
      </nav>
    );
  }

  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm [font-family:'Poppins',sans-serif]">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-normal text-slate-600 transition hover:text-cyan-600"
      >
        <FiHome className="text-slate-500" />
        Dashboard
      </Link>

      {parents.map((parent) => (
        <div key={parent.label} className="flex items-center gap-2">
          <FiChevronRight size={14} className="text-slate-400" />

          {parent.path ? (
            <Link
              to={parent.path}
              className="font-normal text-slate-600 transition hover:text-cyan-600"
            >
              {parent.label}
            </Link>
          ) : (
            <span className="font-normal text-slate-500">{parent.label}</span>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <FiChevronRight size={14} className="text-slate-400" />

        <span className="font-normal text-cyan-700">{currentLabel}</span>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
