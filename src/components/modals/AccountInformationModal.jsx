import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { FormField, ModalFooter, inputClass } from "./ModalFormElements";

const genderOptions = ["Male", "Female"];

const AccountInformationModal = ({
  isOpen,
  account,
  isSaving,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState(account || {});

  useEffect(() => {
    if (isOpen) {
      setFormData(account || {});
    }
  }, [isOpen, account]);

  const update = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Account Information"
      description="Update your profile and contact details."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          {/* PROFILE */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Profile
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Full Name">
                <input
                  className={inputClass}
                  required
                  disabled={isSaving}
                  placeholder="Full name"
                  value={formData.fullName || ""}
                  onChange={(event) => update("fullName", event.target.value)}
                />
              </FormField>

              <FormField label="Username">
                <input
                  className={inputClass}
                  disabled={isSaving}
                  placeholder="Username"
                  value={formData.username || ""}
                  onChange={(event) => update("username", event.target.value)}
                />
              </FormField>

              <FormField label="Gender">
                <select
                  className={inputClass}
                  disabled={isSaving}
                  value={formData.gender || ""}
                  onChange={(event) => update("gender", event.target.value)}
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Birthday">
                <input
                  className={inputClass}
                  type="date"
                  disabled={isSaving}
                  value={formData.birthday || ""}
                  onChange={(event) => update("birthday", event.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Contact
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Email Address">
                <input
                  className={inputClass}
                  type="email"
                  required
                  disabled={isSaving}
                  placeholder="Email address"
                  value={formData.email || ""}
                  onChange={(event) => update("email", event.target.value)}
                />
              </FormField>

              <FormField label="Mobile Number">
                <input
                  className={inputClass}
                  disabled={isSaving}
                  placeholder="Mobile number"
                  value={formData.mobile || ""}
                  onChange={(event) => update("mobile", event.target.value)}
                />
              </FormField>

              <FormField label="Address" className="sm:col-span-2">
                <input
                  className={inputClass}
                  disabled={isSaving}
                  placeholder="Home address"
                  value={formData.address || ""}
                  onChange={(event) => update("address", event.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* WORK */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Work
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Department">
                <input
                  className={inputClass}
                  disabled={isSaving}
                  placeholder="Department"
                  value={formData.department || ""}
                  onChange={(event) => update("department", event.target.value)}
                />
              </FormField>

              <FormField label="Position">
                <input
                  className={inputClass}
                  disabled={isSaving}
                  placeholder="Position"
                  value={formData.position || ""}
                  onChange={(event) => update("position", event.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitting={isSaving}
          label="Save Changes"
        />
      </form>
    </BaseModal>
  );
};

export default AccountInformationModal;
