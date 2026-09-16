import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

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
  FiXCircle,
} from "react-icons/fi";

import api from "../../services/api";

import UserManagementModal from "../../components/modals/user-management/UserManagementModal";

import { DataTable } from "../../components/data-table";
import { SummaryCards } from "../../components/summary";
import { Skeleton } from "../../components/skeleton";

import {
  csvValue,
  extractUser,
  extractUsers,
  formatUsername,
  getApiErrorMessage,
  getRoleConfig,
} from "../../data/user-management/userManagementData";

/* =========================================================
  PAGINATION
========================================================= */

// const rowsPerPageOptions = [5, 10, 25, 50];
// (handled inside TablePagination now)

/* =========================================================
  STATE
========================================================= */

const initialState = {
  users: [],

  isLoading: true,
  isSaving: false,

  searchTerm: "",
  statusFilter: "All",

  viewMode: "table",

  currentPage: 1,
  rowsPerPage: 10,

  pendingActionId: null,

  modal: {
    isOpen: false,
    mode: "create",
    user: null,
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,

        users: [],

        isLoading: true,

        currentPage: 1,

        pendingActionId: null,

        modal: {
          isOpen: false,
          mode: "create",
          user: null,
        },
      };

    case "LOAD_SUCCESS":
      return {
        ...state,

        users: action.payload,

        isLoading: false,
      };

    case "LOAD_FAILED":
      return {
        ...state,

        users: [],

        isLoading: false,
      };

    case "SET_USERS":
      return {
        ...state,

        users: action.payload,
      };

    case "SET_SEARCH":
      return {
        ...state,

        searchTerm: action.payload,

        currentPage: 1,
      };

    case "SET_STATUS_FILTER":
      return {
        ...state,

        statusFilter: action.payload,

        currentPage: 1,
      };

    case "SET_VIEW_MODE":
      return {
        ...state,

        viewMode: action.payload,
      };

    case "RESET_FILTERS":
      return {
        ...state,

        searchTerm: "",

        statusFilter: "All",

        currentPage: 1,
      };

    case "SET_CURRENT_PAGE":
      return {
        ...state,

        currentPage: action.payload,
      };

    case "SET_ROWS_PER_PAGE":
      return {
        ...state,

        rowsPerPage: action.payload,

        currentPage: 1,
      };

    case "OPEN_CREATE":
      return {
        ...state,

        modal: {
          isOpen: true,
          mode: "create",
          user: null,
        },
      };

    case "OPEN_EDIT":
      return {
        ...state,

        modal: {
          isOpen: true,
          mode: "edit",
          user: action.payload,
        },
      };

    case "CLOSE_MODAL":
      return {
        ...state,

        modal: {
          isOpen: false,
          mode: "create",
          user: null,
        },
      };

    case "SAVE_START":
      return {
        ...state,

        isSaving: true,
      };

    case "SAVE_END":
      return {
        ...state,

        isSaving: false,
      };

    case "UPSERT_USER": {
      const incomingUser = action.payload;

      const exists = state.users.some(
        (item) => String(item.id) === String(incomingUser.id),
      );

      if (exists) {
        return {
          ...state,

          users: state.users.map((item) =>
            String(item.id) === String(incomingUser.id) ? incomingUser : item,
          ),
        };
      }

      return {
        ...state,

        users: [incomingUser, ...state.users],
      };
    }

    case "UPDATE_STATUS":
      return {
        ...state,

        users: state.users.map((user) =>
          String(user.id) === String(action.payload.id)
            ? {
                ...user,

                status: action.payload.status,
              }
            : user,
        ),
      };

    case "REMOVE_USER":
      return {
        ...state,

        users: state.users.filter(
          (user) => String(user.id) !== String(action.payload),
        ),
      };

    case "ACTION_START":
      return {
        ...state,

        pendingActionId: action.payload,
      };

    case "ACTION_END":
      return {
        ...state,

        pendingActionId: null,
      };

    default:
      return state;
  }
};

/* =========================================================
  COMPONENT
========================================================= */

const UserManagementPage = ({ role }) => {
  const navigate = useNavigate();

  const config = getRoleConfig(role);

  const [state, dispatch] = useReducer(reducer, initialState);

  const requestIdRef = useRef(0);

  /* =======================================================
    LOAD USERS
  ======================================================= */

  const loadUsers = useCallback(
    async ({ showSkeleton = true } = {}) => {
      if (!config?.apiPath) {
        return;
      }

      const requestId = ++requestIdRef.current;

      if (showSkeleton) {
        dispatch({
          type: "LOAD_START",
        });
      }

      try {
        const response = await api.get(config.apiPath);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const users = extractUsers(response);

        if (showSkeleton) {
          dispatch({
            type: "LOAD_SUCCESS",

            payload: users,
          });
        } else {
          dispatch({
            type: "SET_USERS",

            payload: users,
          });
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (showSkeleton) {
          dispatch({
            type: "LOAD_FAILED",
          });
        }

        toast.error(getApiErrorMessage(error, "Unable to load user accounts."));
      }
    },
    [config?.apiPath],
  );

  useEffect(() => {
    loadUsers();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadUsers]);

  /* =======================================================
    FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const query = state.searchTerm.trim().toLowerCase();

    return state.users.filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.fullName,
          user.username,
          user.email,
          user.userId,
          user.mobile,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        state.statusFilter === "All" || user.status === state.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [state.users, state.searchTerm, state.statusFilter]);

  /* =======================================================
    PAGINATION CALCULATIONS
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / state.rowsPerPage),
  );

  const startIndex = (state.currentPage - 1) * state.rowsPerPage;

  const endIndex = startIndex + state.rowsPerPage;

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  const showingStart = filteredUsers.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, filteredUsers.length);

  /* =======================================================
    KEEP CURRENT PAGE VALID
  ======================================================= */

  useEffect(() => {
    if (state.currentPage > totalPages) {
      dispatch({
        type: "SET_CURRENT_PAGE",

        payload: totalPages,
      });
    }
  }, [state.currentPage, totalPages]);

  /* =======================================================
    SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    const active = state.users.filter(
      (user) => user.status === "Active",
    ).length;

    const inactive = state.users.filter(
      (user) => user.status === "Inactive",
    ).length;

    return {
      total: state.users.length,

      active,

      inactive,
    };
  }, [state.users]);

  const summaryItems = [
    {
      key: "total",
      label: "Total Users",
      value: summary.total,
    },

    {
      key: "active",
      label: "Active",
      value: summary.active,
    },

    {
      key: "inactive",
      label: "Inactive",
      value: summary.inactive,
    },
  ];

  /* =======================================================
    VIEW USER
  ======================================================= */

  const handleViewUser = (user) => {
    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      toast.error("Unable to open this user. User ID is missing.");

      return;
    }

    const detailsPath = `${config.listPath}/${encodeURIComponent(userId)}`;

    navigate(detailsPath, {
      state: {
        user,
      },
    });
  };

  /* =======================================================
    MODAL
  ======================================================= */

  const openCreateModal = () => {
    dispatch({
      type: "OPEN_CREATE",
    });
  };

  const openEditModal = (user) => {
    dispatch({
      type: "OPEN_EDIT",

      payload: user,
    });
  };

  const closeModal = () => {
    if (state.isSaving) {
      return;
    }

    dispatch({
      type: "CLOSE_MODAL",
    });
  };

  /* =======================================================
    SAVE USER
  ======================================================= */

  const handleSaveUser = async (formData) => {
    const mode = state.modal.mode;

    const editingUser = state.modal.user;

    if (
      !formData.firstName?.trim() ||
      !formData.lastName?.trim() ||
      !formData.username?.trim()
    ) {
      toast.error("First name, last name, and username are required.");

      return false;
    }

    if (mode === "create") {
      if (!formData.password) {
        toast.error("Password is required.");

        return false;
      }

      if (formData.password !== formData.password_confirmation) {
        toast.error("Passwords do not match.");

        return false;
      }
    }

    const confirmation = await Swal.fire({
      title:
        mode === "edit"
          ? "Save changes?"
          : `Create ${config.roleLabel.toLowerCase()}?`,

      text:
        mode === "edit"
          ? `Save changes for ${formatUsername(formData.username)}?`
          : `Create the account for ${formatUsername(formData.username)}?`,

      icon: "question",

      showCancelButton: true,

      confirmButtonText: mode === "edit" ? "Save changes" : "Create account",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#0891b2",

      cancelButtonColor: "#64748b",

      reverseButtons: true,

      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return false;
    }

    dispatch({
      type: "SAVE_START",
    });

    try {
      let response;

      if (mode === "edit") {
        if (!editingUser?.id) {
          throw new Error("User ID is missing.");
        }

        response = await api.put(
          `${config.apiPath}/${editingUser.id}`,
          formData,
        );
      } else {
        response = await api.post(config.apiPath, formData);
      }

      const savedUser = extractUser(response);

      if (savedUser?.id) {
        dispatch({
          type: "UPSERT_USER",

          payload: savedUser,
        });
      } else {
        await loadUsers({
          showSkeleton: false,
        });
      }

      dispatch({
        type: "CLOSE_MODAL",
      });

      toast.success(
        response?.data?.message ||
          (mode === "edit"
            ? `${config.roleLabel} updated successfully.`
            : `${config.roleLabel} created successfully.`),
      );

      return true;
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          `Unable to save ${config.roleLabel.toLowerCase()}.`,
        ),
      );

      return false;
    } finally {
      dispatch({
        type: "SAVE_END",
      });
    }
  };

  /* =======================================================
    STATUS
  ======================================================= */

  const handleStatusToggle = async (user) => {
    if (state.pendingActionId) {
      return;
    }

    const nextStatus = user.status === "Active" ? "Inactive" : "Active";

    const result = await Swal.fire({
      title:
        nextStatus === "Active" ? "Activate account?" : "Deactivate account?",

      text:
        nextStatus === "Active"
          ? `${user.fullName} will be able to use this account.`
          : `${user.fullName} will no longer be able to use this account.`,

      icon: "question",

      showCancelButton: true,

      confirmButtonText: nextStatus === "Active" ? "Activate" : "Deactivate",

      cancelButtonText: "Cancel",

      confirmButtonColor: nextStatus === "Active" ? "#059669" : "#f97316",

      cancelButtonColor: "#64748b",

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    dispatch({
      type: "ACTION_START",

      payload: user.id,
    });

    try {
      const response = await api.patch(`${config.apiPath}/${user.id}/status`, {
        status: nextStatus,
      });

      const updatedUser = extractUser(response);

      if (updatedUser?.id) {
        dispatch({
          type: "UPSERT_USER",

          payload: updatedUser,
        });
      } else {
        dispatch({
          type: "UPDATE_STATUS",

          payload: {
            id: user.id,

            status: nextStatus,
          },
        });
      }

      toast.success(
        response?.data?.message ||
          `${user.fullName} is now ${nextStatus.toLowerCase()}.`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to update account status."),
      );
    } finally {
      dispatch({
        type: "ACTION_END",
      });
    }
  };

  /* =======================================================
    DELETE
  ======================================================= */

  const handleDelete = async (user) => {
    if (state.pendingActionId) {
      return;
    }

    const result = await Swal.fire({
      title: "Delete account?",

      text: `Delete ${user.fullName}? This action cannot be undone.`,

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

    dispatch({
      type: "ACTION_START",

      payload: user.id,
    });

    try {
      const response = await api.delete(`${config.apiPath}/${user.id}`);

      dispatch({
        type: "REMOVE_USER",

        payload: user.id,
      });

      toast.success(response?.data?.message || "Account deleted successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete account."));
    } finally {
      dispatch({
        type: "ACTION_END",
      });
    }
  };

  /* =======================================================
    RESET
  ======================================================= */

  const handleResetFilter = () => {
    dispatch({
      type: "RESET_FILTERS",
    });
  };

  /* =======================================================
    EXPORT
  ======================================================= */

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.info("There are no records to export.");

      return;
    }

    const header = [
      "User ID",
      "Name",
      "Username",
      "Email",
      "Mobile",
      "Department",
      "Position",
      "Status",
    ];

    const rows = filteredUsers.map((user) =>
      [
        user.userId,
        user.fullName,
        user.username,
        user.email,
        user.mobile,
        user.department,
        user.position,
        user.status,
      ]
        .map(csvValue)
        .join(","),
    );

    const content = [header.map(csvValue).join(","), ...rows].join("\n");

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${role}-users.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Users exported successfully.");
  };

  /* =======================================================
    INVALID ROLE
  ======================================================= */

  if (!config) {
    return (
      <div className="rounded-md bg-white p-6 text-sm font-normal text-slate-500 shadow-sm">
        This user management page is not available.
      </div>
    );
  }

  /* =======================================================
    TABLE COLUMNS
  ======================================================= */

  const userColumns = [
    {
      key: "userId",
      label: "User ID",

      render: (user) => (
        <span className="text-[12px] text-[#69768b]">{user.userId || "-"}</span>
      ),
    },

    {
      key: "fullName",
      label: "Name",

      render: (user) => (
        <span className="text-[12px] text-slate-900">
          {user.fullName || "-"}
        </span>
      ),
    },

    {
      key: "username",
      label: "Username",

      render: (user) => (
        <span className="text-[12px] text-[#69768b]">
          {formatUsername(user.username)}
        </span>
      ),
    },

    {
      key: "email",
      label: "Email",

      render: (user) => (
        <span className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiMail className="shrink-0 text-[#94a3b8]" />

          {user.email || "-"}
        </span>
      ),
    },

    {
      key: "mobile",
      label: "Mobile Number",

      render: (user) => (
        <span className="flex items-center gap-2 text-[12px] text-[#69768b]">
          <FiPhone className="shrink-0 text-[#94a3b8]" />

          {user.mobile || "-"}
        </span>
      ),
    },

    {
      key: "role",
      label: "Role",

      render: () => (
        <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] text-[#69768b]">
          <FiUser />

          {config.roleLabel}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (user) => (
        <button
          type="button"
          disabled={String(state.pendingActionId) === String(user.id)}
          onClick={() => handleStatusToggle(user)}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <StatusBadge status={user.status} />
        </button>
      ),
    },

    {
      key: "action",
      label: "Action",
      align: "right",

      render: (user) => {
        const pending = String(state.pendingActionId) === String(user.id);

        return (
          <div className="flex justify-end gap-2">
            <IconButton
              title="View"
              icon={<FiEye />}
              onClick={() => handleViewUser(user)}
              className="bg-slate-100 text-[#69768b] hover:bg-slate-900 hover:text-white"
            />

            <IconButton
              title="Edit"
              icon={<FiEdit2 />}
              disabled={pending}
              onClick={() => openEditModal(user)}
              className="bg-[#01B8E5]/10 text-[#019BC2] hover:bg-[#01B8E5] hover:text-white"
            />

            <IconButton
              title="Delete"
              icon={<FiTrash2 />}
              disabled={pending}
              onClick={() => handleDelete(user)}
              className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
            />
          </div>
        );
      },
    },
  ];

  /* =======================================================
    RENDER
  ======================================================= */

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      <div className="space-y-5 [font-family:'Poppins',sans-serif]">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {state.isLoading ? (
            <>
              <div>
                <Skeleton className="h-7 w-44" />

                <Skeleton className="mt-2 h-4 w-60" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />

                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-[22px] font-medium text-slate-900">
                  {config.title}
                </h1>

                <p className="mt-1 text-[13px] text-[#94a3b8]">
                  Manage {config.roleLabel.toLowerCase()} accounts.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-[12px]
                    text-[#69768b]
                    transition
                    hover:border-[#01B8E5]/40
                    hover:text-[#01B8E5]
                  "
                >
                  <FiDownload />
                  Export
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-md
                    bg-[#01B8E5]
                    px-4
                    text-[12px]
                    text-white
                    transition
                    hover:bg-[#019BC2]
                  "
                >
                  <FiPlus />
                  Add User
                </button>
              </div>
            </>
          )}
        </div>

        {/* =================================================
            SUMMARY

            loading=true
            -> SummaryCards automatically renders
               SummarySkeleton
        ================================================= */}

        <SummaryCards
          columns={3}
          loading={state.isLoading}
          items={summaryItems}
        />

        {/* =================================================
            DATA TABLE

            table mode + loading
            -> TableSkeleton

            cards mode + loading
            -> CardSkeleton
        ================================================= */}

        <DataTable
          title={`${config.roleLabel} Accounts`}
          subtitle="View and manage user accounts."
          columns={userColumns}
          rows={paginatedUsers}
          rowKey="id"
          /* SHARED SKELETON LOADING */
          loading={state.isLoading}
          search={{
            value: state.searchTerm,

            onChange: (value) =>
              dispatch({
                type: "SET_SEARCH",

                payload: value,
              }),

            placeholder: "Search name, username, email, or staff ID...",
          }}
          statusFilter={{
            value: state.statusFilter,

            onChange: (value) =>
              dispatch({
                type: "SET_STATUS_FILTER",

                payload: value,
              }),

            options: [
              {
                label: "All Status",
                value: "All",
              },

              {
                label: "Active",
                value: "Active",
              },

              {
                label: "Inactive",
                value: "Inactive",
              },
            ],
          }}
          onReset={handleResetFilter}
          view={{
            mode: state.viewMode,

            onChange: (mode) =>
              dispatch({
                type: "SET_VIEW_MODE",

                payload: mode,
              }),
          }}
          renderCard={(user) => (
            <UserCard
              user={user}
              roleLabel={config.roleLabel}
              pending={String(state.pendingActionId) === String(user.id)}
              onView={handleViewUser}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggleStatus={handleStatusToggle}
            />
          )}
          pagination={{
            currentPage: state.currentPage,
            totalPages,

            rowsPerPage: state.rowsPerPage,

            totalRows: filteredUsers.length,

            showingStart,
            showingEnd,

            onRowsPerPageChange: (value) =>
              dispatch({
                type: "SET_ROWS_PER_PAGE",

                payload: value,
              }),

            onPageChange: (page) =>
              dispatch({
                type: "SET_CURRENT_PAGE",

                payload: page,
              }),
          }}
          emptyTitle={
            state.searchTerm.trim() || state.statusFilter !== "All"
              ? `No matching ${config.roleLabel.toLowerCase()} accounts.`
              : `No ${config.roleLabel.toLowerCase()} accounts yet.`
          }
          emptyDescription={
            state.searchTerm.trim() || state.statusFilter !== "All"
              ? "Try another search or status."
              : `${config.roleLabel} accounts will appear here once they are added.`
          }
        />

        {/* =================================================
            MODAL
        ================================================= */}

        <UserManagementModal
          isOpen={state.modal.isOpen}
          mode={state.modal.mode}
          role={role}
          roleLabel={config.roleLabel}
          user={state.modal.user}
          isSaving={state.isSaving}
          onClose={closeModal}
          onSave={handleSaveUser}
        />
      </div>
    </>
  );
};

/* =========================================================
  USER CARD
========================================================= */

const UserCard = ({
  user,
  roleLabel,
  pending,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-lg
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[#01B8E5]/30
        hover:shadow-md
      "
    >
      <div className="p-5">
        {/* PROFILE */}

        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#01B8E5]/10
              text-[#01B8E5]
            "
          >
            <FiUser size={20} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[13px] text-slate-900">
              {user.fullName || "-"}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-[#94a3b8]">
              {formatUsername(user.username)}
            </p>
          </div>
        </div>

        {/* DETAILS */}

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-[#69768b]">
            <FiMail className="shrink-0 text-[#94a3b8]" />

            <span className="truncate">{user.email || "-"}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#69768b]">
            <FiPhone className="shrink-0 text-[#94a3b8]" />

            <span className="truncate">{user.mobile || "-"}</span>
          </div>
        </div>

        {/* STATUS */}

        <div className="mt-4 rounded-md bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              {roleLabel}
            </span>

            <button
              type="button"
              disabled={pending}
              onClick={() => onToggleStatus(user)}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              <StatusBadge status={user.status} />
            </button>
          </div>
        </div>

        {/* ACTION */}

        <div className="mt-4 flex justify-end gap-2">
          <IconButton
            title="View"
            icon={<FiEye />}
            onClick={() => onView(user)}
            className="bg-slate-100 text-[#69768b] hover:bg-slate-900 hover:text-white"
          />

          <IconButton
            title="Edit"
            icon={<FiEdit2 />}
            disabled={pending}
            onClick={() => onEdit(user)}
            className="bg-[#01B8E5]/10 text-[#019BC2] hover:bg-[#01B8E5] hover:text-white"
          />

          <IconButton
            title="Delete"
            icon={<FiTrash2 />}
            disabled={pending}
            onClick={() => onDelete(user)}
            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
  STATUS
========================================================= */

const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-md
        px-2.5
        py-1.5
        text-[10px]
        ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-[#69768b]"
        }
      `}
    >
      {active ? <FiCheckCircle /> : <FiXCircle />}

      {status || "Inactive"}
    </span>
  );
};

/* =========================================================
  ICON BUTTON
========================================================= */

const IconButton = ({ title, icon, className, onClick, disabled = false }) => {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {icon}
    </button>
  );
};

export default UserManagementPage;
