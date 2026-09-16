import { useState } from "react";
import {
  FiCreditCard,
  FiEdit2,
  FiHash,
  FiKey,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import AccountInformationModal from "../../components/modals/account/AccountInformationModal";

/* =========================================================
   HELPERS
   (mirrors the helpers used by UserManagementDetails /
   userManagementData.js — adjust field names to match
   whatever your /api/user response actually returns)
========================================================= */

const getInitials = (name) =>
  (name || "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const formatUsername = (username) => (username ? `@${username}` : "-");

const formatBirthday = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatEmploymentStatus = (status) => {
  if (!status) {
    return "-";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeAccount = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,

    userId: user.userId ?? user.user_id ?? user.employee_id ?? user.id ?? "",

    fullName:
      user.fullName ??
      user.full_name ??
      [user.first_name, user.last_name].filter(Boolean).join(" ") ??
      user.name ??
      "",

    username: user.username ?? "",

    email: user.email ?? "",

    mobile: user.mobile ?? user.mobile_number ?? user.contact_number ?? "",

    address: user.address ?? "",

    birthday: user.birthday ?? user.date_of_birth ?? "",

    gender: user.gender ?? "",

    rfid: user.rfid ?? user.rfid_number ?? "",

    department: user.department?.name ?? user.department ?? "",

    position: user.position?.name ?? user.position ?? "",

    employmentStatus: user.employmentStatus ?? user.employment_status ?? "",

    hireDate: user.hireDate ?? user.hire_date ?? "",

    role: user.role ?? user.role_name ?? "",

    accountType: user.accountType ?? user.account_type ?? user.role ?? "Admin",

    status: user.status ?? (user.is_active === false ? "Inactive" : "Active"),
  };
};

/* =========================================================
   PAGE
========================================================= */

const AccountInformation = () => {
  const { user, isAuthLoading, loadUser } = useAuth();

  const account = normalizeAccount(user);

  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = () => setModalOpen(true);

  const closeEditModal = () => {
    if (isSaving) {
      return;
    }

    setModalOpen(false);
  };

  const handleSave = async (formData) => {
    if (!formData.fullName?.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!formData.email?.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setIsSaving(true);

    try {
      // Adjust endpoint/payload to match your backend.
      await api.patch("/api/user", formData);

      // Re-pull the fresh user from the backend so AuthContext
      // and this page both stay in sync.
      await loadUser();

      setModalOpen(false);

      toast.success("Account details updated successfully.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to update account details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  const handleChangePassword = () => {
    // Wire this up to a change-password modal/endpoint when ready.
    toast.info("Change password is not set up yet.");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isAuthLoading || !account) {
    return <AccountInformationSkeleton />;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="space-y-5 [font-family:'Poppins',sans-serif]"
      data-aos="fade-up"
    >
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <h1 className="text-2xl font-medium text-slate-950">
          Account Information
        </h1>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleChangePassword}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-orange-50 px-4 text-sm font-normal text-orange-600 transition hover:bg-orange-500 hover:text-white"
          >
            <FiKey />
            Change Password
          </button>

          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiEdit2 />
            Edit
          </button>
        </div>
      </div>

      {/* MAIN CARD */}

      <div className="rounded-md bg-white p-5 shadow-sm">
        {/* PROFILE */}

        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-medium text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(account.fullName)}
            </div>

            <div>
              <p className="text-sm font-normal text-slate-500">
                {account.role || account.accountType}
              </p>

              <p className="text-xl font-medium text-slate-950">
                {account.fullName || "-"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-600">
                  <FiHash />
                  {account.userId || "-"}
                </span>

                <StatusBadge status={account.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-normal text-slate-500">RFID</p>

            <p className="mt-1 text-sm font-normal text-slate-900">
              {account.rfid || "Not assigned"}
            </p>
          </div>
        </div>

        {/* CARDS */}

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="User Information"
            icon={<FiUser />}
            onEdit={openEditModal}
            items={[
              ["Full Name", account.fullName],
              ["Username", formatUsername(account.username)],
              ["User ID", account.userId],
              ["Birthday", formatBirthday(account.birthday)],
              ["Gender", account.gender],
              ["Status", account.status],
            ]}
          />

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            onEdit={openEditModal}
            items={[
              ["Email", account.email],
              ["Mobile Number", account.mobile],
              ["Address", account.address],
            ]}
          />

          <DetailCard
            title="RFID Information"
            icon={<FiCreditCard />}
            items={[
              ["RFID Number", account.rfid || "Not assigned"],
              ["Assigned To", account.fullName],
              ["User ID", account.userId],
            ]}
          />

          <DetailCard
            title="Access Information"
            icon={<FiShield />}
            onEdit={openEditModal}
            items={[
              ["Role", account.role || account.accountType],
              ["Status", account.status],
              ["Department", account.department],
              ["Position", account.position],
              [
                "Employment Status",
                formatEmploymentStatus(account.employmentStatus),
              ],
              ["Hire Date", formatBirthday(account.hireDate)],
            ]}
          />
        </div>
      </div>

      <AccountInformationModal
        isOpen={modalOpen}
        account={account}
        isSaving={isSaving}
        onClose={closeEditModal}
        onSave={handleSave}
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

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"
          >
            <FiEdit2 />
          </button>
        )}
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
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);

const AccountInformationSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-56" />

        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="rounded-md bg-white p-5 shadow-sm">
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

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
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
        {Array.from({ length: 6 }).map((_, index) => (
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

export default AccountInformation;
