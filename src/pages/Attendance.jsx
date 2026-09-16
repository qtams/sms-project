import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../lib/api";

const USE_DUMMY_DATA = true;

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDummyStudents = () => [
  {
    id: 1,
    studentId: "STD-2026-001",
    firstName: "Juan",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
  },
  {
    id: 2,
    studentId: "STD-2026-002",
    firstName: "Angela",
    lastName: "Reyes",
    gradeLevel: "Grade 7",
    section: "A",
  },
  {
    id: 3,
    studentId: "STD-2026-003",
    firstName: "Miguel",
    lastName: "Garcia",
    gradeLevel: "Grade 7",
    section: "A",
  },
  {
    id: 4,
    studentId: "STD-2026-004",
    firstName: "Nicole",
    lastName: "Mendoza",
    gradeLevel: "Grade 7",
    section: "A",
  },
  {
    id: 5,
    studentId: "STD-2026-005",
    firstName: "Joshua",
    lastName: "Ramos",
    gradeLevel: "Grade 8",
    section: "B",
  },
  {
    id: 6,
    studentId: "STD-2026-006",
    firstName: "Sophia",
    lastName: "Flores",
    gradeLevel: "Grade 8",
    section: "B",
  },
  {
    id: 7,
    studentId: "STD-2026-007",
    firstName: "Carlo",
    lastName: "Villanueva",
    gradeLevel: "Grade 8",
    section: "B",
  },
  {
    id: 8,
    studentId: "STD-2026-008",
    firstName: "Patricia",
    lastName: "Navarro",
    gradeLevel: "Grade 9",
    section: "C",
  },
  {
    id: 9,
    studentId: "STD-2026-009",
    firstName: "Gabriel",
    lastName: "Torres",
    gradeLevel: "Grade 9",
    section: "C",
  },
  {
    id: 10,
    studentId: "STD-2026-010",
    firstName: "Andrea",
    lastName: "Castillo",
    gradeLevel: "Grade 9",
    section: "C",
  },
  {
    id: 11,
    studentId: "STD-2026-011",
    firstName: "Nathan",
    lastName: "Aquino",
    gradeLevel: "Grade 10",
    section: "D",
  },
  {
    id: 12,
    studentId: "STD-2026-012",
    firstName: "Beatrice",
    lastName: "Lim",
    gradeLevel: "Grade 10",
    section: "D",
  },
];

const Attendance = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSections = async () => {
      setIsLoading(true);

      try {
        if (USE_DUMMY_DATA) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 250);
          });

          if (!cancelled) {
            setStudents(getDummyStudents());
          }

          return;
        }

        const response = await api.get("/api/attendance", {
          params: {
            date: formatLocalDate(new Date()),
          },
        });

        if (!cancelled) {
          setStudents(response.data?.records || []);
        }
      } catch (error) {
        console.error("Unable to load assigned sections:", error);

        if (!cancelled) {
          setStudents([]);

          toast.error(
            error.response?.data?.message ||
              "Unable to load assigned sections.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      const key = `${student.gradeLevel}-${student.section}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          gradeLevel: student.gradeLevel,
          section: student.section,
          studentCount: 0,
        });
      }

      map.get(key).studentCount += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
      `${a.gradeLevel} ${a.section}`.localeCompare(
        `${b.gradeLevel} ${b.section}`,
      ),
    );
  }, [students]);

  const handleViewSection = (item) => {
    navigate(
      `/attendance/section/${encodeURIComponent(
        item.gradeLevel,
      )}/${encodeURIComponent(item.section)}`,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 [font-family:'Poppins',sans-serif]">
        <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-0"
            >
              <div className="h-10 w-40 animate-pulse rounded bg-slate-200" />

              <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div>
        <h1 className="text-[22px] font-medium text-slate-900">My Sections</h1>

        <p className="mt-1 text-[13px] font-normal text-[#94a3b8]">
          Select a section to manage attendance.
        </p>
      </div>

      {/* SECTIONS */}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-[14px] font-medium text-[#69768b]">
            Assigned Sections
          </p>

          <span className="text-[12px] text-[#94a3b8]">{sections.length}</span>
        </div>

        {/* LIST */}

        {sections.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sections.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleViewSection(item)}
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-4
                  px-5
                  py-4
                  text-left
                  transition
                  hover:bg-[#01B8E5]/[0.035]
                "
              >
                {/* SECTION INFO */}

                <div className="min-w-0">
                  <p className="truncate text-[13px] font-normal text-[#69768b] transition group-hover:text-slate-900">
                    {item.gradeLevel} - {item.section}
                  </p>

                  <p className="mt-1 text-[11px] text-[#94a3b8]">
                    {item.studentCount}{" "}
                    {item.studentCount === 1 ? "student" : "students"}
                  </p>
                </div>

                {/* VIEW */}

                <div className="flex shrink-0 items-center gap-1 text-[12px] text-[#69768b] transition group-hover:text-[#01B8E5]">
                  View
                  <FiChevronRight className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] text-[#69768b]">No sections assigned</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
