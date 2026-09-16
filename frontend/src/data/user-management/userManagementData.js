/*
|--------------------------------------------------------------------------
| USER MANAGEMENT CONFIG
|--------------------------------------------------------------------------
|
| No dummy data.
| No localStorage.
| No frontend-generated user IDs.
|
| All users should come from the Laravel API.
|
*/

export const roleConfigs = {
  admin: {
    title: "Admin Users",
    detailTitle: "Admin Details",
    roleLabel: "Admin",

    apiPath: "/api/admin-users",

    listPath: "/user-management/admin",

    detailPath: (id) => `/user-management/admin/${id}`,
  },

  guard: {
    title: "Guard Users",
    detailTitle: "Guard Details",
    roleLabel: "Guard",

    apiPath: "/api/guard-users",

    listPath: "/user-management/guard",

    detailPath: (id) => `/user-management/guard/${id}`,
  },

  registrar: {
    title: "Registrar Users",
    detailTitle: "Registrar Details",
    roleLabel: "Registrar",

    apiPath: "/api/registrar-users",

    listPath: "/user-management/registrar",

    detailPath: (id) => `/user-management/registrar/${id}`,
  },
};

/*
|--------------------------------------------------------------------------
| STATUS OPTIONS
|--------------------------------------------------------------------------
*/

export const statusOptions = ["Active", "Inactive"];

/*
|--------------------------------------------------------------------------
| GET ROLE CONFIG
|--------------------------------------------------------------------------
*/

export const getRoleConfig = (role) => {
  return roleConfigs[role] || null;
};

/*
|--------------------------------------------------------------------------
| USER LIST PATH
|--------------------------------------------------------------------------
*/

export const getUserListPath = (role) => {
  const config = getRoleConfig(role);

  return config?.listPath || "/";
};

/*
|--------------------------------------------------------------------------
| USER DETAILS PATH
|--------------------------------------------------------------------------
*/

export const getUserDetailsPath = (role, userId) => {
  const config = getRoleConfig(role);

  if (!config || !userId) {
    return config?.listPath || "/";
  }

  return config.detailPath(userId);
};

/*
|--------------------------------------------------------------------------
| FORMAT USERNAME
|--------------------------------------------------------------------------
|
| Prevents:
|
| @@Tamahome
|
*/

export const formatUsername = (username) => {
  const value = String(username || "").trim();

  if (!value) {
    return "-";
  }

  return value.startsWith("@") ? value : `@${value}`;
};

/*
|--------------------------------------------------------------------------
| GET INITIALS
|--------------------------------------------------------------------------
*/

export const getInitials = (name) => {
  const value = String(name || "").trim();

  if (!value) {
    return "?";
  }

  const names = value.split(/\s+/).filter(Boolean);

  if (names.length === 1) {
    return names[0].slice(0, 2).toUpperCase();
  }

  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/*
|--------------------------------------------------------------------------
| FORMAT BIRTHDAY
|--------------------------------------------------------------------------
*/

export const formatBirthday = (birthday) => {
  if (!birthday) {
    return "-";
  }

  /*
   * Laravel may return:
   *
   * 2026-09-15
   *
   * or:
   *
   * 2026-09-15T00:00:00.000000Z
   */

  const cleanDate = String(birthday).slice(0, 10);

  const date = new Date(`${cleanDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

/*
|--------------------------------------------------------------------------
| CSV VALUE
|--------------------------------------------------------------------------
*/

export const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
*/

export const normalizeStatus = (status, isActive) => {
  if (status) {
    const normalized = String(status).trim().toLowerCase();

    if (normalized === "active") {
      return "Active";
    }

    if (normalized === "inactive") {
      return "Inactive";
    }
  }

  if (isActive === true || isActive === 1 || isActive === "1") {
    return "Active";
  }

  if (isActive === false || isActive === 0 || isActive === "0") {
    return "Inactive";
  }

  return "Inactive";
};

/*
|--------------------------------------------------------------------------
| NORMALIZE API USER
|--------------------------------------------------------------------------
|
| Makes the frontend work with either:
|
| firstName
| first_name
|
| departmentId
| department_id
|
| staffProfile
| staff_profile
|
*/

export const normalizeUser = (user) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const staff = user.staffProfile || user.staff_profile || {};

  const departmentObject = staff.department || {};

  const positionObject = staff.position || {};

  const firstName =
    user.firstName ??
    user.first_name ??
    staff.firstName ??
    staff.first_name ??
    "";

  const middleName =
    user.middleName ??
    user.middle_name ??
    staff.middleName ??
    staff.middle_name ??
    "";

  const lastName =
    user.lastName ?? user.last_name ?? staff.lastName ?? staff.last_name ?? "";

  const suffix = user.suffix ?? staff.suffix ?? "";

  const fullName =
    user.fullName ??
    user.full_name ??
    [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  return {
    ...user,

    id: user.id ?? user.user_id,

    userId:
      user.userId ??
      user.user_id_display ??
      user.staffNo ??
      user.staff_no ??
      staff.staffNo ??
      staff.staff_no ??
      "",

    firstName,

    middleName,

    lastName,

    suffix,

    fullName,

    username: user.username ?? "",

    email: user.email ?? "",

    mobile:
      user.mobile ??
      user.mobile_number ??
      user.contactNumber ??
      user.contact_number ??
      staff.mobile ??
      "",

    birthday: user.birthday ?? user.birth_date ?? staff.birthday ?? "",

    address: user.address ?? staff.address ?? "",

    rfid:
      user.rfid ?? user.rfid_number ?? staff.rfid ?? staff.rfid_number ?? "",

    departmentId: String(
      user.departmentId ??
        user.department_id ??
        staff.departmentId ??
        staff.department_id ??
        departmentObject.id ??
        "",
    ),

    department:
      typeof user.department === "string"
        ? user.department
        : (user.department?.name ??
          user.departmentName ??
          user.department_name ??
          departmentObject.name ??
          ""),

    positionId: String(
      user.positionId ??
        user.position_id ??
        staff.positionId ??
        staff.position_id ??
        positionObject.id ??
        "",
    ),

    position:
      typeof user.position === "string"
        ? user.position
        : (user.position?.name ??
          user.positionName ??
          user.position_name ??
          positionObject.name ??
          ""),

    employmentStatus:
      user.employmentStatus ??
      user.employment_status ??
      staff.employmentStatus ??
      staff.employment_status ??
      "active",

    hireDate:
      user.hireDate ??
      user.hire_date ??
      staff.hireDate ??
      staff.hire_date ??
      "",

    status: normalizeStatus(user.status, user.is_active),
  };
};

/*
|--------------------------------------------------------------------------
| EXTRACT USER LIST FROM API
|--------------------------------------------------------------------------
|
| Supports:
|
| response.data = [...]
|
| response.data.data = [...]
|
| response.data.users = [...]
|
| response.data.data.users = [...]
|
*/

export const extractUsers = (response) => {
  const responseData = response?.data ?? response ?? {};

  let users = [];

  if (Array.isArray(responseData)) {
    users = responseData;
  } else if (Array.isArray(responseData.data)) {
    users = responseData.data;
  } else if (Array.isArray(responseData.users)) {
    users = responseData.users;
  } else if (Array.isArray(responseData.data?.users)) {
    users = responseData.data.users;
  }

  return users.map(normalizeUser).filter(Boolean);
};

/*
|--------------------------------------------------------------------------
| EXTRACT SINGLE USER FROM API
|--------------------------------------------------------------------------
|
| Supports:
|
| { user: {...} }
| { data: {...} }
| { data: { user: {...} } }
|
*/

export const extractUser = (response) => {
  const responseData = response?.data ?? response ?? {};

  let user =
    responseData.user ??
    responseData.data?.user ??
    responseData.data ??
    responseData;

  if (!user || Array.isArray(user) || typeof user !== "object") {
    return null;
  }

  return normalizeUser(user);
};

/*
|--------------------------------------------------------------------------
| API ERROR MESSAGE
|--------------------------------------------------------------------------
*/

export const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong.",
) => {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors) {
    const firstError = Object.values(validationErrors).flat().find(Boolean);

    if (firstError) {
      return String(firstError);
    }
  }

  return error?.response?.data?.message || error?.message || fallbackMessage;
};
