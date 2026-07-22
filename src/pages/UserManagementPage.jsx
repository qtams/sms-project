import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMail,
  FiPhone,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import UserManagementModal from "../components/modals/UserManagementModal";
import { apiDebugRequest } from "../utils/apiDebugger";
import {
  createUserId,
  csvValue,
  getInitials,
  getStoredUsers,
  roleConfigs,
  saveStoredUsers,
} from "../data/userManagementData";

const UserManagementPage = ({ role }) => {
  const navigate = useNavigate();
  const config = roleConfigs[role];

  const [users, setUsers] = useState(() => getStoredUsers(config));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    user: null,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        user.fullName.toLowerCase().includes(searchValue) ||
        user.username.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.userId.toLowerCase().includes(searchValue) ||
        String(user.rfid || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.mobile || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const activeCount = users.filter((user) => user.status === "Active").length;
  const inactiveCount = users.filter(
    (user) => user.status === "Inactive",
  ).length;

  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      user: null,
    });
  };

  const openEditModal = (user) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      user,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: "create",
      user: null,
    });
  };

  const handleSaveUser = async (formData) => {
    if (!formData.fullName.trim() || !formData.username.trim()) {
      toast.error("Full name and username are required.");
      return;
    }

    const nextUser =
      modalState.mode === "edit"
        ? {
            ...modalState.user,
            ...formData,
          }
        : {
            id: Date.now(),
            userId: createUserId(config, users),
            ...formData,
          };

    await apiDebugRequest({
      module: "user-management",
      action: modalState.mode === "edit" ? `update-${role}` : `create-${role}`,
      method: modalState.mode === "edit" ? "PATCH" : "POST",
      payload: {
        role,
        roleLabel: config.roleLabel,
        user: nextUser,
        submittedAt: new Date().toISOString(),
      },
    });

    setUsers((current) => {
      const nextUsers =
        modalState.mode === "edit"
          ? current.map((user) =>
              user.id === modalState.user.id ? nextUser : user,
            )
          : [nextUser, ...current];

      saveStoredUsers(config, nextUsers);
      return nextUsers;
    });

    toast.success(
      modalState.mode === "edit" ? "User updated." : "User created.",
    );

    closeModal();
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";

    const updatedUser = {
      ...user,
      status: nextStatus,
    };

    await apiDebugRequest({
      module: "user-management",
      action: `toggle-${role}-status`,
      method: "PATCH",
      payload: {
        role,
        userId: user.userId,
        previousStatus: user.status,
        nextStatus,
        updatedAt: new Date().toISOString(),
      },
    });

    setUsers((current) => {
      const nextUsers = current.map((item) =>
        item.id === user.id ? updatedUser : item,
      );

      saveStoredUsers(config, nextUsers);
      return nextUsers;
    });

    toast.success(`User set to ${nextStatus}.`);
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete ${user.fullName}?`);

    if (!confirmed) return;

    await apiDebugRequest({
      module: "user-management",
      action: `delete-${role}`,
      method: "DELETE",
      payload: {
        role,
        userId: user.userId,
        deletedAt: new Date().toISOString(),
      },
    });

    setUsers((current) => {
      const nextUsers = current.filter((item) => item.id !== user.id);

      saveStoredUsers(config, nextUsers);
      return nextUsers;
    });

    toast.success("User deleted.");
  };

  const handleExport = async () => {
    const rows = filteredUsers.map((user) => ({
      userId: user.userId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      birthday: user.birthday,
      rfid: user.rfid,
      department: user.department,
      position: user.position,
      role: config.roleLabel,
      status: user.status,
    }));

    await apiDebugRequest({
      module: "user-management",
      action: `export-${role}`,
      method: "POST",
      payload: {
        role,
        totalRows: rows.length,
        rows,
        exportedAt: new Date().toISOString(),
      },
    });

    const header = [
      "User ID",
      "Full Name",
      "Username",
      "Email",
      "Mobile",
      "Birthday",
      "RFID",
      "Department",
      "Position",
      "Role",
      "Status",
    ];

    const csvRows = rows.map((row) =>
      [
        row.userId,
        row.fullName,
        row.username,
        row.email,
        row.mobile,
        row.birthday,
        row.rfid,
        row.department,
        row.position,
        row.role,
        row.status,
      ]
        .map(csvValue)
        .join(","),
    );

    const csvContent = [header.map(csvValue).join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${role}-users.csv`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Users exported.");
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {config.title}
          </h1>

          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiPlus />
            Add User
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Total Users" value={users.length} />
        <SummaryCard label="Active" value={activeCount} />
        <SummaryCard label="Inactive" value={inactiveCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {config.roleLabel} Accounts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search, view, add, edit, deactivate, or remove users.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700">
              <FiShield />
              {config.roleLabel}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, username, email, ID, RFID..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <TableHeader label="User" />
                <TableHeader label="Username" />
                <TableHeader label="Contact" />
                <TableHeader label="Role" />
                <TableHeader label="Status" />

                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-700 ring-4 ring-cyan-100">
                          {getInitials(user.fullName)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {user.fullName}
                          </p>

                          <p className="mt-1 font-mono text-xs font-medium text-slate-400">
                            {user.userId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      @{user.username}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <FiMail className="text-slate-400" />
                          {user.email || "-"}
                        </p>

                        <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <FiPhone />
                          {user.mobile || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        <FiUser />
                        {config.roleLabel}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(user)}
                      >
                        <StatusBadge status={user.status} />
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          title="View"
                          icon={<FiEye />}
                          className="bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white"
                          onClick={() =>
                            navigate(`/user-management/${role}/${user.userId}`)
                          }
                        />

                        <IconButton
                          title="Edit"
                          icon={<FiEdit2 />}
                          className="bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white"
                          onClick={() => openEditModal(user)}
                        />

                        <IconButton
                          title="Delete"
                          icon={<FiTrash2 />}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                          onClick={() => handleDelete(user)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserManagementModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        roleLabel={config.roleLabel}
        user={modalState.user}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </div>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{value}</h2>
    </div>
  );
};

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </th>
  );
};

const StatusBadge = ({ status }) => {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? <FiCheckCircle /> : <FiXCircle />}
      {status}
    </span>
  );
};

const IconButton = ({ title, icon, className, onClick }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition ${className}`}
    >
      {icon}
    </button>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <FiUsers className="mx-auto text-3xl text-slate-300" />
      <p className="mt-3 font-semibold text-slate-900">No users found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or status filter.
      </p>
    </div>
  );
};

export default UserManagementPage;
