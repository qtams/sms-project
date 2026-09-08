import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../lib/api";
import {
  FiCheckCircle,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMail,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiUser,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import UserManagementModal from "../components/modals/UserManagementModal";
import { csvValue, roleConfigs } from "../data/userManagementData";

const UserManagementPage = ({ role }) => {
  const navigate = useNavigate();
  const config = roleConfigs[role];

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    user: null,
  });

  useEffect(() => {
    let isCurrent = true;

    const loadUsers = async () => {
      setIsLoading(true);

      try {
        if (!config.apiPath) {
          throw new Error(`${config.roleLabel} API is not implemented yet.`);
        }

        const response = await api.get(config.apiPath);

        if (isCurrent) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        if (isCurrent) {
          setUsers([]);

          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Unable to load user accounts.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [config.apiPath, config.roleLabel, role]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        String(user.fullName || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.username || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.userId || "")
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
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.username.trim()
    ) {
      toast.error("First name, last name, and username are required.");
      return;
    }

    if (modalState.mode === "create") {
      if (!formData.password) {
        toast.error("Password is required.");
        return;
      }

      if (formData.password !== formData.password_confirmation) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setIsSaving(true);

    try {
      if (modalState.mode === "edit") {
        const response = await api.put(
          `${config.apiPath}/${modalState.user.id}`,
          formData,
        );

        const updatedUser = response.data.user;

        setUsers((current) =>
          current.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          ),
        );

        closeModal();

        toast.success(
          response.data.message || `${config.roleLabel} updated successfully.`,
        );
      } else {
        const response = await api.post(config.apiPath, formData);

        const createdUser = response.data.user;

        setUsers((current) => [createdUser, ...current]);

        closeModal();

        toast.success(
          response.data.message || `${config.roleLabel} created successfully.`,
        );
      }
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstMessage = Object.values(validationErrors).flat()[0];

        toast.error(firstMessage || "Validation failed.");

        return;
      }

      toast.error(
        error.response?.data?.message ||
          `Unable to save ${config.roleLabel.toLowerCase()}.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";

    const result = await Swal.fire({
      title: nextStatus === "Inactive" ? "Deactivate User?" : "Activate User?",
      text: `Are you sure you want to set ${user.fullName} as ${nextStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText:
        nextStatus === "Inactive" ? "Yes, deactivate" : "Yes, activate",
      cancelButtonText: "Cancel",
      confirmButtonColor: nextStatus === "Inactive" ? "#f97316" : "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await api.patch(`${config.apiPath}/${user.id}/status`, {
        status: nextStatus,
      });

      const updatedUser = response.data.user;

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      toast.success(
        response.data.message || `${user.fullName} is now ${nextStatus}.`,
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Unable to change ${config.roleLabel.toLowerCase()} status.`,
      );
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: "Delete User?",
      html: `
        <div style="font-size:14px;color:#64748b;line-height:1.6;">
          Are you sure you want to delete
          <strong style="color:#0f172a;">
            ${user.fullName}
          </strong>?
          <br />
          This action cannot be undone.
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting User",
        text: "Please wait...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.delete(`${config.apiPath}/${user.id}`);

      setUsers((current) => current.filter((item) => item.id !== user.id));

      Swal.close();

      toast.success(
        response.data.message || `${user.fullName} deleted successfully.`,
      );
    } catch (error) {
      Swal.close();

      toast.error(
        error.response?.data?.message ||
          `Unable to delete ${config.roleLabel.toLowerCase()}.`,
      );
    }
  };

  const handleExport = () => {
    try {
      const rows = filteredUsers.map((user) => ({
        userId: user.userId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        birthday: user.birthday,
        department: user.department,
        position: user.position,
        role: config.roleLabel,
        status: user.status,
      }));

      if (rows.length === 0) {
        toast.warning("No users available to export.");
        return;
      }

      const header = [
        "User ID",
        "Full Name",
        "Username",
        "Email",
        "Mobile",
        "Birthday",
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
          row.department,
          row.position,
          row.role,
          row.status,
        ]
          .map(csvValue)
          .join(","),
      );

      const csvContent = [header.map(csvValue).join(","), ...csvRows].join(
        "\n",
      );

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${role}-users.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Users exported successfully.");
    } catch {
      toast.error("Unable to export users.");
    }
  };

  return (
    <div
      data-aos="fade-up"
      className="space-y-5 [font-family:'Poppins',sans-serif]"
    >
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

              {/* <p className="mt-1 text-sm text-slate-500">
                Search, view, add, edit, deactivate, or remove users.
              </p> */}
            </div>

            {/* <span className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700">
              <FiShield />
              {config.roleLabel}
            </span> */}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, username, email, or staff ID..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
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
          <table className="w-full min-w-[1250px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <TableHeader label="User ID" />
                <TableHeader label="Name" />
                <TableHeader label="Username" />
                <TableHeader label="Email" />
                <TableHeader label="Mobile Number" />
                <TableHeader label="Role" />
                <TableHeader label="Status" />

                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      Loading {config.roleLabel.toLowerCase()} accounts...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {user.userId}
                    </td>

                    <td className="px-5 py-4 text-sm font-normal text-slate-900">
                      {user.fullName}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      @{user.username}
                    </td>

                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      <span className="flex items-center gap-2">
                        <FiMail className="shrink-0 text-slate-400" />
                        {user.email || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      <span className="flex items-center gap-2">
                        <FiPhone className="shrink-0 text-slate-400" />
                        {user.mobile || "-"}
                      </span>
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
                            navigate(`/user-management/${role}/${user.id}`)
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
                  <td colSpan="8">
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
        isSaving={isSaving}
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
