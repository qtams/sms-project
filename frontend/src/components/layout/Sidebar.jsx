import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";

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
    title: "Management",
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
        type: "link",
        label: "Student",
        path: "/students",
        icon: UserRound,
      },

      {
        type: "link",
        label: "Teacher",
        path: "/teachers",
        icon: GraduationCap,
      },

      {
        type: "dropdown",
        key: "enrollment",
        label: "Enrollment",
        icon: BookOpenCheck,
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
    ],
  },

  {
    title: "Configuration",
    items: [
      {
        type: "dropdown",
        key: "configuration",
        label: "Configuration",
        icon: Settings2,
        items: [
          {
            label: "Academic Setup",
            path: "/academic-setup",
          },
        ],
      },
    ],
  },

  {
    title: "Reports",
    items: [
      {
        type: "dropdown",
        key: "reports",
        label: "Reports",
        icon: ClipboardList,
        items: [
          {
            label: "Attendance",
            path: "/attendance",
          },
          {
            label: "RFID Logs",
            path: "/rfid",
          },
        ],
      },
    ],
  },
];

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

  useEffect(() => {
    const dropdowns = menuSections
      .flatMap((section) => section.items)
      .filter((item) => item.type === "dropdown");

    const activeDropdown = dropdowns.find((dropdown) =>
      dropdown.items.some(
        (item) =>
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`),
      ),
    );

    if (activeDropdown) {
      setOpenDropdown(activeDropdown.key);
    }
  }, [location.pathname]);

  const toggleDropdown = (key) => {
    setOpenDropdown((current) => (current === key ? "" : key));
  };

  const isPathActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const renderParentLink = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.label}
        to={item.path}
        className={({ isActive }) =>
          `group flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 py-1.5
          text-[13px] font-normal transition-all duration-200 ${
            isActive
              ? "bg-cyan-50/80 text-cyan-700"
              : "text-[#69768b] hover:bg-slate-50 hover:text-[#536176]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md
              transition-all duration-200 ${
                isActive
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-[#9ba8b9] group-hover:bg-white group-hover:text-[#69768b]"
              }`}
            >
              <Icon size={15} strokeWidth={1.7} />
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
          `relative flex min-h-[31px] items-center rounded-md px-3 py-1
          text-[12px] font-normal transition-all duration-200 ${
            isActive
              ? "bg-cyan-50/60 text-cyan-600"
              : "text-[#a8b3c2] hover:bg-slate-50/80 hover:text-[#7f8da3]"
          }`
        }
      >
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  const renderDropdown = (section) => {
    const Icon = section.icon;

    const hasActiveChild = section.items.some((item) =>
      isPathActive(item.path),
    );

    const isOpen = openDropdown === section.key;

    return (
      <div key={section.key}>
        <button
          type="button"
          onClick={() => toggleDropdown(section.key)}
          aria-expanded={isOpen}
          className={`group flex min-h-[38px] w-full items-center justify-between
          rounded-lg px-2.5 py-1.5 text-[13px] font-normal
          transition-all duration-200 ${
            hasActiveChild
              ? "bg-cyan-50/80 text-cyan-700"
              : isOpen
                ? "bg-slate-50/70 text-[#69768b]"
                : "text-[#69768b] hover:bg-slate-50 hover:text-[#536176]"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center
              rounded-md transition-all duration-200 ${
                hasActiveChild
                  ? "bg-white text-cyan-600 shadow-sm"
                  : isOpen
                    ? "bg-white text-[#8290a3]"
                    : "text-[#9ba8b9] group-hover:bg-white group-hover:text-[#69768b]"
              }`}
            >
              <Icon size={15} strokeWidth={1.7} />
            </span>

            <span className="truncate">{section.label}</span>
          </span>

          <ChevronDown
            size={13}
            strokeWidth={1.7}
            className={`shrink-0 transition-all duration-300 ease-out ${
              isOpen ? "rotate-180 text-[#94a3b8]" : "rotate-0 text-[#b1bbc8]"
            }`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`ml-[25px] border-l border-slate-200/80 pl-3
              transition-all duration-300 ease-out ${
                isOpen ? "translate-y-0 py-1" : "-translate-y-1 py-0"
              }`}
            >
              <div className="space-y-0.5">
                {section.items.map((item) => renderChildLink(item))}
              </div>
            </div>
          </div>
        </div>
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
    <aside
      className="
        no-scrollbar
        hidden
        h-full
        w-64
        shrink-0
        overflow-y-auto
        border-r
        border-slate-200
        bg-white
        px-3
        py-4
        [font-family:'Poppins',sans-serif]
        lg:block
      "
    >
      <nav aria-label="Main navigation" className="space-y-5">
        {menuSections.map((group) => (
          <div key={group.title}>
            <p
              className="
                mb-1.5
                px-2.5
                text-[9px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-[#b1bbc8]
              "
            >
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
    <aside
      className="
        no-scrollbar
        hidden
        h-full
        w-64
        shrink-0
        overflow-y-auto
        border-r
        border-slate-200
        bg-white
        px-3
        py-4
        lg:block
      "
    >
      <nav className="space-y-5">
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="mb-2 px-2.5">
              <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="space-y-1">
              {Array.from({
                length: sectionIndex === 1 ? 4 : 1,
              }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex min-h-[38px] items-center gap-2.5 px-2.5 py-1.5"
                >
                  <div className="h-7 w-7 animate-pulse rounded-md bg-slate-100" />

                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
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
