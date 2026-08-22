import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import BaseModal from "./BaseModal";
import api from "../../lib/api";
import { statusOptions } from "../../data/userManagementData";

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  username: "",
  email: "",
  password: "",
  password_confirmation: "",
  mobile: "",
  birthday: "",
  address: "",
  departmentId: "",
  positionId: "",
  employmentStatus: "active",
  hireDate: "",
  status: "Active",
};

const UserManagementModal = ({
  isOpen,
  mode = "create",
  roleLabel,
  user,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [metadata, setMetadata] = useState({ departments: [], positions: [] });

  useEffect(() => {
    if (!isOpen) return;

    api.get("/api/staff-metadata").then((response) => {
      setMetadata(response.data);
    }).catch(() => setMetadata({ departments: [], positions: [] }));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        suffix: user.suffix || "",
        username: user.username || "",
        email: user.email || "",
        password: "",
        password_confirmation: "",
        mobile: user.mobile || "",
        birthday: user.birthday || "",
        address: user.address || "",
        departmentId: user.departmentId || "",
        positionId: user.positionId || "",
        employmentStatus: user.employmentStatus || "active",
        hireDate: user.hireDate || "",
        status: user.status || "Active",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [isOpen, user]);

  const updateFormValue = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={mode === "edit" ? `Edit ${roleLabel}` : `Add ${roleLabel}`}
      description="Fill out the user account details below."
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="First Name"
            value={formData.firstName}
            onChange={(value) => updateFormValue("firstName", value)}
            placeholder="Enter first name"
          />

          <FormInput
            label="Middle Name"
            value={formData.middleName}
            onChange={(value) => updateFormValue("middleName", value)}
            placeholder="Optional"
          />

          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => updateFormValue("lastName", value)}
            placeholder="Enter last name"
          />

          <FormInput
            label="Suffix"
            value={formData.suffix}
            onChange={(value) => updateFormValue("suffix", value)}
            placeholder="Jr., III, etc."
          />

          <FormInput
            label="Username"
            value={formData.username}
            onChange={(value) => updateFormValue("username", value)}
            placeholder="Enter username"
          />

          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateFormValue("email", value)}
            placeholder="Enter email"
          />

          {mode === "create" && (
            <>
              <FormInput
                label="Password"
                type="password"
                value={formData.password}
                onChange={(value) => updateFormValue("password", value)}
                placeholder="At least 8 characters"
              />

              <FormInput
                label="Confirm Password"
                type="password"
                value={formData.password_confirmation}
                onChange={(value) =>
                  updateFormValue("password_confirmation", value)
                }
                placeholder="Repeat the password"
              />
            </>
          )}

          <FormInput
            label="Mobile Number"
            value={formData.mobile}
            onChange={(value) => updateFormValue("mobile", value)}
            placeholder="Enter mobile number"
          />

          <FormInput
            label="Birthday"
            type="date"
            value={formData.birthday}
            onChange={(value) => updateFormValue("birthday", value)}
          />

          <FormSelect
            label="Department"
            value={formData.departmentId}
            onChange={(value) => updateFormValue("departmentId", value)}
            options={metadata.departments.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Select department"
          />

          <FormSelect
            label="Position"
            value={formData.positionId}
            onChange={(value) => updateFormValue("positionId", value)}
            options={metadata.positions.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Select position"
          />

          <FormInput
            label="Hire Date"
            type="date"
            value={formData.hireDate}
            onChange={(value) => updateFormValue("hireDate", value)}
          />

          <FormSelect
            label="Employment Status"
            value={formData.employmentStatus}
            onChange={(value) => updateFormValue("employmentStatus", value)}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "on_leave", label: "On Leave" },
              { value: "separated", label: "Separated" },
            ]}
          />

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-600">Address</span>
            <textarea
              value={formData.address}
              onChange={(event) => updateFormValue("address", event.target.value)}
              rows="3"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            />
          </label>

          <FormSelect
            label="Status"
            value={formData.status}
            onChange={(value) => updateFormValue("status", value)}
            options={statusOptions}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create User"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

const FormInput = ({ label, value, onChange, placeholder, type = "text" }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      />
    </label>
  );
};

const FormSelect = ({ label, value, onChange, options, placeholder }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
};

export default UserManagementModal;
