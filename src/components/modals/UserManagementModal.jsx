import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import BaseModal from "./BaseModal";
import { statusOptions } from "../../data/userManagementData";

const emptyForm = {
  fullName: "",
  username: "",
  email: "",
  mobile: "",
  birthday: "",
  department: "",
  position: "",
  rfid: "",
  status: "Active",
};

const UserManagementModal = ({
  isOpen,
  mode = "create",
  roleLabel,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        mobile: user.mobile || "",
        birthday: user.birthday || "",
        department: user.department || "",
        position: user.position || "",
        rfid: user.rfid || "",
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
            label="Full Name"
            value={formData.fullName}
            onChange={(value) => updateFormValue("fullName", value)}
            placeholder="Enter full name"
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

          <FormInput
            label="RFID"
            value={formData.rfid}
            onChange={(value) => updateFormValue("rfid", value)}
            placeholder="Enter RFID number"
          />

          <FormInput
            label="Department"
            value={formData.department}
            onChange={(value) => updateFormValue("department", value)}
            placeholder="Enter department"
          />

          <FormInput
            label="Position"
            value={formData.position}
            onChange={(value) => updateFormValue("position", value)}
            placeholder="Enter position"
          />

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
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            <FiSave />
            {mode === "edit" ? "Save Changes" : "Create User"}
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

const FormSelect = ({ label, value, onChange, options }) => {
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
};

export default UserManagementModal;
