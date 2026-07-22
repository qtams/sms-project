export const roleConfigs = {
  admin: {
    title: "Admin Users",
    detailTitle: "Admin Details",
    description: "Manage administrator accounts and system access.",
    roleLabel: "Admin",
    storageKey: "spry_admin_users",
    idPrefix: "ADM",
    listPath: "/user-management/admin",
    defaultUsers: [
      {
        id: 1,
        userId: "ADM-0001",
        fullName: "System Administrator",
        username: "sysadmin",
        email: "admin@sprytech.edu",
        mobile: "0917 111 2222",
        birthday: "1995-01-15",
        department: "Administration",
        position: "System Administrator",
        rfid: "RFID-ADM-000001",
        status: "Active",
      },
      {
        id: 2,
        userId: "ADM-0002",
        fullName: "School Admin",
        username: "schooladmin",
        email: "school.admin@sprytech.edu",
        mobile: "0917 333 4444",
        birthday: "1996-04-20",
        department: "Administration",
        position: "School Admin",
        rfid: "RFID-ADM-000002",
        status: "Active",
      },
    ],
  },

  guard: {
    title: "Guard Users",
    detailTitle: "Guard Details",
    description: "Manage guard accounts for RFID and entry monitoring.",
    roleLabel: "Guard",
    storageKey: "spry_guard_users",
    idPrefix: "GRD",
    listPath: "/user-management/guard",
    defaultUsers: [
      {
        id: 1,
        userId: "GRD-0001",
        fullName: "Pedro Santos",
        username: "pedro.guard",
        email: "pedro.guard@sprytech.edu",
        mobile: "0918 111 3333",
        birthday: "1988-03-12",
        department: "Security",
        position: "School Guard",
        rfid: "RFID-GRD-000001",
        status: "Active",
      },
      {
        id: 2,
        userId: "GRD-0002",
        fullName: "Mark Reyes",
        username: "mark.guard",
        email: "mark.guard@sprytech.edu",
        mobile: "0918 444 5555",
        birthday: "1990-09-08",
        department: "Security",
        position: "Gate Guard",
        rfid: "",
        status: "Inactive",
      },
    ],
  },

  registrar: {
    title: "Registrar Users",
    detailTitle: "Registrar Details",
    description: "Manage registrar accounts for enrollment and verification.",
    roleLabel: "Registrar",
    storageKey: "spry_registrar_users",
    idPrefix: "REG",
    listPath: "/user-management/registrar",
    defaultUsers: [
      {
        id: 1,
        userId: "REG-0001",
        fullName: "Maria Cruz",
        username: "maria.registrar",
        email: "maria.registrar@sprytech.edu",
        mobile: "0919 222 3333",
        birthday: "1994-11-22",
        department: "Registrar",
        position: "Registrar Officer",
        rfid: "RFID-REG-000001",
        status: "Active",
      },
      {
        id: 2,
        userId: "REG-0002",
        fullName: "Ana Mendoza",
        username: "ana.registrar",
        email: "ana.registrar@sprytech.edu",
        mobile: "0919 444 5555",
        birthday: "1997-06-18",
        department: "Registrar",
        position: "Enrollment Staff",
        rfid: "RFID-REG-000002",
        status: "Active",
      },
    ],
  },
};

export const statusOptions = ["Active", "Inactive"];

export const getStoredUsers = (config) => {
  try {
    const stored = localStorage.getItem(config.storageKey);

    if (!stored) {
      localStorage.setItem(
        config.storageKey,
        JSON.stringify(config.defaultUsers),
      );

      return config.defaultUsers;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : config.defaultUsers;
  } catch {
    return config.defaultUsers;
  }
};

export const saveStoredUsers = (config, users) => {
  localStorage.setItem(config.storageKey, JSON.stringify(users));
};

export const createUserId = (config, users) => {
  const nextNumber = users.length + 1;

  return `${config.idPrefix}-${String(nextNumber).padStart(4, "0")}`;
};

export const getInitials = (name) => {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const formatBirthday = (birthday) => {
  if (!birthday) return "-";

  return new Date(`${birthday}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};
