import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  School,
  Settings,
  Users,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState("");

  const toggleDropdown = (key) => {
    setOpenDropdown((current) => (current === key ? "" : key));
  };

  const isPathActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
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
          key: "user-management",
          label: "User Management",
          icon: Users,
          items: [
            {
              label: "Admin",
              path: "/user-management/admin",
            },
            {
              label: "Guard",
              path: "/user-management/guard",
            },
            {
              label: "Registrar",
              path: "/user-management/registrar",
            },
          ],
        },
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
              label: "Grade & Sections",
              path: "/classes",
            },
            {
              label: "RFID",
              path: "/rfid",
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
          ],
        },
      ],
    },
    {
      title: "Administration",
      items: [
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
          `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            isActive
              ? "bg-cyan-50 text-cyan-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                isActive
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-500"
              }`}
            >
              <Icon size={17} />
            </span>

            <span className="truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  };

  const renderChildLink = (item) => {
    return (
      <NavLink
        key={item.label}
        to={item.path}
        className={({ isActive }) =>
          `relative block rounded-md px-3 py-2 text-sm font-medium transition ${
            isActive
              ? "bg-cyan-50 text-cyan-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`
        }
      >
        {item.label}
      </NavLink>
    );
  };

  const renderDropdown = (section) => {
    const Icon = section.icon;

    const isDropdownActive = section.items.some((item) =>
      isPathActive(item.path),
    );

    const isOpen = openDropdown === section.key || isDropdownActive;

    return (
      <div key={section.key}>
        <button
          type="button"
          onClick={() => toggleDropdown(section.key)}
          className={`group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition ${
            isOpen
              ? "bg-cyan-50 text-cyan-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                isOpen
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-500"
              }`}
            >
              <Icon size={17} />
            </span>

            <span className="truncate">{section.label}</span>
          </span>

          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-cyan-600" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="ml-7 mt-1 border-l border-slate-100 pl-3">
            <div className="space-y-1 py-1">
              {section.items.map((item) => renderChildLink(item))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMenuItem = (item) => {
    if (item.type === "link") {
      return renderParentLink(item);
    }

    return renderDropdown(item);
  };

  return (
    <aside className="no-scrollbar hidden h-full w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 text-slate-900 lg:block">
      <nav className="space-y-6">
        {menuSections.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => renderMenuItem(item))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
