export const ROLES = {
  ADMIN: "Admin",
  TEACHER_ADMIN: "Teacher Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

const toNumberArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value.map(Number).filter((item) => Number.isFinite(item));
};

export const normalizeUserRole = (role) => {
  const cleanRole = String(role || "")
    .trim()
    .toLowerCase();

  if (cleanRole === "admin") return ROLES.ADMIN;
  if (cleanRole === "teacher admin" || cleanRole === "teacheradmin") {
    return ROLES.TEACHER_ADMIN;
  }
  if (cleanRole === "teacher") return ROLES.TEACHER;
  if (cleanRole === "student") return ROLES.STUDENT;

  return "";
};

export const getAuthUser = () => {
  try {
    const savedUser = JSON.parse(
      localStorage.getItem("spry_auth_user") || "{}",
    );

    return {
      username:
        savedUser.username ||
        localStorage.getItem("spry_username") ||
        localStorage.getItem("username") ||
        "",
      role: normalizeUserRole(
        savedUser.role ||
          localStorage.getItem("spry_user_role") ||
          localStorage.getItem("role"),
      ),
      teacherId:
        savedUser.teacherId || localStorage.getItem("spry_teacher_id") || "",
      studentId:
        savedUser.studentId || localStorage.getItem("spry_student_id") || "",
      schoolIds: toNumberArray(savedUser.schoolIds),
      sectionIds: toNumberArray(savedUser.sectionIds),
    };
  } catch {
    return {
      username: "",
      role: "",
      teacherId: "",
      studentId: "",
      schoolIds: [],
      sectionIds: [],
    };
  }
};

export const getStoredUserRole = () => {
  return getAuthUser().role;
};

export const getStoredTeacherId = () => {
  return getAuthUser().teacherId;
};

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("spry_auth_token"));
};

export const isAdminRole = (role) => {
  return normalizeUserRole(role) === ROLES.ADMIN;
};

export const isTeacherAdminRole = (role) => {
  return normalizeUserRole(role) === ROLES.TEACHER_ADMIN;
};

export const isTeacherRole = (role) => {
  return normalizeUserRole(role) === ROLES.TEACHER;
};

export const isStudentRole = (role) => {
  return normalizeUserRole(role) === ROLES.STUDENT;
};

export const canAccessUsers = (role) => {
  return normalizeUserRole(role) === ROLES.ADMIN;
};

export const canAccessSchools = (role) => {
  const userRole = normalizeUserRole(role);

  return (
    userRole === ROLES.ADMIN ||
    userRole === ROLES.TEACHER_ADMIN ||
    userRole === ROLES.TEACHER
  );
};

export const canAccessSections = (role) => {
  const userRole = normalizeUserRole(role);

  return (
    userRole === ROLES.ADMIN ||
    userRole === ROLES.TEACHER_ADMIN ||
    userRole === ROLES.TEACHER
  );
};

export const canAccessTeachers = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canAccessStudents = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canAccessModules = (role) => {
  const userRole = normalizeUserRole(role);

  return (
    userRole === ROLES.ADMIN ||
    userRole === ROLES.TEACHER_ADMIN ||
    userRole === ROLES.TEACHER ||
    userRole === ROLES.STUDENT
  );
};

export const canCreateSections = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canCreateTeachers = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canCreateStudents = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canImportRecords = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canExportRecords = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canAssignModuleTeachers = (role) => {
  const userRole = normalizeUserRole(role);

  return userRole === ROLES.ADMIN || userRole === ROLES.TEACHER_ADMIN;
};

export const canAssignModuleSections = (role) => {
  const userRole = normalizeUserRole(role);

  return (
    userRole === ROLES.ADMIN ||
    userRole === ROLES.TEACHER_ADMIN ||
    userRole === ROLES.TEACHER
  );
};

export const canManageModuleVisibility = (role) => {
  const userRole = normalizeUserRole(role);

  return (
    userRole === ROLES.ADMIN ||
    userRole === ROLES.TEACHER_ADMIN ||
    userRole === ROLES.TEACHER
  );
};

export const canUseRoute = (path, role) => {
  const userRole = normalizeUserRole(role);

  if (path === "/dashboard") return true;
  if (path === "/profile") return true;
  if (path === "/users") return canAccessUsers(userRole);
  if (path === "/schools") return canAccessSchools(userRole);

  if (path === "/modules") {
    return userRole === ROLES.ADMIN || userRole === ROLES.STUDENT;
  }

  return false;
};

export const filterSchoolsByUser = (schools, user) => {
  if (!user) return [];

  if (isAdminRole(user.role)) {
    return schools;
  }

  if (isTeacherAdminRole(user.role) || isTeacherRole(user.role)) {
    return schools.filter((school) =>
      user.schoolIds.includes(Number(school.id)),
    );
  }

  return [];
};

export const filterModulesByUser = (modules, user) => {
  if (!user) return [];

  if (isAdminRole(user.role)) {
    return modules;
  }

  if (isStudentRole(user.role)) {
    return modules.filter((moduleItem) => {
      const moduleSectionIds = Array.isArray(moduleItem.sectionIds)
        ? moduleItem.sectionIds
        : Array.isArray(moduleItem.sections)
          ? moduleItem.sections
          : [];

      return moduleSectionIds.some((sectionId) =>
        user.sectionIds.includes(Number(sectionId)),
      );
    });
  }

  return modules;
};
