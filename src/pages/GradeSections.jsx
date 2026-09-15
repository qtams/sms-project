import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiLoader,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import api from "../lib/api";

import AcademicUnitModal from "../components/modals/AcademicUnitModal";
import ProgramModal from "../components/modals/ProgramModal";
import SchoolYearModal from "../components/modals/SchoolYearModal";
import GradeLevelModal from "../components/modals/GradeLevelModal";
import SectionModal from "../components/modals/SectionModal";

/* =========================================================
   FORM DEFAULTS
========================================================= */

const emptyYear = {
  name: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

const emptyUnit = {
  parent_id: "",
  code: "",
  name: "",
  type: "division",
  education_level: "basic",
  description: "",
  is_active: true,
};

const emptyProgram = {
  academic_unit_id: "",
  code: "",
  name: "",
  program_type: "program",
  description: "",
  is_active: true,
};

const emptyGrade = {
  academic_unit_id: "",
  academic_program_id: "",
  name: "",
  sort_order: 0,
  is_active: true,
};

const emptySection = {
  grade_level_id: "",
  school_year_id: "",
  name: "",
  capacity: "",
  is_active: true,
};

/* =========================================================
   PAGINATION
========================================================= */

const rowsPerPageOptions = [5, 10, 25, 50];

/* =========================================================
   UTILITIES
========================================================= */

const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const csvValue = (value) => {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function GradeSections() {
  const [data, setData] = useState({
    schoolYears: [],
    academicUnits: [],
    academicPrograms: [],
    gradeLevels: [],
    sections: [],
    teachers: [],
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  const [activeView, setActiveView] = useState("sections");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [year, setYear] = useState(emptyYear);
  const [unit, setUnit] = useState(emptyUnit);
  const [program, setProgram] = useState(emptyProgram);
  const [grade, setGrade] = useState(emptyGrade);
  const [section, setSection] = useState(emptySection);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const load = useCallback(async ({ showSkeleton = false } = {}) => {
    if (showSkeleton) {
      setLoading(true);
    }

    try {
      const response = await api.get("/api/academic-setup");
      const payload = response?.data || {};

      setData({
        schoolYears: Array.isArray(payload.schoolYears)
          ? payload.schoolYears
          : [],
        academicUnits: Array.isArray(payload.academicUnits)
          ? payload.academicUnits
          : [],
        academicPrograms: Array.isArray(payload.academicPrograms)
          ? payload.academicPrograms
          : [],
        gradeLevels: Array.isArray(payload.gradeLevels)
          ? payload.gradeLevels
          : [],
        sections: Array.isArray(payload.sections) ? payload.sections : [],
        teachers: Array.isArray(payload.teachers) ? payload.teachers : [],
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      if (showSkeleton) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load({
      showSkeleton: true,
    });
  }, [load]);

  /* =======================================================
     CARDS
  ======================================================= */

  const cards = useMemo(
    () => [
      {
        key: "academicUnits",
        label: "Academic Units",
        singular: "Academic Unit",
        count: data.academicUnits.length,
      },
      {
        key: "academicPrograms",
        label: "Programs / Tracks",
        singular: "Program / Track",
        count: data.academicPrograms.length,
      },
      {
        key: "schoolYears",
        label: "School Years",
        singular: "School Year",
        count: data.schoolYears.length,
      },
      {
        key: "gradeLevels",
        label: "Grade Levels",
        singular: "Grade Level",
        count: data.gradeLevels.length,
      },
      {
        key: "sections",
        label: "Sections",
        singular: "Section",
        count: data.sections.length,
      },
    ],
    [data],
  );

  const activeCard = cards.find((card) => card.key === activeView) || cards[0];

  /* =======================================================
     SELECT VIEW
  ======================================================= */

  const selectView = (key) => {
    setActiveView(key);
    setShowAddForm(false);
    setSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matchesStatus = (row) => {
      if (statusFilter === "All") {
        return true;
      }

      return statusFilter === "Active"
        ? Boolean(row.is_active)
        : !Boolean(row.is_active);
    };

    const matchesSearch = (values) =>
      !term ||
      values
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(term);

    if (activeView === "academicUnits") {
      return data.academicUnits.filter(
        (row) =>
          matchesSearch([
            row.code,
            row.name,
            row.type,
            row.education_level,
            row.parent?.name,
          ]) && matchesStatus(row),
      );
    }

    if (activeView === "academicPrograms") {
      return data.academicPrograms.filter(
        (row) =>
          matchesSearch([
            row.code,
            row.name,
            row.program_type,
            row.academic_unit?.name,
          ]) && matchesStatus(row),
      );
    }

    if (activeView === "schoolYears") {
      return data.schoolYears.filter(
        (row) =>
          matchesSearch([row.name, row.start_date, row.end_date]) &&
          matchesStatus(row),
      );
    }

    if (activeView === "gradeLevels") {
      return data.gradeLevels.filter(
        (row) =>
          matchesSearch([
            row.name,
            row.academic_unit?.name,
            row.academic_program?.name,
            row.sort_order,
          ]) && matchesStatus(row),
      );
    }

    return data.sections.filter(
      (row) =>
        matchesSearch([
          row.name,
          row.grade_level?.name,
          row.grade_level?.academic_unit?.name,
          row.grade_level?.academic_program?.name,
          row.school_year?.name,
          row.capacity,
          ...(row.teachers || []).flatMap((teacher) => [
            teacher.username,
            teacher.staff_profile?.first_name,
            teacher.staff_profile?.last_name,
          ]),
        ]) && matchesStatus(row),
    );
  }, [activeView, data, search, statusFilter]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedRows = useMemo(
    () => filteredRows.slice(startIndex, endIndex),
    [filteredRows, startIndex, endIndex],
  );

  const showingStart = filteredRows.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, filteredRows.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.info("There are no records to export.");
      return;
    }

    const exportConfig = {
      academicUnits: {
        headers: [
          "Code",
          "Academic Unit",
          "Parent",
          "Type",
          "Education Level",
          "Programs",
          "Grades",
          "Status",
        ],
        row: (item) => [
          item.code,
          item.name,
          item.parent?.name,
          item.type,
          item.education_level === "higher_education"
            ? "Higher Education"
            : "Basic Education",
          item.programs_count || 0,
          item.grade_levels_count || 0,
          item.is_active ? "Active" : "Inactive",
        ],
      },
      academicPrograms: {
        headers: [
          "Code",
          "Program / Track",
          "Academic Unit",
          "Type",
          "Grade Levels",
          "Status",
        ],
        row: (item) => [
          item.code,
          item.name,
          item.academic_unit?.name,
          item.program_type,
          item.grade_levels_count || 0,
          item.is_active ? "Active" : "Inactive",
        ],
      },
      schoolYears: {
        headers: [
          "School Year",
          "Start Date",
          "End Date",
          "Sections",
          "Status",
        ],
        row: (item) => [
          item.name,
          item.start_date,
          item.end_date,
          item.sections_count || 0,
          item.is_active ? "Active" : "Inactive",
        ],
      },
      gradeLevels: {
        headers: [
          "Grade Level",
          "Academic Unit",
          "Program / Track",
          "Sort Order",
          "Sections",
          "Status",
        ],
        row: (item) => [
          item.name,
          item.academic_unit?.name,
          item.academic_program?.name,
          item.sort_order ?? 0,
          item.sections_count || 0,
          item.is_active ? "Active" : "Inactive",
        ],
      },
      sections: {
        headers: [
          "Grade Level",
          "Section",
          "Academic Unit / Program",
          "School Year",
          "Capacity",
          "Teachers",
          "Status",
        ],
        row: (item) => [
          item.grade_level?.name,
          item.name,
          item.grade_level?.academic_program?.name ||
            item.grade_level?.academic_unit?.name,
          item.school_year?.name,
          item.capacity,
          (item.teachers || [])
            .map((teacher) =>
              teacher.staff_profile?.first_name
                ? `${teacher.staff_profile.first_name} ${
                    teacher.staff_profile.last_name || ""
                  }`.trim()
                : teacher.username,
            )
            .join(" | "),
          item.is_active ? "Active" : "Inactive",
        ],
      },
    };

    const selected = exportConfig[activeView];
    const content = [
      selected.headers.map(csvValue).join(","),
      ...filteredRows.map((item) => selected.row(item).map(csvValue).join(",")),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${activeView}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(`${activeCard.label} exported successfully.`);
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = async (event, endpoint, values, reset) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/api/academic-setup/${endpoint}`, values);

      reset();
      setShowAddForm(false);

      await load({
        showSkeleton: false,
      });

      toast.success("Saved successfully.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const remove = async (type, id, label) => {
    if (pendingActionId) {
      return;
    }

    const result = await Swal.fire({
      title: `Delete ${label}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    const actionId = `delete-${type}-${id}`;

    setPendingActionId(actionId);

    try {
      await api.delete(`/api/academic-setup/${type}/${id}`);

      await load({
        showSkeleton: false,
      });

      toast.success("Deleted successfully.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPendingActionId(null);
    }
  };

  /* =======================================================
     TEACHERS
  ======================================================= */

  const toggleTeacher = async (row, teacherId) => {
    if (pendingActionId) {
      return;
    }

    const current = (row.teachers || []).map((teacher) => teacher.id);

    const teacher_ids = current.includes(teacherId)
      ? current.filter((id) => id !== teacherId)
      : [...current, teacherId];

    const actionId = `teacher-${row.id}-${teacherId}`;

    setPendingActionId(actionId);

    try {
      await api.put(`/api/academic-setup/sections/${row.id}/teachers`, {
        teacher_ids,
      });

      await load({
        showSkeleton: false,
      });

      toast.success("Teacher assignment updated.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPendingActionId(null);
    }
  };

  /* =======================================================
     SKELETON
  ======================================================= */

  if (loading) {
    return <PageSkeleton />;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="space-y-5 [font-family:'Poppins',sans-serif]"
      data-aos="fade-up"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            Grade & Sections
          </h1>

          <p className="mt-1 text-sm font-normal text-slate-500">
            Manage academic units, programs, school years, grade levels,
            sections, and teacher assignments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowAddForm(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus />
            {`Add ${activeCard.singular}`}
          </button>
        </div>
      </div>

      {/* =================================================
          NAVIGATION / SUMMARY CARDS
      ================================================= */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {cards.map(({ key, label, count }) => {
          const active = activeView === key;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => selectView(key)}
              className={`rounded-md border bg-white p-4 text-left shadow-sm transition ${
                active
                  ? "border-cyan-500 ring-4 ring-cyan-50"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className="truncate text-sm font-normal text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-medium text-slate-950">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        {/* HEADER / FILTER */}

        <div className="border-b border-slate-100 p-4">
          <p className="text-base font-medium text-slate-900">
            {activeCard.label}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder={`Search ${activeCard.label.toLowerCase()}...`}
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">
          {activeView === "academicUnits" && (
            <AcademicUnitTable
              rows={paginatedRows}
              onDelete={remove}
              pendingActionId={pendingActionId}
            />
          )}

          {activeView === "academicPrograms" && (
            <AcademicProgramTable
              rows={paginatedRows}
              onDelete={remove}
              pendingActionId={pendingActionId}
            />
          )}

          {activeView === "schoolYears" && (
            <SchoolYearTable
              rows={paginatedRows}
              onDelete={remove}
              pendingActionId={pendingActionId}
            />
          )}

          {activeView === "gradeLevels" && (
            <GradeLevelTable
              rows={paginatedRows}
              onDelete={remove}
              pendingActionId={pendingActionId}
            />
          )}

          {activeView === "sections" && (
            <SectionTable
              rows={paginatedRows}
              teachers={data.teachers}
              onDelete={remove}
              onToggleTeacher={toggleTeacher}
              pendingActionId={pendingActionId}
            />
          )}
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={filteredRows.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onRowsPerPageChange={handleRowsPerPageChange}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* =================================================
          ADD MODALS
      ================================================= */}

      <AcademicUnitModal
        isOpen={showAddForm && activeView === "academicUnits"}
        onClose={() => setShowAddForm(false)}
        value={unit}
        setValue={setUnit}
        units={data.academicUnits}
        submitting={submitting}
        onSubmit={(event) =>
          submit(
            event,
            "academic-units",
            { ...unit, parent_id: unit.parent_id || null },
            () => setUnit(emptyUnit),
          )
        }
      />

      <ProgramModal
        isOpen={showAddForm && activeView === "academicPrograms"}
        onClose={() => setShowAddForm(false)}
        value={program}
        setValue={setProgram}
        units={data.academicUnits}
        submitting={submitting}
        onSubmit={(event) =>
          submit(event, "academic-programs", program, () =>
            setProgram(emptyProgram),
          )
        }
      />

      <SchoolYearModal
        isOpen={showAddForm && activeView === "schoolYears"}
        onClose={() => setShowAddForm(false)}
        value={year}
        setValue={setYear}
        submitting={submitting}
        onSubmit={(event) =>
          submit(event, "school-years", year, () => setYear(emptyYear))
        }
      />

      <GradeLevelModal
        isOpen={showAddForm && activeView === "gradeLevels"}
        onClose={() => setShowAddForm(false)}
        value={grade}
        setValue={setGrade}
        data={data}
        submitting={submitting}
        onSubmit={(event) =>
          submit(
            event,
            "grade-levels",
            {
              ...grade,
              academic_program_id: grade.academic_program_id || null,
            },
            () => setGrade(emptyGrade),
          )
        }
      />

      <SectionModal
        isOpen={showAddForm && activeView === "sections"}
        onClose={() => setShowAddForm(false)}
        value={section}
        setValue={setSection}
        data={data}
        submitting={submitting}
        onSubmit={(event) =>
          submit(
            event,
            "sections",
            { ...section, capacity: section.capacity || null },
            () => setSection(emptySection),
          )
        }
      />
    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({ label, align = "left" }) => (
  <th
    className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
      align === "right"
        ? "text-right"
        : align === "center"
          ? "text-center"
          : "text-left"
    }`}
  >
    {label}
  </th>
);

/* =========================================================
   ACADEMIC UNIT TABLE
========================================================= */

const AcademicUnitTable = ({ rows, onDelete, pendingActionId }) => (
  <table className="w-full min-w-[1000px] border-collapse text-left">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <TableHeader label="Academic Unit" />
        <TableHeader label="Parent" />
        <TableHeader label="Type" />
        <TableHeader label="Education Level" />
        <TableHeader label="Programs / Grades" />
        <TableHeader label="Status" />
        <TableHeader label="Action" align="right" />
      </tr>
    </thead>

    <tbody>
      {rows.length > 0 ? (
        rows.map((row) => {
          const actionId = `delete-academic-units-${row.id}`;

          return (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-slate-900">
                  {row.name || "-"}
                </p>

                <p className="mt-1 text-xs font-normal text-slate-400">
                  {row.code || "-"}
                </p>
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.parent?.name || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal capitalize text-slate-600">
                {row.type || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.education_level === "higher_education"
                  ? "Higher Education"
                  : "Basic Education"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                <span className="inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-xs">
                  {row.programs_count || 0} Programs
                  {" · "}
                  {row.grade_levels_count || 0} Grades
                </span>
              </td>

              <td className="px-5 py-4">
                <Status active={row.is_active} />
              </td>

              <td className="px-5 py-4 text-right">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => onDelete("academic-units", row.id, row.name)}
                />
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyRow columns={7} label="academic units" />
      )}
    </tbody>
  </table>
);

/* =========================================================
   ACADEMIC PROGRAM TABLE
========================================================= */

const AcademicProgramTable = ({ rows, onDelete, pendingActionId }) => (
  <table className="w-full min-w-[900px] border-collapse text-left">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <TableHeader label="Program / Track" />
        <TableHeader label="Academic Unit" />
        <TableHeader label="Type" />
        <TableHeader label="Grade Levels" />
        <TableHeader label="Status" />
        <TableHeader label="Action" align="right" />
      </tr>
    </thead>

    <tbody>
      {rows.length > 0 ? (
        rows.map((row) => {
          const actionId = `delete-academic-programs-${row.id}`;

          return (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-slate-900">
                  {row.name || "-"}
                </p>

                <p className="mt-1 text-xs font-normal text-slate-400">
                  {row.code || "-"}
                </p>
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.academic_unit?.name || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal capitalize text-slate-600">
                {row.program_type || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.grade_levels_count || 0}
              </td>

              <td className="px-5 py-4">
                <Status active={row.is_active} />
              </td>

              <td className="px-5 py-4 text-right">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() =>
                    onDelete("academic-programs", row.id, row.name)
                  }
                />
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyRow columns={6} label="programs or tracks" />
      )}
    </tbody>
  </table>
);

/* =========================================================
   SCHOOL YEAR TABLE
========================================================= */

const SchoolYearTable = ({ rows, onDelete, pendingActionId }) => (
  <table className="w-full min-w-[850px] border-collapse text-left">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <TableHeader label="School Year" />
        <TableHeader label="Start Date" />
        <TableHeader label="End Date" />
        <TableHeader label="Sections" />
        <TableHeader label="Status" />
        <TableHeader label="Action" align="right" />
      </tr>
    </thead>

    <tbody>
      {rows.length > 0 ? (
        rows.map((row) => {
          const actionId = `delete-school-years-${row.id}`;

          return (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-5 py-4 text-sm font-medium text-slate-900">
                {row.name || "-"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.start_date || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.end_date || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.sections_count || 0}
              </td>

              <td className="px-5 py-4">
                <Status active={row.is_active} />
              </td>

              <td className="px-5 py-4 text-right">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => onDelete("school-years", row.id, row.name)}
                />
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyRow columns={6} label="school years" />
      )}
    </tbody>
  </table>
);

/* =========================================================
   GRADE LEVEL TABLE
========================================================= */

const GradeLevelTable = ({ rows, onDelete, pendingActionId }) => (
  <table className="w-full min-w-[950px] border-collapse text-left">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <TableHeader label="Grade Level" />
        <TableHeader label="Academic Unit" />
        <TableHeader label="Program / Track" />
        <TableHeader label="Sort Order" />
        <TableHeader label="Sections" />
        <TableHeader label="Status" />
        <TableHeader label="Action" align="right" />
      </tr>
    </thead>

    <tbody>
      {rows.length > 0 ? (
        rows.map((row) => {
          const actionId = `delete-grade-levels-${row.id}`;

          return (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-5 py-4 text-sm font-medium text-slate-900">
                {row.name || "-"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.academic_unit?.name || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.academic_program?.name || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.sort_order ?? 0}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.sections_count || 0}
              </td>

              <td className="px-5 py-4">
                <Status active={row.is_active} />
              </td>

              <td className="px-5 py-4 text-right">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => onDelete("grade-levels", row.id, row.name)}
                />
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyRow columns={7} label="grade levels" />
      )}
    </tbody>
  </table>
);

/* =========================================================
   SECTION TABLE
========================================================= */

const SectionTable = ({
  rows,
  teachers,
  onDelete,
  onToggleTeacher,
  pendingActionId,
}) => (
  <table className="w-full min-w-[1100px] border-collapse text-left">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <TableHeader label="Grade / Section" />
        <TableHeader label="School Year" />
        <TableHeader label="Capacity" />
        <TableHeader label="Teachers" />
        <TableHeader label="Status" />
        <TableHeader label="Action" align="right" />
      </tr>
    </thead>

    <tbody>
      {rows.length > 0 ? (
        rows.map((row) => {
          const deleteActionId = `delete-sections-${row.id}`;

          return (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-slate-900">
                  {row.grade_level?.name || "Grade"} - {row.name}
                </p>

                <p className="mt-1 text-xs font-normal text-slate-400">
                  {row.grade_level?.academic_program?.name ||
                    row.grade_level?.academic_unit?.name ||
                    "—"}
                </p>
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.school_year?.name || "—"}
              </td>

              <td className="px-5 py-4 text-sm font-normal text-slate-600">
                {row.capacity || "—"}
              </td>

              <td className="min-w-[360px] px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => {
                      const selected = (row.teachers || []).some(
                        (item) => String(item.id) === String(teacher.id),
                      );

                      const name = teacher.staff_profile?.first_name
                        ? `${teacher.staff_profile.first_name} ${
                            teacher.staff_profile.last_name || ""
                          }`.trim()
                        : teacher.username;

                      const actionId = `teacher-${row.id}-${teacher.id}`;

                      const loading = pendingActionId === actionId;

                      return (
                        <button
                          key={teacher.id}
                          type="button"
                          disabled={Boolean(pendingActionId)}
                          title={selected ? "Remove teacher" : "Assign teacher"}
                          onClick={() => onToggleTeacher(row, teacher.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected
                              ? "bg-cyan-600 text-white hover:bg-cyan-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {loading && <FiLoader className="animate-spin" />}

                          {name}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-sm font-normal text-slate-400">
                      No active teacher accounts
                    </span>
                  )}
                </div>
              </td>

              <td className="px-5 py-4">
                <Status active={row.is_active} />
              </td>

              <td className="px-5 py-4 text-right">
                <DeleteButton
                  loading={pendingActionId === deleteActionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => onDelete("sections", row.id, row.name)}
                />
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyRow columns={6} label="sections" />
      )}
    </tbody>
  </table>
);

/* =========================================================
   STATUS
========================================================= */

const Status = ({ active }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
    }`}
  >
    {active ? <FiCheckCircle /> : <FiXCircle />}

    {active ? "Active" : "Inactive"}
  </span>
);

/* =========================================================
   DELETE BUTTON
========================================================= */

const DeleteButton = ({ onClick, loading = false, disabled = false }) => (
  <button
    type="button"
    title="Delete"
    aria-label="Delete"
    disabled={disabled}
    onClick={onClick}
    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
  >
    {loading ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
  </button>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyRow = ({ columns, label }) => (
  <tr>
    <td colSpan={columns}>
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-normal text-slate-600">No {label} found.</p>

        <p className="mt-1 text-xs font-normal text-slate-400">
          Try adjusting your search or add a new record.
        </p>
      </div>
    </td>
  </tr>
);

/* =========================================================
   PAGINATION FOOTER
========================================================= */

const PaginationFooter = ({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  showingStart,
  showingEnd,
  onRowsPerPageChange,
  onPageChange,
}) => (
  <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
    {/* LEFT */}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-normal text-slate-500">Show</span>

        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="text-sm font-normal text-slate-500">entries</span>
      </div>

      <p className="text-sm font-normal text-slate-500">
        Showing {showingStart} to {showingEnd} of {totalRows} records
      </p>
    </div>

    {/* RIGHT */}

    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
      >
        <FiChevronLeft />

        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="whitespace-nowrap rounded-md bg-slate-50 px-3 py-2 text-sm font-normal text-slate-600">
        Page {currentPage} of {totalPages}
      </div>

      <button
        type="button"
        disabled={currentPage === totalPages || totalRows === 0}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
      >
        <span className="hidden sm:inline">Next</span>

        <FiChevronRight />
      </button>
    </div>
  </div>
);

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);

/* =========================================================
   PAGE SKELETON
========================================================= */

const PageSkeleton = () => (
  <div className="space-y-5 [font-family:'Poppins',sans-serif]">
    {/* HEADER */}

    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>

    {/* SUMMARY CARDS */}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-md bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-10" />
        </div>
      ))}
    </div>

    {/* TABLE */}

    <div className="overflow-hidden rounded-md bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <Skeleton className="h-5 w-36" />

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className="px-5 py-4">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100">
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-16" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-7 w-24 rounded-md" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-7 w-20 rounded-md" />
                </td>
                <td className="px-5 py-5">
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-44" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  </div>
);
