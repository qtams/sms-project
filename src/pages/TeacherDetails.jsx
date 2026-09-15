import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiBriefcase,
  FiCreditCard,
  FiDownload,
  FiEdit2,
  FiHash,
  FiMail,
  FiSave,
  FiUser,
} from "react-icons/fi";

import { toast } from "react-toastify";

import api from "../lib/api";

import RfidUploadModal from "../components/modals/RfidUploadModal";

/* =========================================================
   OPTIONS
========================================================= */

const departmentOptions = [
  "Preschool",
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Administration",
];

const statusOptions = ["Active", "Inactive"];

const genderOptions = ["Male", "Female"];

const positionOptions = [
  "Teacher",
  "Adviser",
  "Coordinator",
  "Department Head",
  "Principal",
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (value, isActive) => {
  const status = String(value || "").toLowerCase();

  if (status === "active") {
    return "Active";
  }

  if (status === "inactive") {
    return "Inactive";
  }

  if (isActive === true || isActive === 1 || isActive === "1") {
    return "Active";
  }

  return "Inactive";
};

const normalizeTeacher = (teacher) => {
  if (!teacher) {
    return null;
  }

  return {
    ...teacher,

    id: teacher.id ?? teacher.teacher_record_id ?? teacher.teacherRecordId,

    teacherId: teacher.teacherId ?? teacher.teacher_id ?? "",

    rfid: teacher.rfid ?? teacher.rfid_number ?? "",

    firstName: teacher.firstName ?? teacher.first_name ?? "",

    middleName: teacher.middleName ?? teacher.middle_name ?? "",

    lastName: teacher.lastName ?? teacher.last_name ?? "",

    gender: teacher.gender ?? "",

    department:
      teacher.department?.name ??
      teacher.department ??
      teacher.department_name ??
      "",

    position:
      teacher.position?.name ?? teacher.position ?? teacher.position_name ?? "",

    email: teacher.email ?? "",

    mobile:
      teacher.mobile ?? teacher.mobile_number ?? teacher.contact_number ?? "",

    address: teacher.address ?? "",

    status: normalizeStatus(teacher.status, teacher.is_active),

    photoPreview:
      teacher.photoPreview ??
      teacher.photo_preview ??
      teacher.photoUrl ??
      teacher.photo_url ??
      "",
  };
};

const extractTeacher = (response) => {
  const data = response?.data ?? {};

  const teacher = data.teacher ?? data.data?.teacher ?? data.data ?? null;

  if (!teacher || Array.isArray(teacher) || typeof teacher !== "object") {
    return null;
  }

  return normalizeTeacher(teacher);
};

const getApiErrorMessage = (error, fallback) => {
  const errors = error?.response?.data?.errors;

  if (errors) {
    const firstError = Object.values(errors).flat().find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return error?.response?.data?.message || error?.message || fallback;
};

const getFullName = (teacher) => {
  return [teacher?.firstName, teacher?.middleName, teacher?.lastName]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (teacher) => {
  const value = `${teacher?.firstName?.[0] || ""}${
    teacher?.lastName?.[0] || ""
  }`.toUpperCase();

  return value || "?";
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/* =========================================================
   PAGE
========================================================= */

const TeacherDetails = () => {
  const navigate = useNavigate();

  const { teacherId } = useParams();

  const [teacher, setTeacher] = useState(null);

  const [draftTeacher, setDraftTeacher] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [editingSection, setEditingSection] = useState("");

  const [savingSection, setSavingSection] = useState("");

  const [rfidModal, setRfidModal] = useState({
    isOpen: false,

    ownerType: "teacher",

    ownerId: "",

    ownerName: "",

    currentRfid: "",
  });

  /* =======================================================
     LOAD REAL TEACHER
  ======================================================= */

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      setTeacher(null);

      return;
    }

    let cancelled = false;

    const loadTeacher = async () => {
      setIsLoading(true);

      setLoadError("");

      try {
        const response = await api.get(
          `/api/teachers/${encodeURIComponent(teacherId)}`,
        );

        if (cancelled) {
          return;
        }

        const loadedTeacher = extractTeacher(response);

        if (!loadedTeacher) {
          setTeacher(null);

          setLoadError("The selected teacher record does not exist.");

          return;
        }

        setTeacher(loadedTeacher);

        setDraftTeacher(loadedTeacher);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTeacher(null);

        setLoadError(
          getApiErrorMessage(
            error,
            "The selected teacher record does not exist.",
          ),
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTeacher();

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  /* =======================================================
     EDIT
  ======================================================= */

  const startEdit = (section) => {
    setEditingSection(section);

    setDraftTeacher({
      ...teacher,
    });
  };

  const cancelEdit = () => {
    setEditingSection("");

    setDraftTeacher({
      ...teacher,
    });
  };

  const updateDraft = (field, value) => {
    setDraftTeacher((current) => ({
      ...current,

      [field]: value,
    }));
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const saveSection = async (section) => {
    if (
      section === "teacher" &&
      (!draftTeacher.firstName?.trim() || !draftTeacher.lastName?.trim())
    ) {
      toast.error("First name and last name are required.");

      return;
    }

    if (section === "work" && !draftTeacher.teacherId?.trim()) {
      toast.error("Teacher ID is required.");

      return;
    }

    setSavingSection(section);

    try {
      const payload = {
        teacherId: draftTeacher.teacherId?.trim() || "",

        rfid: draftTeacher.rfid?.trim() || "",

        firstName: draftTeacher.firstName?.trim() || "",

        middleName: draftTeacher.middleName?.trim() || "",

        lastName: draftTeacher.lastName?.trim() || "",

        gender: draftTeacher.gender || "",

        department: draftTeacher.department || "",

        position: draftTeacher.position || "",

        email: draftTeacher.email?.trim() || "",

        mobile: draftTeacher.mobile?.trim() || "",

        address: draftTeacher.address?.trim() || "",

        status: draftTeacher.status || "Active",
      };

      const response = await api.patch(
        `/api/teachers/${encodeURIComponent(teacher.teacherId)}`,

        payload,
      );

      const updatedTeacher =
        extractTeacher(response) ||
        normalizeTeacher({
          ...teacher,
          ...payload,
        });

      setTeacher(updatedTeacher);

      setDraftTeacher(updatedTeacher);

      setEditingSection("");

      if (updatedTeacher.teacherId && updatedTeacher.teacherId !== teacherId) {
        navigate(`/teachers/${encodeURIComponent(updatedTeacher.teacherId)}`, {
          replace: true,
        });
      }

      toast.success(
        response?.data?.message || "Teacher details updated successfully.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to update teacher details."),
      );
    } finally {
      setSavingSection("");
    }
  };

  /* =======================================================
     RFID
  ======================================================= */

  const openRfidModal = () => {
    setRfidModal({
      isOpen: true,

      ownerType: "teacher",

      ownerId: teacher.teacherId,

      ownerName: getFullName(teacher),

      currentRfid: teacher.rfid || "",
    });
  };

  const closeRfidModal = () => {
    setRfidModal({
      isOpen: false,

      ownerType: "teacher",

      ownerId: "",

      ownerName: "",

      currentRfid: "",
    });
  };

  const handleRfidSaved = ({ rfid }) => {
    setTeacher((current) => ({
      ...current,

      rfid,
    }));

    setDraftTeacher((current) => ({
      ...current,

      rfid,
    }));

    closeRfidModal();
  };

  /* =======================================================
     EXPORT
  ======================================================= */

  const handleExportTeacher = () => {
    if (!teacher) {
      return;
    }

    const row = {
      teacherId: teacher.teacherId,

      rfid: teacher.rfid,

      fullName: getFullName(teacher),

      firstName: teacher.firstName,

      middleName: teacher.middleName,

      lastName: teacher.lastName,

      gender: teacher.gender,

      department: teacher.department,

      position: teacher.position,

      email: teacher.email,

      mobile: teacher.mobile,

      address: teacher.address,

      status: teacher.status,
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

    link.download = `${teacher.teacherId || "teacher"}-details.csv`;

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Teacher details exported successfully.");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return <TeacherDetailsSkeleton />;
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!teacher) {
    return (
      <div className="space-y-5 [font-family:'Poppins',sans-serif]">
        <button
          type="button"
          onClick={() => navigate("/teachers")}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
        >
          <FiArrowLeft />
          Back
        </button>

        <div className="rounded-md bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-normal text-slate-600">
            Teacher not found.
          </p>

          <p className="mt-1 text-xs font-normal text-slate-400">
            {loadError || "The selected teacher record does not exist."}
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <h1 className="text-2xl font-medium text-slate-950">Teacher Details</h1>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportTeacher}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={openRfidModal}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-normal text-white transition hover:bg-cyan-700"
          >
            <FiCreditCard />
            Upload RFID
          </button>

          <button
            type="button"
            onClick={() => navigate("/teachers")}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-normal text-white transition hover:bg-slate-800"
          >
            <FiArrowLeft />
            Back
          </button>
        </div>
      </div>

      {/* MAIN CARD */}

      <div className="rounded-md bg-white p-5 shadow-sm">
        {/* PROFILE */}

        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {teacher.photoPreview ? (
              <img
                src={teacher.photoPreview}
                alt={getFullName(teacher)}
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-cyan-100"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-normal text-cyan-700 ring-4 ring-cyan-100">
                {getInitials(teacher)}
              </div>
            )}

            <div>
              <p className="text-sm font-normal text-slate-500">Teacher</p>

              <p className="text-xl font-medium text-slate-950">
                {getFullName(teacher) || "-"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-normal text-slate-600">
                  <FiHash />

                  {teacher.teacherId || "-"}
                </span>

                <StatusBadge status={teacher.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-normal text-slate-500">RFID</p>

            <p className="mt-1 text-sm font-normal text-slate-900">
              {teacher.rfid || "No RFID assigned"}
            </p>
          </div>
        </div>

        {/* DETAIL GRID */}

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {/* TEACHER INFORMATION */}

          <DetailCard
            title="Teacher Information"
            icon={<FiUser />}
            color="cyan"
            section="teacher"
            editingSection={editingSection}
            savingSection={savingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Last Name", teacher.lastName],
              ["First Name", teacher.firstName],
              ["Middle Name", teacher.middleName],
              ["Gender", teacher.gender],
              ["Status", teacher.status],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Last Name"
                value={draftTeacher.lastName}
                onChange={(value) => updateDraft("lastName", value)}
              />

              <FormInput
                label="First Name"
                value={draftTeacher.firstName}
                onChange={(value) => updateDraft("firstName", value)}
              />

              <FormInput
                label="Middle Name"
                value={draftTeacher.middleName}
                onChange={(value) => updateDraft("middleName", value)}
              />

              <FormSelect
                label="Gender"
                value={draftTeacher.gender}
                options={genderOptions}
                onChange={(value) => updateDraft("gender", value)}
              />

              <FormSelect
                label="Status"
                value={draftTeacher.status}
                options={statusOptions}
                onChange={(value) => updateDraft("status", value)}
              />
            </div>
          </DetailCard>

          {/* CONTACT */}

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            color="orange"
            section="contact"
            editingSection={editingSection}
            savingSection={savingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Email Address", teacher.email],
              ["Mobile Number", teacher.mobile],
              ["Home Address", teacher.address],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Email Address"
                type="email"
                value={draftTeacher.email}
                onChange={(value) => updateDraft("email", value)}
              />

              <FormInput
                label="Mobile Number"
                value={draftTeacher.mobile}
                onChange={(value) => updateDraft("mobile", value)}
              />

              <div className="sm:col-span-2">
                <FormInput
                  label="Home Address"
                  value={draftTeacher.address}
                  onChange={(value) => updateDraft("address", value)}
                />
              </div>
            </div>
          </DetailCard>

          {/* WORK */}

          <DetailCard
            title="Work Information"
            icon={<FiBriefcase />}
            color="violet"
            section="work"
            editingSection={editingSection}
            savingSection={savingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Teacher ID", teacher.teacherId],
              ["RFID", teacher.rfid],
              ["Department", teacher.department],
              ["Position", teacher.position],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Teacher ID"
                value={draftTeacher.teacherId}
                onChange={(value) => updateDraft("teacherId", value)}
              />

              <FormInput
                label="RFID"
                value={draftTeacher.rfid}
                onChange={(value) => updateDraft("rfid", value)}
              />

              <FormSelect
                label="Department"
                value={draftTeacher.department}
                options={departmentOptions}
                onChange={(value) => updateDraft("department", value)}
              />

              <FormSelect
                label="Position"
                value={draftTeacher.position}
                options={positionOptions}
                onChange={(value) => updateDraft("position", value)}
              />
            </div>
          </DetailCard>

          {/* RFID */}

          <DetailCard
            title="RFID Information"
            icon={<FiCreditCard />}
            color="emerald"
            section="rfid"
            editingSection={editingSection}
            savingSection={savingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["RFID Number", teacher.rfid || "No RFID assigned"],
              ["Assigned To", getFullName(teacher)],
              ["Teacher ID", teacher.teacherId],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="RFID Number"
                value={draftTeacher.rfid}
                onChange={(value) => updateDraft("rfid", value)}
              />

              <FormInput
                label="Assigned To"
                value={getFullName(draftTeacher)}
                disabled
                onChange={() => {}}
              />

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={openRfidModal}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-normal text-white transition hover:bg-cyan-700"
                >
                  <FiCreditCard />
                  Upload RFID
                </button>
              </div>
            </div>
          </DetailCard>
        </div>
      </div>

      {/* RFID MODAL */}

      <RfidUploadModal
        isOpen={rfidModal.isOpen}
        ownerType={rfidModal.ownerType}
        ownerId={rfidModal.ownerId}
        ownerName={rfidModal.ownerName}
        currentRfid={rfidModal.currentRfid}
        apiModule="teacher"
        apiAction="upload-rfid"
        onClose={closeRfidModal}
        onSaved={handleRfidSaved}
      />
    </div>
  );
};

/* =========================================================
   DETAIL CARD
========================================================= */

const DetailCard = ({
  title,
  icon,
  color,
  section,
  editingSection,
  savingSection,
  onEdit,
  onCancel,
  onSave,
  viewItems,
  children,
}) => {
  const isEditing = editingSection === section;

  const isSaving = savingSection === section;

  const colors = {
    cyan: "bg-cyan-50 text-cyan-600",

    orange: "bg-orange-50 text-orange-600",

    violet: "bg-violet-50 text-violet-600",

    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-md ${
              colors[color] || colors.cyan
            }`}
          >
            {icon}
          </div>

          <p className="text-sm font-medium text-slate-950">{title}</p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => onEdit(section)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"
            title="Edit"
          >
            <FiEdit2 />
          </button>
        )}
      </div>

      <div className="p-5">
        {isEditing ? (
          <div className="space-y-4">
            {children}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={onCancel}
                className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => onSave(section)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-normal text-white transition hover:bg-cyan-700 disabled:opacity-50"
              >
                <FiSave />

                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {viewItems.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-normal text-slate-500">{label}</p>

                <p className="mt-1 break-words text-sm font-normal text-slate-900">
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   INPUT
========================================================= */

const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-normal text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-md border px-3 text-sm font-normal outline-none transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
        }`}
      />
    </div>
  );
};

/* =========================================================
   SELECT
========================================================= */

const FormSelect = ({ label, value, options, onChange }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-normal text-slate-600">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

/* =========================================================
   STATUS
========================================================= */

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal ${
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

      {status || "Inactive"}
    </span>
  );
};

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
};

const TeacherDetailsSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-44" />

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />

          <Skeleton className="h-10 w-32" />

          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* MAIN */}

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />

            <div>
              <Skeleton className="h-3 w-20" />

              <Skeleton className="mt-2 h-6 w-48" />

              <div className="mt-2 flex gap-3">
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          </div>

          <div className="w-48 rounded-md bg-slate-50 p-4">
            <Skeleton className="h-3 w-12" />

            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>

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
          <Skeleton className="h-9 w-9" />

          <Skeleton className="h-4 w-36" />
        </div>

        <Skeleton className="h-9 w-9" />
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-20" />

            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherDetails;
