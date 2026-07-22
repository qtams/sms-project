import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCreditCard,
  FiDownload,
  FiEdit2,
  FiHash,
  FiMail,
  FiPhone,
  FiSave,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiDebugRequest } from "../utils/apiDebugger";
import RfidUploadModal from "../components/modals/RfidUploadModal";

const initialTeachers = [
  {
    id: 1,
    teacherId: "TCH-0001",
    rfid: "RFID-TCH-000001",
    firstName: "Tamahome",
    middleName: "",
    lastName: "Buendia",
    gender: "Male",
    department: "Elementary",
    position: "Teacher",
    email: "mr.tamahome.buendia@gmail.com",
    mobile: "09304486012",
    address: "Bulacan",
    status: "Active",
    photoPreview: "",
  },
  {
    id: 2,
    teacherId: "TCH-0002",
    rfid: "RFID-TCH-000002",
    firstName: "Arvin",
    middleName: "",
    lastName: "Buendia",
    gender: "Male",
    department: "Junior High School",
    position: "Teacher",
    email: "arvin.buendia@email.com",
    mobile: "09987654321",
    address: "Cagayan de Oro City",
    status: "Active",
    photoPreview: "",
  },
  {
    id: 3,
    teacherId: "TCH-0003",
    rfid: "",
    firstName: "Misorsikat",
    middleName: "",
    lastName: "Misorsikat",
    gender: "Male",
    department: "Senior High School",
    position: "Teacher",
    email: "",
    mobile: "",
    address: "",
    status: "Inactive",
    photoPreview: "",
  },
];

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

const getFullName = (teacher) => {
  return [teacher.firstName, teacher.middleName, teacher.lastName]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (teacher) => {
  return `${teacher.firstName?.[0] || ""}${
    teacher.lastName?.[0] || ""
  }`.toUpperCase();
};

const csvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

const TeacherDetails = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams();

  const selectedTeacher = useMemo(() => {
    return initialTeachers.find((teacher) => teacher.teacherId === teacherId);
  }, [teacherId]);

  const [teacher, setTeacher] = useState(selectedTeacher || {});
  const [draftTeacher, setDraftTeacher] = useState(selectedTeacher || {});
  const [editingSection, setEditingSection] = useState("");

  const [rfidModal, setRfidModal] = useState({
    isOpen: false,
    ownerType: "teacher",
    ownerId: "",
    ownerName: "",
    currentRfid: "",
  });

  if (!selectedTeacher) {
    return (
      <div data-aos="fade-up" className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/teachers")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to Teachers
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            Teacher not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            The selected teacher record does not exist.
          </p>
        </div>
      </div>
    );
  }

  const startEdit = (section) => {
    setEditingSection(section);
    setDraftTeacher(teacher);
  };

  const cancelEdit = () => {
    setEditingSection("");
    setDraftTeacher(teacher);
  };

  const updateDraft = (field, value) => {
    setDraftTeacher((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveSection = async (section) => {
    await apiDebugRequest({
      module: "teacher",
      action: `update-${section}`,
      method: "PATCH",
      payload: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        section,
        data: draftTeacher,
        updatedAt: new Date().toISOString(),
      },
    });

    setTeacher(draftTeacher);
    setEditingSection("");
    toast.success("Teacher details updated.");
  };

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
  };

  const handleExportTeacher = async () => {
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

    await apiDebugRequest({
      module: "teacher",
      action: "export-single",
      method: "POST",
      payload: {
        teacherId: teacher.teacherId,
        data: row,
        exportedAt: new Date().toISOString(),
      },
    });

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
    link.download = `${teacher.teacherId}-details.csv`;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Teacher details exported.");
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            Teacher Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and update teacher profile, RFID, department, and contact
            details.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExportTeacher}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload />
            Export
          </button>

          <button
            type="button"
            onClick={openRfidModal}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiCreditCard />
            Upload RFID
          </button>

          <button
            type="button"
            onClick={() => navigate("/teachers")}
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
              {getInitials(teacher)}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Teacher</p>

              <h2 className="text-xl font-medium text-slate-950">
                {getFullName(teacher)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-600">
                  <FiHash />
                  {teacher.teacherId}
                </span>

                <StatusBadge status={teacher.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">RFID</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {teacher.rfid || "No RFID assigned"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="Teacher Information"
            icon={<FiUser />}
            color="cyan"
            section="teacher"
            editingSection={editingSection}
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

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            color="orange"
            section="contact"
            editingSection={editingSection}
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

          <DetailCard
            title="Work Information"
            icon={<FiBriefcase />}
            color="violet"
            section="work"
            editingSection={editingSection}
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

          <DetailCard
            title="RFID Information"
            icon={<FiCreditCard />}
            color="emerald"
            section="rfid"
            editingSection={editingSection}
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
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
                >
                  <FiCreditCard />
                  Upload RFID
                </button>
              </div>
            </div>
          </DetailCard>
        </div>
      </div>

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

const DetailCard = ({
  title,
  icon,
  color,
  section,
  editingSection,
  onEdit,
  onCancel,
  onSave,
  viewItems,
  children,
}) => {
  const isEditing = editingSection === section;

  const colorClass = {
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const visibleItems = viewItems.filter(([, value]) => {
    return value !== "" && value !== null && value !== undefined;
  });

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

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => onSave(section)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                <FiSave />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visibleItems.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-md border px-3 text-sm font-medium outline-none transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
        }`}
      />
    </div>
  );
};

const FormSelect = ({ label, value, options, onChange }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
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

export default TeacherDetails;
