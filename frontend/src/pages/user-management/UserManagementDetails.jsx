import { useCallback, useEffect, useReducer, useRef } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";

import { ToastContainer, toast } from "react-toastify";

import {
  FiArrowLeft,
  FiCreditCard,
  FiDownload,
  FiEdit2,
  FiHash,
  FiKey,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";

import api from "../../services/api";

import UserManagementModal from "../../components/modals/user-management/UserManagementModal";

import {
  csvValue,
  extractUser,
  formatBirthday,
  formatUsername,
  getApiErrorMessage,
  getInitials,
  getRoleConfig,
  normalizeUser,
} from "../../data/user-management/userManagementData";

const TEMPORARY_PASSWORD = "Spry@12345";

/* =========================================================
   STATE
========================================================= */

const createInitialState = (navigationUser) => {
  return {
    user: normalizeUser(navigationUser),

    isLoading: true,

    isSaving: false,

    modalOpen: false,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        isLoading: true,
      };

    case "LOAD_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isLoading: false,
      };

    case "LOAD_FAILED":
      return {
        ...state,
        user: null,
        isLoading: false,
      };

    case "OPEN_MODAL":
      return {
        ...state,
        modalOpen: true,
      };

    case "CLOSE_MODAL":
      return {
        ...state,
        modalOpen: false,
      };

    case "SAVE_START":
      return {
        ...state,
        isSaving: true,
      };

    case "SAVE_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isSaving: false,
        modalOpen: false,
      };

    case "SAVE_END":
      return {
        ...state,
        isSaving: false,
      };

    default:
      return state;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

const UserManagementDetails = ({ role }) => {
  const navigate = useNavigate();

  const location = useLocation();

  const { userId } = useParams();

  const config = getRoleConfig(role);

  const [state, dispatch] = useReducer(
    reducer,
    location.state?.user,
    createInitialState,
  );

  const requestIdRef = useRef(0);

  /* =======================================================
     LOAD USER
  ======================================================= */

  const loadUser = useCallback(
    async ({ showSkeleton = true } = {}) => {
      if (!config?.apiPath || !userId) {
        dispatch({
          type: "LOAD_FAILED",
        });

        return null;
      }

      const requestId = ++requestIdRef.current;

      if (showSkeleton) {
        dispatch({
          type: "LOAD_START",
        });
      }

      try {
        const response = await api.get(
          `${config.apiPath}/${encodeURIComponent(userId)}`,
        );

        if (requestId !== requestIdRef.current) {
          return null;
        }

        const user = extractUser(response);

        if (!user?.id) {
          dispatch({
            type: "LOAD_FAILED",
          });

          return null;
        }

        dispatch({
          type: "LOAD_SUCCESS",

          payload: user,
        });

        return user;
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return null;
        }

        dispatch({
          type: "LOAD_FAILED",
        });

        if (error?.response?.status !== 404) {
          toast.error(
            getApiErrorMessage(error, "Unable to load user details."),
          );
        }

        return null;
      }
    },
    [config?.apiPath, userId],
  );

  useEffect(() => {
    loadUser();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadUser]);

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    if (!config) {
      navigate("/");
      return;
    }

    navigate(config.listPath);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const openEditModal = () => {
    dispatch({
      type: "OPEN_MODAL",
    });
  };

  const closeEditModal = () => {
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
    if (!state.user?.id) {
      toast.error("Unable to update this account.");

      return false;
    }

    const confirmation = await Swal.fire({
      title: "Save changes?",

      text: `Save changes for ${formatUsername(formData.username)}?`,

      icon: "question",

      showCancelButton: true,

      confirmButtonText: "Save changes",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#0891b2",

      cancelButtonColor: "#64748b",

      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return false;
    }

    dispatch({
      type: "SAVE_START",
    });

    try {
      const response = await api.put(
        `${config.apiPath}/${state.user.id}`,
        formData,
      );

      let updatedUser = extractUser(response);

      /*
       * Some APIs return only:
       *
       * {
       *   message: "Updated"
       * }
       *
       * If that happens, fetch
       * the user again.
       */
      if (!updatedUser?.id) {
        const refreshResponse = await api.get(
          `${config.apiPath}/${state.user.id}`,
        );

        updatedUser = extractUser(refreshResponse);
      }

      if (updatedUser?.id) {
        dispatch({
          type: "SAVE_SUCCESS",

          payload: updatedUser,
        });
      } else {
        dispatch({
          type: "SAVE_END",
        });

        dispatch({
          type: "CLOSE_MODAL",
        });
      }

      toast.success(
        response?.data?.message || "User details updated successfully.",
      );

      return true;
    } catch (error) {
      dispatch({
        type: "SAVE_END",
      });

      toast.error(getApiErrorMessage(error, "Unable to update user details."));

      return false;
    }
  };

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  const handleResetPassword = async () => {
    if (!state.user?.id) {
      return;
    }

    const result = await Swal.fire({
      title: "Reset password?",

      text: `Reset the password for ${state.user.fullName}?`,

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Reset password",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#f97316",

      cancelButtonColor: "#64748b",

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      Swal.fire({
        title: "Resetting password",

        text: "Please wait...",

        allowOutsideClick: false,

        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.post(
        `${config.apiPath}/${state.user.id}/reset-password`,
        {
          password: TEMPORARY_PASSWORD,

          password_confirmation: TEMPORARY_PASSWORD,
        },
      );

      Swal.close();

      await Swal.fire({
        title: "Password reset",

        html: `
            <div style="
              font-size: 14px;
              color: #64748b;
            ">
              Temporary password
            </div>

            <div style="
              margin-top: 10px;
              padding: 12px 14px;
              border-radius: 6px;
              background: #f1f5f9;
              color: #0f172a;
              font-size: 17px;
              font-weight: 500;
              letter-spacing: 0.5px;
            ">
              ${TEMPORARY_PASSWORD}
            </div>
          `,

        icon: "success",

        confirmButtonText: "Done",

        confirmButtonColor: "#0891b2",
      });

      toast.success(response?.data?.message || "Password reset successfully.");
    } catch (error) {
      Swal.close();

      toast.error(getApiErrorMessage(error, "Unable to reset password."));
    }
  };

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExportUser = () => {
    const user = state.user;

    if (!user) {
      toast.error("No user information available.");

      return;
    }

    try {
      const row = {
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
      };

      const csvContent = [
        Object.keys(row).map(csvValue).join(","),

        Object.values(row).map(csvValue).join(","),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${user.userId || user.id}-details.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

      toast.success("User details exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);

      toast.error("Unable to export user details.");
    }
  };

  /* =======================================================
     INVALID ROLE
  ======================================================= */

  if (!config) {
    return (
      <div className="rounded-md bg-white p-6 text-sm font-normal text-slate-500 shadow-sm">
        This user page is not available.
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
        <DetailsSkeleton />
      ) : !state.user ? (
        <NotFoundState roleLabel={config.roleLabel} onBack={handleBack} />
      ) : (
        <UserDetailsContent
          user={state.user}
          config={config}
          isSaving={state.isSaving}
          modalOpen={state.modalOpen}
          onBack={handleBack}
          onEdit={openEditModal}
          onCloseEdit={closeEditModal}
          onSave={handleSaveUser}
          onExport={handleExportUser}
          onResetPassword={handleResetPassword}
        />
      )}
    </>
  );
};

/* =========================================================
   MAIN DETAILS CONTENT
========================================================= */

const UserDetailsContent = ({
  user,
  config,
  isSaving,
  modalOpen,
  onBack,
  onEdit,
  onCloseEdit,
  onSave,
  onExport,
  onResetPassword,
}) => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <h1 className="text-2xl font-medium text-slate-950">
          {config.detailTitle}
        </h1>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={onResetPassword}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-orange-50 px-4 text-sm font-normal text-orange-600 transition hover:bg-orange-500 hover:text-white"
          >
            <FiKey />
            Reset Password
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiEdit2 />
            Edit
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-normal text-white transition hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>
      </div>

      {/* PROFILE */}
      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-medium text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(user.fullName)}
            </div>

            <div>
              <p className="text-sm font-normal text-slate-500">
                {config.roleLabel}
              </p>

              <p className="text-xl font-medium text-slate-950">
                {user.fullName || "-"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-600">
                  <FiHash />

                  {user.userId || "-"}
                </span>

                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-normal text-slate-500">RFID</p>

            <p className="mt-1 text-sm font-normal text-slate-900">
              {user.rfid || "Not assigned"}
            </p>
          </div>
        </div>

        {/* CARDS */}
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="User Information"
            icon={<FiUser />}
            onEdit={onEdit}
            items={[
              ["Full Name", user.fullName],

              ["Username", formatUsername(user.username)],

              ["User ID", user.userId],

              ["Birthday", formatBirthday(user.birthday)],

              ["Status", user.status],
            ]}
          />

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            onEdit={onEdit}
            items={[
              ["Email", user.email],

              ["Mobile Number", user.mobile],

              ["Address", user.address],
            ]}
          />

          <DetailCard
            title="RFID Information"
            icon={<FiCreditCard />}
            onEdit={onEdit}
            items={[
              ["RFID Number", user.rfid || "Not assigned"],

              ["Assigned To", user.fullName],

              ["User ID", user.userId],
            ]}
          />

          <DetailCard
            title="Access Information"
            icon={<FiShield />}
            onEdit={onEdit}
            items={[
              ["Role", config.roleLabel],

              ["Status", user.status],

              ["Department", user.department],

              ["Position", user.position],

              [
                "Employment Status",
                formatEmploymentStatus(user.employmentStatus),
              ],

              ["Hire Date", formatBirthday(user.hireDate)],
            ]}
          />
        </div>
      </div>

      <UserManagementModal
        isOpen={modalOpen}
        mode="edit"
        roleLabel={config.roleLabel}
        user={user}
        isSaving={isSaving}
        onClose={onCloseEdit}
        onSave={onSave}
      />
    </div>
  );
};

/* =========================================================
   DETAIL CARD
========================================================= */

const DetailCard = ({ title, icon, items, onEdit }) => {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
            {icon}
          </div>

          <p className="text-sm font-medium text-slate-900">{title}</p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"
        >
          <FiEdit2 />
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-normal text-slate-500">{label}</p>

            <p className="mt-1 break-words text-sm font-normal text-slate-900">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   STATUS
========================================================= */

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-normal ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {status || "Inactive"}
    </span>
  );
};

/* =========================================================
   NOT FOUND
========================================================= */

const NotFoundState = ({ roleLabel, onBack }) => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
      >
        <FiArrowLeft />
        Back
      </button>

      <div className="rounded-md bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-normal text-slate-600">
          No {String(roleLabel || "user").toLowerCase()} account found.
        </p>

        <p className="mt-1 text-xs font-normal text-slate-400">
          The account may have been removed or is no longer available.
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
};

const DetailsSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-44" />

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />

          <Skeleton className="h-10 w-36 rounded-md" />

          <Skeleton className="h-10 w-20 rounded-md" />

          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="rounded-md bg-white p-5 shadow-sm">
        {/* PROFILE */}
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />

            <div>
              <Skeleton className="h-4 w-20" />

              <Skeleton className="mt-2 h-6 w-48" />

              <div className="mt-2 flex gap-3">
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </div>
          </div>

          <div className="w-full rounded-md bg-slate-50 p-4 lg:w-52">
            <Skeleton className="h-3 w-12" />

            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>

        {/* DETAIL CARDS */}
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <DetailCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

const DetailCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />

          <Skeleton className="h-4 w-36" />
        </div>

        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-20" />

            <Skeleton
              className={`mt-2 h-4 ${index % 2 === 0 ? "w-32" : "w-40"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   FORMAT
========================================================= */

const formatEmploymentStatus = (status) => {
  if (!status) {
    return "-";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export default UserManagementDetails;
