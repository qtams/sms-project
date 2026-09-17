import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiLoader,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";

import api from "../../services/api";

import AcademicUnitModal from "../../components/modals/academic/AcademicUnitModal";
import ProgramModal from "../../components/modals/academic/ProgramModal";
import SchoolYearModal from "../../components/modals/academic/SchoolYearModal";
import GradeLevelModal from "../../components/modals/academic/GradeLevelModal";
import SectionModal from "../../components/modals/academic/SectionModal";

import { DataTable } from "../../components/data-table";
import { Skeleton } from "../../components/skeleton";

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
  parent_id: "",
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
   UTILITIES
========================================================= */

const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const csvValue = (value) => {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
};

const normalizeId = (value) =>
  value === null || value === undefined || value === "" ? null : String(value);

const formatEducationLevel = (value) =>
  value === "higher_education" ? "Higher Education" : "Basic Education";

const titleCase = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const buildAcademicUnitTree = (units = []) => {
  const normalized = units.map((item) => ({
    ...item,
    _id: normalizeId(item.id),
    _parentId: normalizeId(item.parent_id),
  }));

  const idMap = new Map(normalized.map((item) => [item._id, item]));
  const childrenMap = new Map();

  normalized.forEach((item) => {
    const parentKey =
      item._parentId && idMap.has(item._parentId) ? item._parentId : "__root__";

    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }

    childrenMap.get(parentKey).push(item);
  });

  for (const children of childrenMap.values()) {
    children.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }

  const flattened = [];
  const visited = new Set();

  const walk = (parentKey, depth, parentPath = []) => {
    const children = childrenMap.get(parentKey) || [];

    children.forEach((item) => {
      if (visited.has(item._id)) {
        return;
      }

      visited.add(item._id);

      const path = [...parentPath, item.name].filter(Boolean);

      flattened.push({
        ...item,
        hierarchyDepth: depth,
        hierarchyPath: path.join(" / "),
        childrenCount: (childrenMap.get(item._id) || []).length,
        hasChildren: (childrenMap.get(item._id) || []).length > 0,
      });

      walk(item._id, depth + 1, path);
    });
  };

  walk("__root__", 0, []);

  normalized.forEach((item) => {
    if (!visited.has(item._id)) {
      flattened.push({
        ...item,
        hierarchyDepth: 0,
        hierarchyPath: item.name || "",
        childrenCount: 0,
        hasChildren: false,
      });
    }
  });

  return {
    rows: flattened,
    idMap,
  };
};

/* =========================================================
   UI STATE
   Keep page navigation, filters, pagination, and drill-down
   context in one predictable reducer instead of many
   unrelated useState calls.
========================================================= */

const initialUiState = {
  activeView: "academicUnits",
  showAddForm: false,
  search: "",
  statusFilter: "All",
  hierarchyFilters: {},
  currentPage: 1,
  rowsPerPage: 10,
  selectedUnitId: null,
  selectedProgramId: null,
  selectedGradeLevelId: null,
  schoolYearContextId: null,
  showAdvancedFilters: false,
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case "PATCH":
      return {
        ...state,
        ...action.payload,
      };

    case "SET_FILTERS":
      return {
        ...state,
        hierarchyFilters: action.payload,
        currentPage: 1,
      };

    case "RESET_FILTERS":
      return {
        ...state,
        search: "",
        statusFilter: "All",
        hierarchyFilters: action.payload || {},
        currentPage: 1,
      };

    case "CLEAR_CONTEXT":
      return {
        ...state,
        selectedUnitId: null,
        selectedProgramId: null,
        selectedGradeLevelId: null,
        hierarchyFilters: {},
        search: "",
        statusFilter: "All",
        currentPage: 1,
      };

    default:
      return state;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AcademicSetup() {
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

  const [ui, uiDispatch] = useReducer(uiReducer, initialUiState);

  const {
    activeView,
    showAddForm,
    search,
    statusFilter,
    hierarchyFilters,
    currentPage,
    rowsPerPage,
    selectedUnitId,
    selectedProgramId,
    selectedGradeLevelId,
    schoolYearContextId,
    showAdvancedFilters,
  } = ui;

  // Small compatibility setters keep the rest of the page readable.
  const setActiveView = (value) =>
    uiDispatch({ type: "PATCH", payload: { activeView: value } });

  const setShowAddForm = (value) =>
    uiDispatch({ type: "PATCH", payload: { showAddForm: value } });

  const setSearch = (value) =>
    uiDispatch({ type: "PATCH", payload: { search: value } });

  const setStatusFilter = (value) =>
    uiDispatch({ type: "PATCH", payload: { statusFilter: value } });

  const setHierarchyFilters = (valueOrUpdater) => {
    const next =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(hierarchyFilters)
        : valueOrUpdater;

    uiDispatch({ type: "PATCH", payload: { hierarchyFilters: next } });
  };

  const setCurrentPage = (value) =>
    uiDispatch({ type: "PATCH", payload: { currentPage: value } });

  const setRowsPerPage = (value) =>
    uiDispatch({ type: "PATCH", payload: { rowsPerPage: value } });

  /*
   * Academic Structure opens parent units by default on first load.
   * After that, the user's expand/collapse choices are preserved.
   */
  const [expandedUnitIds, setExpandedUnitIds] = useState(() => new Set());
  const didInitializeExpandedUnits = useRef(false);

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

      const schoolYears = Array.isArray(payload.schoolYears)
        ? payload.schoolYears
        : [];
      const academicUnits = Array.isArray(payload.academicUnits)
        ? payload.academicUnits
        : [];
      const academicPrograms = Array.isArray(payload.academicPrograms)
        ? payload.academicPrograms
        : [];
      const gradeLevels = Array.isArray(payload.gradeLevels)
        ? payload.gradeLevels
        : [];
      const sections = Array.isArray(payload.sections) ? payload.sections : [];
      const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];

      setData({
        schoolYears,
        academicUnits,
        academicPrograms,
        gradeLevels,
        sections,
        teachers,
      });

      /*
       * Default-open only on the first successful load.
       * Parent IDs tell us which rows actually have children.
       */
      if (!didInitializeExpandedUnits.current) {
        const parentIds = new Set(
          academicUnits
            .map((item) => normalizeId(item.parent_id))
            .filter(Boolean),
        );

        setExpandedUnitIds(
          new Set(
            academicUnits
              .filter((item) => parentIds.has(normalizeId(item.id)))
              .map((item) => normalizeId(item.id))
              .filter(Boolean),
          ),
        );

        didInitializeExpandedUnits.current = true;
      }
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
     TREE DATA
  ======================================================= */

  const academicUnitTree = useMemo(
    () => buildAcademicUnitTree(data.academicUnits),
    [data.academicUnits],
  );

  const toggleAcademicUnit = (unitId) => {
    const id = normalizeId(unitId);

    if (!id) {
      return;
    }

    setExpandedUnitIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const expandAllAcademicUnits = () => {
    setExpandedUnitIds(
      new Set(
        academicUnitTree.rows
          .filter((item) => item.hasChildren)
          .map((item) => item._id),
      ),
    );
  };

  const collapseAllAcademicUnits = () => {
    setExpandedUnitIds(new Set());
  };

  /* =======================================================
     VIEW CONFIG
  ======================================================= */

  const viewConfig = useMemo(
    () => ({
      academicUnits: {
        key: "academicUnits",
        step: 1,
        label: "Academic Structure",
        singular: "Organizational Unit",
        description: "Divisions, colleges, and departments",
        value: data.academicUnits.length,
      },
      academicPrograms: {
        key: "academicPrograms",
        step: 2,
        label: "Programs / Tracks",
        singular: "Academic Offering",
        description: "Programs, tracks, strands, and specializations",
        value: data.academicPrograms.length,
      },
      gradeLevels: {
        key: "gradeLevels",
        step: 3,
        label: "Grade / Year Levels",
        singular: "Grade / Year Level",
        description: "Ordered grade and year levels",
        value: data.gradeLevels.length,
      },
      sections: {
        key: "sections",
        step: 4,
        label: "Sections",
        singular: "Section",
        description: "Classes, capacity, and teacher assignments",
        value: data.sections.length,
      },
      schoolYears: {
        key: "schoolYears",
        label: "School Years",
        singular: "School Year",
        description: "Academic delivery periods",
        value: data.schoolYears.length,
      },
    }),
    [data],
  );

  const workflowSteps = [
    viewConfig.academicUnits,
    viewConfig.academicPrograms,
    viewConfig.gradeLevels,
    viewConfig.sections,
  ];

  const activeCard = viewConfig[activeView] || viewConfig.academicUnits;

  const selectedUnit = useMemo(
    () =>
      data.academicUnits.find(
        (item) => normalizeId(item.id) === normalizeId(selectedUnitId),
      ) || null,
    [data.academicUnits, selectedUnitId],
  );

  const selectedProgram = useMemo(
    () =>
      data.academicPrograms.find(
        (item) => normalizeId(item.id) === normalizeId(selectedProgramId),
      ) || null,
    [data.academicPrograms, selectedProgramId],
  );

  const selectedGradeLevel = useMemo(
    () =>
      data.gradeLevels.find(
        (item) => normalizeId(item.id) === normalizeId(selectedGradeLevelId),
      ) || null,
    [data.gradeLevels, selectedGradeLevelId],
  );

  const activeSchoolYear = useMemo(() => {
    if (schoolYearContextId) {
      return (
        data.schoolYears.find(
          (item) => normalizeId(item.id) === normalizeId(schoolYearContextId),
        ) || null
      );
    }

    return (
      data.schoolYears.find((item) => item.is_active) ||
      data.schoolYears[0] ||
      null
    );
  }, [data.schoolYears, schoolYearContextId]);

  useEffect(() => {
    if (schoolYearContextId || data.schoolYears.length === 0) {
      return;
    }

    const nextYear =
      data.schoolYears.find((item) => item.is_active) || data.schoolYears[0];

    if (nextYear?.id) {
      uiDispatch({
        type: "PATCH",
        payload: {
          schoolYearContextId: normalizeId(nextYear.id),
        },
      });
    }
  }, [data.schoolYears, schoolYearContextId]);

  const selectView = (key) => {
    const clearsHierarchy = ["academicUnits", "schoolYears"].includes(key);

    const nextSelectedUnitId = clearsHierarchy ? null : selectedUnitId;

    const nextSelectedProgramId =
      clearsHierarchy || key === "academicPrograms" ? null : selectedProgramId;

    const nextSelectedGradeLevelId =
      clearsHierarchy || ["academicPrograms", "gradeLevels"].includes(key)
        ? null
        : selectedGradeLevelId;

    const nextFilters = {};

    if (nextSelectedUnitId && key !== "academicUnits") {
      nextFilters.academicUnitId = normalizeId(nextSelectedUnitId);
    }

    if (nextSelectedProgramId && ["gradeLevels", "sections"].includes(key)) {
      nextFilters.academicProgramId = normalizeId(nextSelectedProgramId);
    }

    if (nextSelectedGradeLevelId && key === "sections") {
      nextFilters.gradeLevelId = normalizeId(nextSelectedGradeLevelId);
    }

    if (activeSchoolYear?.id && key === "sections") {
      nextFilters.schoolYearId = normalizeId(activeSchoolYear.id);
    }

    uiDispatch({
      type: "PATCH",
      payload: {
        activeView: key,
        showAddForm: false,
        search: "",
        statusFilter: "All",
        hierarchyFilters: nextFilters,
        currentPage: 1,
        showAdvancedFilters: false,
        selectedUnitId: nextSelectedUnitId,
        selectedProgramId: nextSelectedProgramId,
        selectedGradeLevelId: nextSelectedGradeLevelId,
      },
    });
  };

  const selectAcademicUnit = (item) => {
    const unitId = normalizeId(item?.id);

    uiDispatch({
      type: "PATCH",
      payload: {
        activeView: "academicPrograms",
        selectedUnitId: unitId,
        selectedProgramId: null,
        selectedGradeLevelId: null,
        showAdvancedFilters: false,
        search: "",
        statusFilter: "All",
        hierarchyFilters: unitId ? { academicUnitId: unitId } : {},
        currentPage: 1,
      },
    });
  };

  const selectAcademicProgram = (item) => {
    const programId = normalizeId(item?.id);
    const unitId = normalizeId(item?.academic_unit_id || selectedUnitId);

    uiDispatch({
      type: "PATCH",
      payload: {
        activeView: "gradeLevels",
        selectedUnitId: unitId,
        selectedProgramId: programId,
        selectedGradeLevelId: null,
        showAdvancedFilters: false,
        search: "",
        statusFilter: "All",
        hierarchyFilters: {
          ...(unitId ? { academicUnitId: unitId } : {}),
          ...(programId ? { academicProgramId: programId } : {}),
        },
        currentPage: 1,
      },
    });
  };

  const selectGradeLevel = (item) => {
    const gradeLevelId = normalizeId(item?.id);
    const unitId = normalizeId(item?.academic_unit_id || selectedUnitId);
    const programId = normalizeId(
      item?.academic_program_id || selectedProgramId,
    );

    uiDispatch({
      type: "PATCH",
      payload: {
        activeView: "sections",
        selectedUnitId: unitId,
        selectedProgramId: programId,
        selectedGradeLevelId: gradeLevelId,
        showAdvancedFilters: false,
        search: "",
        statusFilter: "All",
        hierarchyFilters: {
          ...(unitId ? { academicUnitId: unitId } : {}),
          ...(programId ? { academicProgramId: programId } : {}),
          ...(gradeLevelId ? { gradeLevelId } : {}),
          ...(activeSchoolYear?.id
            ? { schoolYearId: normalizeId(activeSchoolYear.id) }
            : {}),
        },
        currentPage: 1,
      },
    });
  };

  const clearContext = () => {
    uiDispatch({ type: "CLEAR_CONTEXT" });
  };

  const handleSchoolYearContextChange = (value) => {
    const nextYearId = normalizeId(value);

    uiDispatch({
      type: "PATCH",
      payload: {
        schoolYearContextId: nextYearId,
        hierarchyFilters:
          activeView === "sections"
            ? {
                ...hierarchyFilters,
                schoolYearId: nextYearId || "",
              }
            : hierarchyFilters,
        currentPage: 1,
      },
    });
  };

  const openAddForm = () => {
    if (activeView === "academicUnits" && selectedUnitId) {
      setUnit((current) => ({
        ...current,
        parent_id: selectedUnitId,
      }));
    }

    if (activeView === "academicPrograms" && selectedUnitId) {
      setProgram((current) => ({
        ...current,
        academic_unit_id: selectedUnitId,
      }));
    }

    if (activeView === "gradeLevels") {
      setGrade((current) => ({
        ...current,
        academic_unit_id: selectedUnitId || current.academic_unit_id,
        academic_program_id: selectedProgramId || current.academic_program_id,
      }));
    }

    if (activeView === "sections") {
      setSection((current) => ({
        ...current,
        grade_level_id: selectedGradeLevelId || current.grade_level_id,
        school_year_id: activeSchoolYear?.id || current.school_year_id,
      }));
    }

    setShowAddForm(true);
  };

  /* =======================================================
     FILTER HANDLERS
  ======================================================= */

  const handleHierarchyFilterChange = (key, value) => {
    setHierarchyFilters((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "academicUnitId") {
        next.academicProgramId = "";
        next.gradeLevelId = "";
      }

      if (key === "academicProgramId") {
        next.gradeLevelId = "";
      }

      return next;
    });

    setCurrentPage(1);
  };

  const resetViewFilters = () => {
    const contextFilters = {};

    if (selectedUnitId && activeView !== "academicUnits") {
      contextFilters.academicUnitId = normalizeId(selectedUnitId);
    }

    if (selectedProgramId && ["gradeLevels", "sections"].includes(activeView)) {
      contextFilters.academicProgramId = normalizeId(selectedProgramId);
    }

    if (selectedGradeLevelId && activeView === "sections") {
      contextFilters.gradeLevelId = normalizeId(selectedGradeLevelId);
    }

    if (activeSchoolYear?.id && activeView === "sections") {
      contextFilters.schoolYearId = normalizeId(activeSchoolYear.id);
    }

    uiDispatch({
      type: "PATCH",
      payload: {
        search: "",
        statusFilter: "All",
        hierarchyFilters: contextFilters,
        currentPage: 1,
      },
    });
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
        : !row.is_active;
    };

    const matchesSearch = (values) =>
      !term ||
      values
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(term);

    /*
     * Academic Structure uses the flattened hierarchy rows.
     *
     * Without this branch the Structure view falls through
     * to the Sections filter, which makes the list empty even
     * though the summary count is correct.
     */
    if (activeView === "academicUnits") {
      return academicUnitTree.rows.filter(
        (row) =>
          matchesSearch([
            row.code,
            row.name,
            row.type,
            row.education_level,
            row.parent?.name,
            row.hierarchyPath,
          ]) && matchesStatus(row),
      );
    }

    if (activeView === "academicPrograms") {
      const rows = data.academicPrograms.filter(
        (row) =>
          matchesSearch([
            row.code,
            row.name,
            row.program_type,
            row.academic_unit?.name,
            row.parent?.name,
          ]) &&
          matchesStatus(row) &&
          (!hierarchyFilters.academicUnitId ||
            String(row.academic_unit_id) === hierarchyFilters.academicUnitId) &&
          (!hierarchyFilters.programType ||
            row.program_type === hierarchyFilters.programType) &&
          (!hierarchyFilters.parentProgramId ||
            (hierarchyFilters.parentProgramId === "root"
              ? !row.parent_id
              : String(row.parent_id) === hierarchyFilters.parentProgramId)),
      );

      const textCompare = (left, right) =>
        String(left || "").localeCompare(String(right || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });

      return rows.sort((left, right) => {
        const sortBy = hierarchyFilters.sortBy || "academicUnit";

        if (sortBy === "name") {
          return textCompare(left.name, right.name);
        }

        if (sortBy === "offeringType") {
          return (
            textCompare(left.program_type, right.program_type) ||
            textCompare(left.name, right.name)
          );
        }

        const leftUnit = `${left.academic_unit?.parent?.name || ""} ${
          left.academic_unit?.name || ""
        }`;
        const rightUnit = `${right.academic_unit?.parent?.name || ""} ${
          right.academic_unit?.name || ""
        }`;

        return (
          textCompare(leftUnit, rightUnit) ||
          textCompare(left.program_type, right.program_type) ||
          textCompare(left.parent?.name, right.parent?.name) ||
          textCompare(left.name, right.name)
        );
      });
    }

    if (activeView === "schoolYears") {
      return data.schoolYears.filter(
        (row) =>
          matchesSearch([row.name, row.start_date, row.end_date]) &&
          matchesStatus(row) &&
          (!hierarchyFilters.schoolYearId ||
            String(row.id) === hierarchyFilters.schoolYearId),
      );
    }

    if (activeView === "gradeLevels") {
      const rows = data.gradeLevels.filter(
        (row) =>
          matchesSearch([
            row.name,
            row.academic_unit?.name,
            row.academic_program?.name,
            row.sort_order,
          ]) &&
          matchesStatus(row) &&
          (!hierarchyFilters.academicUnitId ||
            String(row.academic_unit_id) === hierarchyFilters.academicUnitId) &&
          (!hierarchyFilters.academicProgramId ||
            (hierarchyFilters.academicProgramId === "direct"
              ? !row.academic_program_id
              : String(row.academic_program_id) ===
                hierarchyFilters.academicProgramId)),
      );

      const textCompare = (left, right) =>
        String(left || "").localeCompare(String(right || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });

      return rows.sort((left, right) => {
        const sortBy = hierarchyFilters.sortBy || "academicUnit";

        if (sortBy === "name") {
          return textCompare(left.name, right.name);
        }

        if (sortBy === "levelOrder") {
          return (
            Number(left.sort_order || 0) - Number(right.sort_order || 0) ||
            textCompare(left.name, right.name)
          );
        }

        const leftUnit = `${left.academic_unit?.parent?.name || ""} ${
          left.academic_unit?.name || ""
        }`;
        const rightUnit = `${right.academic_unit?.parent?.name || ""} ${
          right.academic_unit?.name || ""
        }`;

        return (
          textCompare(leftUnit, rightUnit) ||
          textCompare(
            left.academic_program?.name,
            right.academic_program?.name,
          ) ||
          Number(left.sort_order || 0) - Number(right.sort_order || 0) ||
          textCompare(left.name, right.name)
        );
      });
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
        ]) &&
        matchesStatus(row) &&
        (!hierarchyFilters.schoolYearId ||
          String(row.school_year_id) === hierarchyFilters.schoolYearId) &&
        (!hierarchyFilters.academicUnitId ||
          String(row.grade_level?.academic_unit_id) ===
            hierarchyFilters.academicUnitId) &&
        (!hierarchyFilters.academicProgramId ||
          (hierarchyFilters.academicProgramId === "direct"
            ? !row.grade_level?.academic_program_id
            : String(row.grade_level?.academic_program_id) ===
              hierarchyFilters.academicProgramId)) &&
        (!hierarchyFilters.gradeLevelId ||
          String(row.grade_level_id) === hierarchyFilters.gradeLevelId),
    );
  }, [
    academicUnitTree.rows,
    activeView,
    data,
    hierarchyFilters,
    search,
    statusFilter,
  ]);

  /* =======================================================
     COLLAPSIBLE ACADEMIC UNIT ROWS
  ======================================================= */

  const visibleRows = useMemo(() => {
    if (activeView !== "academicUnits") {
      return filteredRows;
    }

    const visibleIdSet = new Set(
      filteredRows.map((row) => normalizeId(row.id)),
    );

    return filteredRows.filter((row) => {
      let parentId = normalizeId(row.parent_id);
      const visited = new Set();

      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);

        /*
         * If the ancestor is part of the filtered result,
         * respect its expanded/collapsed state.
         *
         * If the ancestor was filtered out, keep the matching
         * child visible so searches do not mysteriously disappear.
         */
        if (visibleIdSet.has(parentId) && !expandedUnitIds.has(parentId)) {
          return false;
        }

        parentId = normalizeId(academicUnitTree.idMap.get(parentId)?.parent_id);
      }

      return true;
    });
  }, [academicUnitTree.idMap, activeView, expandedUnitIds, filteredRows]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedRows = useMemo(
    () => visibleRows.slice(startIndex, endIndex),
    [endIndex, startIndex, visibleRows],
  );

  const showingStart = visibleRows.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, visibleRows.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          formatEducationLevel(item.education_level),
          item.programs_count || 0,
          item.grade_levels_count || 0,
          item.is_active ? "Active" : "Inactive",
        ],
      },

      academicPrograms: {
        headers: [
          "Code",
          "Academic Offering",
          "Parent Offering",
          "Academic Home",
          "Type",
          "Grade Levels",
          "Status",
        ],
        row: (item) => [
          item.code,
          item.name,
          item.parent?.name,
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
     TABLE COLUMNS
  ======================================================= */

  const columns = useMemo(() => {
    if (activeView === "academicPrograms") {
      return [
        {
          key: "offering",
          label: "Academic Offering",
          render: (row) => (
            <button
              type="button"
              onClick={() => selectAcademicProgram(row)}
              className="group flex min-w-[190px] items-center gap-2 text-left"
              title="Open grade / year levels"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-slate-900 transition group-hover:text-[#019BC2]">
                  {row.name || "-"}
                </span>

                <span className="mt-1 block text-[10px] text-[#94a3b8]">
                  {row.code || "-"}
                </span>
              </span>

              <FiChevronRight
                size={13}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#01B8E5]"
              />
            </button>
          ),
        },
        {
          key: "parentOffering",
          label: "Parent Offering",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.parent?.name || "Top level"}
            </span>
          ),
        },
        {
          key: "academicHome",
          label: "Academic Home",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.academic_unit?.parent?.name
                ? `${row.academic_unit.parent.name} → `
                : ""}
              {row.academic_unit?.name || "—"}
            </span>
          ),
        },
        {
          key: "type",
          label: "Type",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {titleCase(row.program_type) || "—"}
            </span>
          ),
        },
        {
          key: "gradeLevels",
          label: "Grade Levels",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.grade_levels_count || 0}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (row) => <Status active={row.is_active} />,
        },
        {
          key: "action",
          label: "Action",
          render: (row) => {
            const actionId = `delete-academic-programs-${row.id}`;

            return (
              <div className="flex justify-end">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => remove("academic-programs", row.id, row.name)}
                />
              </div>
            );
          },
        },
      ];
    }

    if (activeView === "schoolYears") {
      return [
        {
          key: "schoolYear",
          label: "School Year",
          render: (row) => (
            <span className="text-[12px] font-medium text-slate-900">
              {row.name || "-"}
            </span>
          ),
        },
        {
          key: "startDate",
          label: "Start Date",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.start_date || "—"}
            </span>
          ),
        },
        {
          key: "endDate",
          label: "End Date",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.end_date || "—"}
            </span>
          ),
        },
        {
          key: "sections",
          label: "Sections",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.sections_count || 0}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (row) => <Status active={row.is_active} />,
        },
        {
          key: "action",
          label: "Action",
          render: (row) => {
            const actionId = `delete-school-years-${row.id}`;

            return (
              <div className="flex justify-end">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => remove("school-years", row.id, row.name)}
                />
              </div>
            );
          },
        },
      ];
    }

    if (activeView === "gradeLevels") {
      return [
        {
          key: "gradeLevel",
          label: "Grade / Year Level",
          render: (row) => (
            <button
              type="button"
              onClick={() => selectGradeLevel(row)}
              className="group flex min-w-[170px] items-center gap-2 text-left"
              title="Open sections"
            >
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-900 transition group-hover:text-[#019BC2]">
                {row.name || "-"}
              </span>

              <FiChevronRight
                size={13}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#01B8E5]"
              />
            </button>
          ),
        },
        {
          key: "academicUnit",
          label: "Academic Unit",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.academic_unit?.name || "—"}
            </span>
          ),
        },
        {
          key: "programTrack",
          label: "Program / Track",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.academic_program?.name || "—"}
            </span>
          ),
        },
        {
          key: "sortOrder",
          label: "Sort Order",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.sort_order ?? 0}
            </span>
          ),
        },
        {
          key: "sections",
          label: "Sections",
          render: (row) => (
            <span className="text-[12px] text-[#69768b]">
              {row.sections_count || 0}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (row) => <Status active={row.is_active} />,
        },
        {
          key: "action",
          label: "Action",
          render: (row) => {
            const actionId = `delete-grade-levels-${row.id}`;

            return (
              <div className="flex justify-end">
                <DeleteButton
                  loading={pendingActionId === actionId}
                  disabled={Boolean(pendingActionId)}
                  onClick={() => remove("grade-levels", row.id, row.name)}
                />
              </div>
            );
          },
        },
      ];
    }

    return [
      {
        key: "gradeSection",
        label: "Grade / Section",
        render: (row) => (
          <div>
            <p className="text-[12px] font-medium text-slate-900">
              {row.grade_level?.name || "Grade"} - {row.name}
            </p>

            <p className="mt-1 text-[10px] text-[#94a3b8]">
              {row.grade_level?.academic_program?.name ||
                row.grade_level?.academic_unit?.name ||
                "—"}
            </p>
          </div>
        ),
      },
      {
        key: "schoolYear",
        label: "School Year",
        render: (row) => (
          <span className="text-[12px] text-[#69768b]">
            {row.school_year?.name || "—"}
          </span>
        ),
      },
      {
        key: "capacity",
        label: "Capacity",
        render: (row) => (
          <span className="text-[12px] text-[#69768b]">
            {row.capacity || "—"}
          </span>
        ),
      },
      {
        key: "teachers",
        label: "Teachers",
        render: (row) => (
          <div className="flex min-w-[320px] flex-wrap gap-1.5">
            {data.teachers.length > 0 ? (
              data.teachers.map((teacher) => {
                const selected = (row.teachers || []).some(
                  (item) => String(item.id) === String(teacher.id),
                );

                const name = teacher.staff_profile?.first_name
                  ? `${teacher.staff_profile.first_name} ${
                      teacher.staff_profile.last_name || ""
                    }`.trim()
                  : teacher.username;

                const actionId = `teacher-${row.id}-${teacher.id}`;

                const actionLoading = pendingActionId === actionId;

                return (
                  <button
                    key={teacher.id}
                    type="button"
                    disabled={Boolean(pendingActionId)}
                    title={selected ? "Remove teacher" : "Assign teacher"}
                    onClick={() => toggleTeacher(row, teacher.id)}
                    className={`
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-md
                      px-2.5
                      py-1.5
                      text-[10px]
                      font-medium
                      transition
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      ${
                        selected
                          ? "bg-[#01B8E5] text-white hover:bg-[#019BC2]"
                          : "bg-slate-100 text-[#69768b] hover:bg-slate-200"
                      }
                    `}
                  >
                    {actionLoading && <FiLoader className="animate-spin" />}

                    {name}
                  </button>
                );
              })
            ) : (
              <span className="text-[12px] text-[#94a3b8]">
                No active teacher accounts
              </span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <Status active={row.is_active} />,
      },
      {
        key: "action",
        label: "Action",
        render: (row) => {
          const actionId = `delete-sections-${row.id}`;

          return (
            <div className="flex justify-end">
              <DeleteButton
                loading={pendingActionId === actionId}
                disabled={Boolean(pendingActionId)}
                onClick={() => remove("sections", row.id, row.name)}
              />
            </div>
          );
        },
      },
    ];
  }, [activeView, data.teachers, expandedUnitIds, pendingActionId]);

  /* =======================================================
     FILTER COMPONENT
  ======================================================= */

  const extraFilters = (
    <HierarchyFilters
      activeView={activeView}
      data={data}
      filters={hierarchyFilters}
      onChange={handleHierarchyFilterChange}
    />
  );

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "All" ||
    Object.values(hierarchyFilters).some(Boolean);

  /* =======================================================
     RENDER
  ======================================================= */

  const contextItems = (() => {
    if (activeView === "academicPrograms") {
      return [selectedUnit?.name].filter(Boolean);
    }

    if (activeView === "gradeLevels") {
      return [selectedUnit?.name, selectedProgram?.name].filter(Boolean);
    }

    if (activeView === "sections") {
      return [
        selectedUnit?.name,
        selectedProgram?.name,
        selectedGradeLevel?.name,
      ].filter(Boolean);
    }

    return [];
  })();

  const railActiveView = activeView === "schoolYears" ? "sections" : activeView;

  return (
    <div
      className="space-y-4 [font-family:'Poppins',sans-serif]"
      data-aos="fade-up"
    >
      <div className="grid items-stretch gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* LEFT WORKFLOW NAVIGATION - SEPARATE CARD */}
        <AcademicStepRail
          loading={loading}
          steps={workflowSteps}
          activeView={railActiveView}
          onChange={selectView}
        />

        {/* RIGHT WORKSPACE - SEPARATE FROM THE NAVIGATION */}
        <main className="min-w-0 space-y-3">
          {/* ACTIVE MODULE HEADER + ACTIONS */}
          <WorkspaceContextBar
            activeCard={activeCard}
            activeView={activeView}
            contextItems={contextItems}
            activeSchoolYear={
              activeView === "sections" ? activeSchoolYear : null
            }
            hasContext={contextItems.length > 0}
            showAdvancedFilters={showAdvancedFilters}
            loading={loading}
            submitting={submitting}
            addLabel={`Add ${activeCard.singular}`}
            onExport={handleExport}
            onAdd={openAddForm}
            onBackToSections={
              activeView === "schoolYears" ? () => selectView("sections") : null
            }
            onToggleAdvancedFilters={() =>
              uiDispatch({
                type: "PATCH",
                payload: {
                  showAdvancedFilters: !showAdvancedFilters,
                },
              })
            }
            onClearContext={() => {
              clearContext();
              setHierarchyFilters(
                activeView === "sections" && activeSchoolYear?.id
                  ? { schoolYearId: normalizeId(activeSchoolYear.id) }
                  : {},
              );
            }}
          />

          {/* SCHOOL YEAR IS SECTION CONTEXT, NOT A WORKFLOW STEP */}
          {(activeView === "sections" || activeView === "schoolYears") && (
            <SchoolYearContextBar
              loading={loading}
              schoolYears={data.schoolYears}
              activeSchoolYear={activeSchoolYear}
              selectedId={schoolYearContextId}
              managing={activeView === "schoolYears"}
              onChange={handleSchoolYearContextChange}
              onManage={() => selectView("schoolYears")}
              onAdd={() => {
                setActiveView("schoolYears");
                setShowAddForm(true);
              }}
            />
          )}

          {/* CONTENT */}
          {activeView === "academicUnits" ? (
            <AcademicStructureList
              rows={visibleRows}
              loading={loading}
              search={search}
              statusFilter={statusFilter}
              expandedUnitIds={expandedUnitIds}
              pendingActionId={pendingActionId}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              onReset={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              onToggle={toggleAcademicUnit}
              onExpandAll={expandAllAcademicUnits}
              onCollapseAll={collapseAllAcademicUnits}
              onDelete={remove}
              onSelect={selectAcademicUnit}
            />
          ) : (
            <DataTable
              title={null}
              subtitle={null}
              columns={columns}
              rows={paginatedRows}
              rowKey={(row) => row.id ?? row.code ?? row.name}
              loading={loading}
              search={{
                value: search,
                onChange: (value) => {
                  setSearch(value);
                  setCurrentPage(1);
                },
                placeholder: `Search ${activeCard.label.toLowerCase()}...`,
              }}
              statusFilter={{
                value: statusFilter,
                onChange: (value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                },
                options: [
                  { label: "All Status", value: "All" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ],
              }}
              extraFilters={
                ["academicPrograms", "gradeLevels"].includes(activeView) ||
                showAdvancedFilters
                  ? extraFilters
                  : null
              }
              onReset={hasFilters ? resetViewFilters : undefined}
              pagination={{
                currentPage,
                totalPages,
                rowsPerPage,
                totalRows: visibleRows.length,
                showingStart,
                showingEnd,
                onRowsPerPageChange: (value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                },
                onPageChange: setCurrentPage,
              }}
              emptyTitle={`No ${activeCard.label.toLowerCase()} found.`}
              emptyDescription={
                contextItems.length > 0
                  ? "Nothing is configured under the selected context yet."
                  : "Try adjusting your search or add a new record."
              }
            />
          )}
        </main>
      </div>

      <style>{`
        @keyframes academicRailArrow {
          0%, 100% { transform: translateY(-2px); opacity: .25; }
          50% { transform: translateY(3px); opacity: .9; }
        }

        .academic-rail-arrow {
          animation: academicRailArrow 1.35s ease-in-out infinite;
        }
      `}</style>

      {/* ADD MODALS */}
      <AcademicUnitModal
        isOpen={showAddForm && activeView === "academicUnits"}
        onClose={() => setShowAddForm(false)}
        value={unit}
        setValue={setUnit}
        units={data.academicUnits}
        programs={data.academicPrograms}
        submitting={submitting}
        onSubmit={(event) =>
          submit(
            event,
            "academic-units",
            {
              ...unit,
              parent_id: unit.parent_id || null,
            },
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
          submit(
            event,
            "academic-programs",
            {
              ...program,
              parent_id: program.parent_id || null,
            },
            () => setProgram(emptyProgram),
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
            {
              ...section,
              capacity: section.capacity || null,
            },
            () => setSection(emptySection),
          )
        }
      />
    </div>
  );
}

/* =========================================================
   HIERARCHY FILTERS
========================================================= */

const filterClass =
  "h-11 min-w-[160px] rounded-md border border-slate-200 bg-white px-3 text-[11px] text-[#69768b] outline-none transition focus:border-[#01B8E5]";

const FilterSelect = ({ label, value, onChange, children }) => (
  <select
    aria-label={label}
    title={label}
    value={value || ""}
    onChange={(event) => onChange(event.target.value)}
    className={filterClass}
  >
    {children}
  </select>
);

const HierarchyFilters = ({ activeView, data, filters, onChange }) => {
  const activeUnits = data.academicUnits.filter((item) => item.is_active);

  const activePrograms = data.academicPrograms.filter((item) => item.is_active);

  const scopedPrograms = activePrograms.filter(
    (item) =>
      !filters.academicUnitId ||
      String(item.academic_unit_id) === filters.academicUnitId,
  );

  const scopedLevels = data.gradeLevels.filter(
    (item) =>
      item.is_active &&
      (!filters.academicUnitId ||
        String(item.academic_unit_id) === filters.academicUnitId) &&
      (!filters.academicProgramId ||
        (filters.academicProgramId === "direct"
          ? !item.academic_program_id
          : String(item.academic_program_id) === filters.academicProgramId)),
  );

  if (activeView === "academicUnits") {
    return (
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Education Level"
          value={filters.educationLevel}
          onChange={(value) => onChange("educationLevel", value)}
        >
          <option value="">All education levels</option>
          <option value="basic">Basic Education</option>
          <option value="higher_education">Higher Education</option>
        </FilterSelect>

        <FilterSelect
          label="Unit Type"
          value={filters.unitType}
          onChange={(value) => onChange("unitType", value)}
        >
          <option value="">All unit types</option>
          <option value="division">Divisions</option>
          <option value="college">Colleges</option>
          <option value="department">Departments</option>
        </FilterSelect>

        <FilterSelect
          label="Parent Unit"
          value={filters.parentUnitId}
          onChange={(value) => onChange("parentUnitId", value)}
        >
          <option value="">All parents</option>
          <option value="root">Top-level units</option>

          {activeUnits
            .filter((item) => ["division", "college"].includes(item.type))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.parent?.name ? `${item.parent.name} → ` : ""}
                {item.name}
              </option>
            ))}
        </FilterSelect>
      </div>
    );
  }

  if (activeView === "academicPrograms") {
    return (
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Academic Home"
          value={filters.academicUnitId}
          onChange={(value) => onChange("academicUnitId", value)}
        >
          <option value="">All academic homes</option>

          {activeUnits
            .filter((item) => ["college", "department"].includes(item.type))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.parent?.name ? `${item.parent.name} → ` : ""}
                {item.name}
              </option>
            ))}
        </FilterSelect>

        <FilterSelect
          label="Sort Programs and Tracks"
          value={filters.sortBy || "academicUnit"}
          onChange={(value) => onChange("sortBy", value)}
        >
          <option value="academicUnit">Sort by academic unit</option>
          <option value="offeringType">Sort by offering type</option>
          <option value="name">Sort by name</option>
        </FilterSelect>

        <FilterSelect
          label="Offering Type"
          value={filters.programType}
          onChange={(value) => onChange("programType", value)}
        >
          <option value="">All offering types</option>
          <option value="program">Degree Programs</option>
          <option value="track">Tracks</option>
          <option value="strand">Strands</option>
          <option value="specialization">Specializations</option>
        </FilterSelect>

        <FilterSelect
          label="Parent Offering"
          value={filters.parentProgramId}
          onChange={(value) => onChange("parentProgramId", value)}
        >
          <option value="">All parents</option>
          <option value="root">Top-level offerings</option>

          {scopedPrograms
            .filter((item) => ["track", "strand"].includes(item.program_type))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.parent?.name ? `${item.parent.name} → ` : ""}
                {item.name}
              </option>
            ))}
        </FilterSelect>
      </div>
    );
  }

  if (activeView === "gradeLevels") {
    return (
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Academic Home"
          value={filters.academicUnitId}
          onChange={(value) => onChange("academicUnitId", value)}
        >
          <option value="">All academic homes</option>

          {activeUnits
            .filter((item) => ["college", "department"].includes(item.type))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.parent?.name ? `${item.parent.name} → ` : ""}
                {item.name}
              </option>
            ))}
        </FilterSelect>

        <FilterSelect
          label="Sort Grade Levels"
          value={filters.sortBy || "academicUnit"}
          onChange={(value) => onChange("sortBy", value)}
        >
          <option value="academicUnit">Sort by academic unit</option>
          <option value="levelOrder">Sort by grade/year order</option>
          <option value="name">Sort by name</option>
        </FilterSelect>

        <FilterSelect
          label="Parent Offering"
          value={filters.academicProgramId}
          onChange={(value) => onChange("academicProgramId", value)}
        >
          <option value="">All offerings</option>
          <option value="direct">Directly under academic home</option>

          {scopedPrograms
            .filter((item) => item.children_count === 0)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.parent?.name ? `${item.parent.name} → ` : ""}
                {item.name}
              </option>
            ))}
        </FilterSelect>
      </div>
    );
  }

  if (activeView === "schoolYears") {
    return (
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="School Year"
          value={filters.schoolYearId}
          onChange={(value) => onChange("schoolYearId", value)}
        >
          <option value="">All school years</option>

          {data.schoolYears.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </FilterSelect>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        label="School Year"
        value={filters.schoolYearId}
        onChange={(value) => onChange("schoolYearId", value)}
      >
        <option value="">All school years</option>

        {data.schoolYears.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Academic Home"
        value={filters.academicUnitId}
        onChange={(value) => onChange("academicUnitId", value)}
      >
        <option value="">All academic homes</option>

        {activeUnits
          .filter((item) => ["college", "department"].includes(item.type))
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.parent?.name ? `${item.parent.name} → ` : ""}
              {item.name}
            </option>
          ))}
      </FilterSelect>

      <FilterSelect
        label="Parent Offering"
        value={filters.academicProgramId}
        onChange={(value) => onChange("academicProgramId", value)}
      >
        <option value="">All offerings</option>
        <option value="direct">Directly under academic home</option>

        {scopedPrograms
          .filter((item) => item.children_count === 0)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.parent?.name ? `${item.parent.name} → ` : ""}
              {item.name}
            </option>
          ))}
      </FilterSelect>

      <FilterSelect
        label="Grade / Year Level"
        value={filters.gradeLevelId}
        onChange={(value) => onChange("gradeLevelId", value)}
      >
        <option value="">All levels</option>

        {scopedLevels.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
};

/* =========================================================
   SCHOOL YEAR CONTEXT
========================================================= */

const SchoolYearContextBar = ({
  loading,
  schoolYears,
  activeSchoolYear,
  selectedId,
  managing,
  onChange,
  onManage,
  onAdd,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-44 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-md border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        managing ? "border-[#01B8E5]/50" : "border-slate-100"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
          School Year
        </span>

        <select
          value={selectedId || activeSchoolYear?.id || ""}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-[150px] rounded-md border border-slate-200 bg-white px-3 text-[11px] text-[#475569] outline-none transition focus:border-[#01B8E5]"
        >
          {schoolYears.length === 0 && (
            <option value="">No school years</option>
          )}

          {schoolYears.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {activeSchoolYear && (
          <Status active={Boolean(activeSchoolYear.is_active)} compact />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onManage}
          className={`h-9 rounded-md px-3 text-[11px] font-medium transition ${
            managing
              ? "bg-cyan-50 text-[#019BC2]"
              : "text-[#69768b] hover:bg-slate-100"
          }`}
        >
          Manage School Years
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[11px] font-medium text-white transition hover:bg-slate-800"
        >
          <FiPlus />
          New
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   LEFT STEP RAIL
========================================================= */

const AcademicStepRail = ({ loading, steps, activeView, onChange }) => {
  if (loading) {
    return (
      <aside className="h-full min-h-[520px] self-stretch rounded-md border border-slate-100 bg-white p-3 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-3 py-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-2.5 w-36" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full min-h-[520px] self-stretch rounded-md border border-slate-100 bg-white p-3 shadow-sm">
      <nav
        aria-label="Academic setup workflow"
        className="flex h-full flex-col"
      >
        {steps.map((step, index) => {
          const active = activeView === step.key;

          return (
            <div key={step.key}>
              <button
                type="button"
                onClick={() => onChange(step.key)}
                aria-current={active ? "step" : undefined}
                className={`relative w-full rounded-md px-3 py-3 text-left transition ${
                  active ? "bg-cyan-50/60" : "hover:bg-slate-50"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[#01B8E5]" />
                )}

                <span
                  className={`block text-[11px] leading-5 ${
                    active
                      ? "font-medium text-[#019BC2]"
                      : "font-normal text-slate-800"
                  }`}
                >
                  {step.label}
                </span>

                <span className="mt-0.5 block text-[9px] font-normal leading-4 text-[#94a3b8]">
                  {step.description}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none flex h-6 items-center"
                >
                  <span className="ml-4 h-full w-px bg-slate-100" />
                  <FiChevronDown
                    size={11}
                    className="academic-rail-arrow -ml-[6px] text-[#01B8E5]/60"
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

/* =========================================================
   WORKSPACE CONTEXT HEADER
========================================================= */

const WorkspaceContextBar = ({
  activeCard,
  activeView,
  contextItems,
  activeSchoolYear,
  hasContext,
  showAdvancedFilters,
  loading,
  submitting,
  addLabel,
  onExport,
  onAdd,
  onBackToSections,
  onToggleAdvancedFilters,
  onClearContext,
}) => (
  <section className="rounded-md border border-slate-100 bg-white px-4 py-4 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-slate-900">
          {activeCard.label}
        </p>

        <p className="mt-1 text-[10px] text-[#94a3b8]">
          {activeCard.description}
        </p>

        {(contextItems.length > 0 || activeSchoolYear) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Context
            </span>

            {contextItems.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-1.5"
              >
                {index > 0 && (
                  <FiChevronRight size={11} className="text-slate-300" />
                )}

                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-[#69768b]">
                  {item}
                </span>
              </span>
            ))}

            {activeSchoolYear && (
              <span className="inline-flex items-center gap-1.5">
                {contextItems.length > 0 && (
                  <FiChevronRight size={11} className="text-slate-300" />
                )}

                <span className="rounded-md bg-cyan-50 px-2 py-1 text-[10px] text-[#019BC2]">
                  {activeSchoolYear.name}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {activeView !== "academicUnits" && activeView !== "schoolYears" && (
          <button
            type="button"
            onClick={onToggleAdvancedFilters}
            className={`h-9 rounded-md px-3 text-[10px] font-medium transition ${
              showAdvancedFilters
                ? "bg-cyan-50 text-[#019BC2]"
                : "text-[#69768b] hover:bg-slate-100"
            }`}
          >
            {showAdvancedFilters ? "Hide filters" : "Advanced filters"}
          </button>
        )}

        {hasContext && (
          <button
            type="button"
            onClick={onClearContext}
            className="h-9 rounded-md px-3 text-[10px] font-medium text-[#69768b] transition hover:bg-slate-100"
          >
            Clear context
          </button>
        )}

        {onBackToSections && (
          <button
            type="button"
            onClick={onBackToSections}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[10px] text-[#69768b] transition hover:bg-slate-50"
          >
            Back to Sections
          </button>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={onExport}
          className="h-9 rounded-md border border-slate-200 bg-white px-3.5 text-[10px] text-[#69768b] transition hover:border-[#01B8E5]/40 hover:text-[#01B8E5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export
        </button>

        <button
          type="button"
          disabled={submitting || loading}
          onClick={onAdd}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#01B8E5] px-3.5 text-[10px] font-medium text-white transition hover:bg-[#019BC2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus />
          {addLabel}
        </button>
      </div>
    </div>
  </section>
);

/* =========================================================
   ACADEMIC STRUCTURE LIST
   - Not a table
   - No pagination
   - Minimal parent / child rows
========================================================= */

const AcademicStructureList = ({
  rows,
  loading,
  search,
  statusFilter,
  expandedUnitIds,
  pendingActionId,
  onSearchChange,
  onStatusFilterChange,
  onReset,
  onToggle,
  onExpandAll,
  onCollapseAll,
  onDelete,
  onSelect,
}) => {
  if (loading) {
    return <AcademicStructureSkeleton />;
  }

  const hasFilter = Boolean(search.trim()) || statusFilter !== "All";

  const activateRow = (row) => {
    if (row.hasChildren) {
      onToggle(row.id);
      return;
    }

    onSelect(row);
  };

  const handleRowKeyDown = (event, row) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateRow(row);
  };

  return (
    <section className="overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search academic structure..."
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-[11px] font-normal text-[#69768b] outline-none focus:border-[#01B8E5]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-normal text-[#69768b] outline-none lg:w-[145px]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onExpandAll}
              className="h-10 rounded-md px-3 text-[10px] font-normal text-[#69768b] transition hover:bg-slate-100"
            >
              Expand all
            </button>

            <button
              type="button"
              onClick={onCollapseAll}
              className="h-10 rounded-md px-3 text-[10px] font-normal text-[#69768b] transition hover:bg-slate-100"
            >
              Collapse all
            </button>

            {hasFilter && (
              <button
                type="button"
                onClick={onReset}
                className="h-10 rounded-md bg-slate-100 px-3 text-[10px] font-normal text-[#69768b] transition hover:bg-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {rows.length > 0 ? (
        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const expanded = expandedUnitIds.has(normalizeId(row.id));
            const actionId = `delete-academic-units-${row.id}`;

            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{
                  height: {
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: {
                    duration: 0.16,
                  },
                  y: {
                    duration: 0.18,
                  },
                  layout: {
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                className="overflow-hidden border-b border-slate-100 last:border-b-0"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => activateRow(row)}
                  onKeyDown={(event) => handleRowKeyDown(event, row)}
                  aria-expanded={row.hasChildren ? expanded : undefined}
                  className={`group flex min-h-[62px] cursor-pointer items-center gap-2 px-4 outline-none transition hover:bg-slate-50/70 focus-visible:bg-slate-50 ${
                    row.hierarchyDepth === 0 ? "bg-slate-50/20" : "bg-white"
                  }`}
                  style={{
                    paddingLeft: `${
                      18 + Math.min(row.hierarchyDepth || 0, 6) * 42
                    }px`,
                  }}
                >
                  {row.hasChildren && (
                    <motion.span
                      aria-hidden="true"
                      animate={{
                        rotate: expanded ? 0 : -90,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400"
                    >
                      <FiChevronDown size={13} />
                    </motion.span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate leading-5 text-slate-900 ${
                        row.hierarchyDepth === 0
                          ? "text-[13px] font-medium"
                          : "text-[12px] font-normal"
                      }`}
                    >
                      {row.name || "-"}
                    </p>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-normal leading-4">
                      <span className="text-[#94a3b8]">
                        {titleCase(row.type)}
                      </span>

                      <span className="text-slate-300">·</span>

                      <span
                        className={
                          row.is_active ? "text-emerald-600" : "text-slate-400"
                        }
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="shrink-0"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <DeleteButton
                      loading={pendingActionId === actionId}
                      disabled={Boolean(pendingActionId)}
                      onClick={() =>
                        onDelete("academic-units", row.id, row.name)
                      }
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-[12px] font-normal text-[#69768b]">
            No academic units found.
          </p>
          <p className="mt-1 text-[10px] font-normal text-[#94a3b8]">
            Try another search or add a new academic unit.
          </p>
        </div>
      )}
    </section>
  );
};

const AcademicStructureSkeleton = () => (
  <div className="overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-3">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-[145px] rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>

    <div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[62px] items-center gap-3 border-b border-slate-100 px-4 last:border-b-0"
          style={{
            paddingLeft: `${18 + (index === 0 || index === 4 ? 0 : 42)}px`,
          }}
        >
          {(index === 0 || index === 4) && (
            <Skeleton className="h-6 w-6 rounded-md" />
          )}

          <div>
            <Skeleton className={`h-3 ${index % 2 === 0 ? "w-32" : "w-40"}`} />
            <Skeleton className="mt-2 h-2.5 w-20" />
          </div>

          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

/* =========================================================
   STATUS
========================================================= */

const Status = ({ active, compact = false }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-md ${
      compact ? "gap-1 px-2 py-1 text-[8px]" : "gap-2 px-3 py-1.5 text-[10px]"
    } ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
    }`}
  >
    {!compact && (active ? <FiCheckCircle /> : <FiXCircle />)}
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
    className="
      inline-flex
      h-9
      w-9
      items-center
      justify-center
      rounded-md
      bg-red-50
      text-red-600
      transition
      hover:bg-red-600
      hover:text-white
      disabled:cursor-not-allowed
      disabled:opacity-40
    "
  >
    {loading ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
  </button>
);
