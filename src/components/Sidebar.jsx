import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpenCheck,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  School,
  Settings,
  Users,
  GraduationCap,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState("");

  const toggleDropdown = (key) => {
    setOpenDropdown((current) => (current === key ? "" : key));
  };

  const menuSections = [
    {
      title: "Main",
      items: [
        {
          type: "link",
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "School",
      items: [
        {
          type: "dropdown",
          key: "school",
          label: "School Management",
          icon: School,
          items: [
            {
              label: "Students",
              path: "/students",
            },
            {
              label: "Teachers",
              path: "/teachers",
            },
            {
              label: "Classes",
              path: "/classes",
            },
          ],
        },
        {
          type: "dropdown",
          key: "enrollment",
          label: "Enrollment",
          icon: ClipboardList,
          items: [
            {
              label: "Application",
              path: "/enrollment/application",
            },
            {
              label: "Verification",
              path: "/enrollment/verification",
            },
          ],
        },
        {
          type: "dropdown",
          key: "academic",
          label: "Academic Records",
          icon: BookOpenCheck,
          items: [
            {
              label: "Attendance",
              path: "/attendance",
            },
            {
              label: "Grades",
              path: "/grades",
            },
          ],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          type: "dropdown",
          key: "finance",
          label: "Finance",
          icon: CreditCard,
          items: [
            {
              label: "Payments",
              path: "/payments",
            },
            {
              label: "Reports",
              path: "/reports",
            },
          ],
        },
        {
          type: "link",
          label: "Settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const renderParentLink = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.label}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition ${
            isActive
              ? "bg-slate-100 text-slate-950"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          }`
        }
      >
        <Icon size={18} className="shrink-0 text-slate-500" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  const renderChildLink = (item) => {
    return (
      <NavLink
        key={item.label}
        to={item.path}
        className={({ isActive }) =>
          `block rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            isActive
              ? "bg-slate-100 text-slate-950"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          }`
        }
      >
        {item.label}
      </NavLink>
    );
  };

  const renderDropdown = (section) => {
    const Icon = section.icon;

    const isDropdownActive = section.items.some(
      (item) => item.path === location.pathname,
    );

    const isOpen = openDropdown === section.key || isDropdownActive;

    return (
      <div key={section.key}>
        <button
          type="button"
          onClick={() => toggleDropdown(section.key)}
          className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-bold transition ${
            isOpen
              ? "bg-slate-100 text-slate-950"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon size={18} className="shrink-0 text-slate-500" />
            <span className="truncate">{section.label}</span>
          </span>

          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="ml-8 mt-2 border-l border-slate-200 pl-4">
            <div className="space-y-1">
              {section.items.map((item) => renderChildLink(item))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMenuItem = (section) => {
    if (section.type === "link") {
      return renderParentLink(section);
    }

    return renderDropdown(section);
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 text-slate-900 lg:block">
      <nav className="space-y-7">
        {menuSections.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-xs font-semibold text-slate-500">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((section) => renderMenuItem(section))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
