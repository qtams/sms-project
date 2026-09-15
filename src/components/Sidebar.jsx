import { useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

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
              label: "Academic Setup",
              path: "/academic-setup",
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
            {
              label: "Log Monitoring",
              path: "/log-monitoring",
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
          `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "bg-cyan-50 text-cyan-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                isActive
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-500"
              }`}
            >
              <Icon size={16} />
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
          `relative block rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
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
          aria-expanded={isOpen}
          className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
            isOpen
              ? "bg-cyan-50 text-cyan-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                isOpen
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-500"
              }`}
            >
              <Icon size={16} />
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
          <div className="ml-6 mt-1 border-l border-slate-200 pl-3">
            <div className="space-y-0.5 py-0.5">
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

  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <aside className="no-scrollbar hidden h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 text-slate-900 [font-family:'Poppins',sans-serif] lg:block">
      <nav aria-label="Main navigation" className="space-y-5">
        {menuSections.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {group.title}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => renderMenuItem(item))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const SidebarSkeleton = () => {
  return (
    <aside className="no-scrollbar hidden h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 lg:block">
      <nav className="space-y-5">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="mb-2 px-3">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="space-y-2">
              {Array.from({
                length: sectionIndex === 1 ? 4 : 2,
              }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5"
                >
                  <div className="h-8 w-8 animate-pulse rounded-md bg-slate-200" />

                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
