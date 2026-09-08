import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../lib/api";
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
import UserManagementModal from "../components/modals/UserManagementModal";
import {
  csvValue,
  formatBirthday,
  getInitials,
  roleConfigs,
} from "../data/userManagementData";

const TEMPORARY_PASSWORD = "Spry@12345";

const UserManagementDetails = ({ role }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const config = roleConfigs[role];

  const [selectedUser, setSelectedUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "edit",
    user: null,
  });

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);

      try {
        const response = await api.get(`${config.apiPath}/${userId}`);

        setSelectedUser(response.data.data);
      } catch (error) {
        setSelectedUser(null);

        toast.error(
          error.response?.data?.message || "Unable to load user details.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [config.apiPath, userId]);

  const openEditModal = () => {
    setModalState({
      isOpen: true,
      mode: "edit",
      user: selectedUser,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: "edit",
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

    setIsSaving(true);

    try {
      const response = await api.put(
        `${config.apiPath}/${selectedUser.id}`,
        formData,
      );

      setSelectedUser(response.data.user);

      closeModal();

      toast.success(
        response.data.message || "User details updated successfully.",
      );
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstMessage = Object.values(validationErrors).flat()[0];

        toast.error(firstMessage || "Validation failed.");

        return;
      }

      toast.error(
        error.response?.data?.message || "Unable to update user details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const result = await Swal.fire({
      title: "Reset Password?",
      html: `
        <div style="font-size:14px;color:#64748b;line-height:1.6;">
          Reset the password for
          <strong style="color:#0f172a;">
            ${selectedUser.fullName}
          </strong>?
          <br />
          The temporary password will be
          <strong style="color:#0f172a;">
            ${TEMPORARY_PASSWORD}
          </strong>.
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset password",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Resetting Password",
        text: "Please wait...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      /*
        If your backend reset-password route is named
        differently, change only this URL.
      */
      const response = await api.post(
        `${config.apiPath}/${selectedUser.id}/reset-password`,
        {
          password: TEMPORARY_PASSWORD,
          password_confirmation: TEMPORARY_PASSWORD,
        },
      );

      Swal.close();

      await Swal.fire({
        title: "Password Reset",
        html: `
          <div style="text-align:center;">
            <p style="
              margin:0 0 10px;
              color:#64748b;
              font-size:14px;
            ">
              Temporary password for
              <b>${selectedUser.username}</b>
            </p>

            <div style="
              padding:12px 14px;
              border-radius:8px;
              background:#f1f5f9;
              color:#0f172a;
              font-weight:700;
              font-size:18px;
              letter-spacing:1px;
            ">
              ${TEMPORARY_PASSWORD}
            </div>

            <p style="
              margin:10px 0 0;
              color:#64748b;
              font-size:13px;
            ">
              Ask the user to change this password
              after login.
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Done",
        confirmButtonColor: "#0891b2",
      });

      toast.success(response.data?.message || "Password reset successfully.");
    } catch (error) {
      Swal.close();

      toast.error(error.response?.data?.message || "Unable to reset password.");
    }
  };

  const handleExportUser = () => {
    if (!selectedUser) {
      toast.error("No user information available to export.");
      return;
    }

    try {
      const row = {
        userId: selectedUser.userId,
        fullName: selectedUser.fullName,
        username: selectedUser.username,
        email: selectedUser.email,
        mobile: selectedUser.mobile,
        birthday: selectedUser.birthday,
        rfid: selectedUser.rfid,
        department: selectedUser.department,
        position: selectedUser.position,
        role: config.roleLabel,
        status: selectedUser.status,
      };

      const header = Object.keys(row);
      const values = Object.values(row);

      const csvContent = [
        header.map(csvValue).join(","),
        values.map(csvValue).join(","),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${selectedUser.userId}-details.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("User details exported successfully.");
    } catch {
      toast.error("Unable to export user details.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm font-medium text-slate-500">
        Loading user...
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(config.listPath)}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to {config.title}
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            User not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The selected user record does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            {config.detailTitle}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and update user account, RFID, contact, and access details.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExportUser}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={handleResetPassword}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white"
          >
            <FiKey />
            Reset Password
          </button>

          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiEdit2 />
            Edit User
          </button>

          <button
            type="button"
            onClick={() => navigate(config.listPath)}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>
      </div>

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-medium text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(selectedUser.fullName)}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                {config.roleLabel}
              </p>

              <h2 className="text-xl font-medium text-slate-950">
                {selectedUser.fullName}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-600">
                  <FiHash />
                  {selectedUser.userId}
                </span>

                <StatusBadge status={selectedUser.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">RFID</p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {selectedUser.rfid || "No RFID assigned"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="User Information"
            icon={<FiUser />}
            color="cyan"
            onEdit={openEditModal}
            viewItems={[
              ["Full Name", selectedUser.fullName],
              ["Username", `@${selectedUser.username}`],
              ["User ID", selectedUser.userId],
              ["Birthday", formatBirthday(selectedUser.birthday)],
              ["Status", selectedUser.status],
            ]}
          />

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            color="orange"
            onEdit={openEditModal}
            viewItems={[
              ["Email Address", selectedUser.email],
              ["Mobile Number", selectedUser.mobile],
            ]}
          />

          <DetailCard
            title="RFID Information"
            icon={<FiCreditCard />}
            color="emerald"
            onEdit={openEditModal}
            viewItems={[
              ["RFID Number", selectedUser.rfid || "No RFID assigned"],
              ["Assigned To", selectedUser.fullName],
              ["User ID", selectedUser.userId],
              ["Role", config.roleLabel],
            ]}
          />

          <DetailCard
            title="Access Information"
            icon={<FiShield />}
            color="violet"
            onEdit={openEditModal}
            viewItems={[
              ["Role", config.roleLabel],
              ["Access Level", config.roleLabel],
              ["Account Status", selectedUser.status],
              ["Department", selectedUser.department],
              ["Position", selectedUser.position],
            ]}
          />
        </div>
      </div>

      <UserManagementModal
        isOpen={modalState.isOpen}
        mode="edit"
        roleLabel={config.roleLabel}
        user={modalState.user}
        isSaving={isSaving}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </div>
  );
};

const DetailCard = ({ title, icon, color, onEdit, viewItems }) => {
  const colorClass = {
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const visibleItems = viewItems.filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-md ${
              colorClass[color] || colorClass.cyan
            }`}
          >
            {icon}
          </div>

          <h3 className="font-medium text-slate-950">{title}</h3>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"
          title="Edit"
        >
          <FiEdit2 />
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {visibleItems.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium text-slate-500">{label}</p>

            <p className="mt-1 break-words text-sm font-medium text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
};

export default UserManagementDetails;
