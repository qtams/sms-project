  import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

  import { useNavigate } from "react-router-dom";

  import Swal from "sweetalert2";

  import { ToastContainer, toast } from "react-toastify";

  import "react-toastify/dist/ReactToastify.css";

  import {
    FiCheckCircle,
    FiChevronLeft,
    FiChevronRight,
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

  import api from "../../services/api";

  import UserManagementModal from "../../components/modals/user-management/UserManagementModal";

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

  const rowsPerPageOptions = [5, 10, 25, 50];

  /* =========================================================
    STATE
  ========================================================= */

  const initialState = {
    users: [],

    isLoading: true,
    isSaving: false,

    searchTerm: "",
    statusFilter: "All",

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

        {state.isLoading ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-5 [font-family:'Poppins',sans-serif]">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h1 className="text-2xl font-medium text-slate-950">
                {config.title}
              </h1>

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
                  onClick={openCreateModal}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Add User
                </button>
              </div>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="grid gap-3 md:grid-cols-3">
              <SummaryCard label="Total Users" value={summary.total} />

              <SummaryCard label="Active" value={summary.active} />

              <SummaryCard label="Inactive" value={summary.inactive} />
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-md bg-white shadow-sm">
              {/* FILTER */}

              <div className="border-b border-slate-100 p-4">
                <p className="text-base font-medium text-slate-900">
                  {config.roleLabel} Accounts
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                  <div className="relative">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={state.searchTerm}
                      onChange={(event) =>
                        dispatch({
                          type: "SET_SEARCH",

                          payload: event.target.value,
                        })
                      }
                      placeholder="Search name, username, email, or staff ID..."
                      className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                    />
                  </div>

                  <select
                    value={state.statusFilter}
                    onChange={(event) =>
                      dispatch({
                        type: "SET_STATUS_FILTER",

                        payload: event.target.value,
                      })
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                  >
                    <option value="All">All Status</option>

                    <option value="Active">Active</option>

                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* TABLE */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-left">
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
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => {
                        const pending =
                          String(state.pendingActionId) === String(user.id);

                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-100 transition hover:bg-slate-50"
                          >
                            {/* USER ID */}

                            <td className="px-5 py-4 text-sm font-normal text-slate-600">
                              {user.userId || "-"}
                            </td>

                            {/* NAME */}

                            <td className="px-5 py-4 text-sm font-normal text-slate-900">
                              {user.fullName || "-"}
                            </td>

                            {/* USERNAME */}

                            <td className="px-5 py-4 text-sm font-normal text-slate-600">
                              {formatUsername(user.username)}
                            </td>

                            {/* EMAIL */}

                            <td className="px-5 py-4 text-sm font-normal text-slate-600">
                              <span className="flex items-center gap-2">
                                <FiMail className="shrink-0 text-slate-400" />

                                {user.email || "-"}
                              </span>
                            </td>

                            {/* MOBILE */}

                            <td className="px-5 py-4 text-sm font-normal text-slate-600">
                              <span className="flex items-center gap-2">
                                <FiPhone className="shrink-0 text-slate-400" />

                                {user.mobile || "-"}
                              </span>
                            </td>

                            {/* ROLE */}

                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-normal text-slate-600">
                                <FiUser />

                                {config.roleLabel}
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleStatusToggle(user)}
                                className="disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <StatusBadge status={user.status} />
                              </button>
                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <IconButton
                                  title="View"
                                  icon={<FiEye />}
                                  onClick={() => handleViewUser(user)}
                                  className="bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white"
                                />

                                <IconButton
                                  title="Edit"
                                  icon={<FiEdit2 />}
                                  disabled={pending}
                                  onClick={() => openEditModal(user)}
                                  className="bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white"
                                />

                                <IconButton
                                  title="Delete"
                                  icon={<FiTrash2 />}
                                  disabled={pending}
                                  onClick={() => handleDelete(user)}
                                  className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8">
                          <EmptyState
                            config={config}
                            hasFilter={
                              Boolean(state.searchTerm.trim()) ||
                              state.statusFilter !== "All"
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  PAGINATION
              ================================================= */}

              <PaginationFooter
                currentPage={state.currentPage}
                totalPages={totalPages}
                rowsPerPage={state.rowsPerPage}
                totalRows={filteredUsers.length}
                showingStart={showingStart}
                showingEnd={showingEnd}
                onRowsPerPageChange={(value) =>
                  dispatch({
                    type: "SET_ROWS_PER_PAGE",

                    payload: value,
                  })
                }
                onPageChange={(page) =>
                  dispatch({
                    type: "SET_CURRENT_PAGE",

                    payload: page,
                  })
                }
              />
            </div>

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
        )}
      </>
    );
  };

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
  }) => {
    return (
      <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
        {/* LEFT */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-slate-500">Show</span>

            <select
              value={rowsPerPage}
              onChange={(event) =>
                onRowsPerPageChange(Number(event.target.value))
              }
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
            Showing {showingStart} to {showingEnd} of {totalRows} users
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
            Prev
          </button>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-normal text-slate-600">
            Page {currentPage} of {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
          >
            Next
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  /* =========================================================
    SUMMARY CARD
  ========================================================= */

  const SummaryCard = ({ label, value }) => {
    return (
      <div className="rounded-md bg-white p-4 shadow-sm">
        <p className="text-sm font-normal text-slate-500">{label}</p>

        <p className="mt-2 text-2xl font-medium text-slate-950">{value}</p>
      </div>
    );
  };

  /* =========================================================
    TABLE HEADER
  ========================================================= */

  const TableHeader = ({ label }) => {
    return (
      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </th>
    );
  };

  /* =========================================================
    STATUS
  ========================================================= */

  const StatusBadge = ({ status }) => {
    const active = status === "Active";

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }`}
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

  /* =========================================================
    EMPTY
  ========================================================= */

  const EmptyState = ({ config, hasFilter }) => {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-normal text-slate-600">
          {hasFilter
            ? `No matching ${config.roleLabel.toLowerCase()} accounts.`
            : `No ${config.roleLabel.toLowerCase()} accounts yet.`}
        </p>

        <p className="mt-1 text-xs font-normal text-slate-400">
          {hasFilter
            ? "Try another search or status."
            : `${config.roleLabel} accounts will appear here once they are added.`}
        </p>
      </div>
    );
  };

  /* =========================================================
    SKELETON
  ========================================================= */

  const Skeleton = ({ className = "" }) => {
    return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
  };

  const PageSkeleton = () => {
    return (
      <div className="space-y-5 [font-family:'Poppins',sans-serif]">
        {/* TITLE */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <Skeleton className="h-8 w-40" />

          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />

            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({
            length: 3,
          }).map((_, index) => (
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
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {Array.from({
                    length: 8,
                  }).map((_, index) => (
                    <th key={index} className="px-5 py-4">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Array.from({
                  length: 6,
                }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-slate-100">
                    <td className="px-5 py-5">
                      <Skeleton className="h-4 w-20" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-4 w-32" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-4 w-40" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-4 w-28" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-7 w-20" />
                    </td>

                    <td className="px-5 py-5">
                      <Skeleton className="h-7 w-20" />
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-9 w-9" />

                        <Skeleton className="h-9 w-9" />

                        <Skeleton className="h-9 w-9" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION SKELETON */}

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
  };

  export default UserManagementPage;
