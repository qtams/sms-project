import { useMemo } from "react";
import BaseModal from "../common/BaseModal";
import { FormField, ModalFooter, inputClass } from "../common/ModalFormElements";

const AcademicUnitModal = ({ isOpen, onClose, value, setValue, units, submitting, onSubmit }) => {
  const parentOptions = useMemo(
    () =>
      units.filter((item) => {
        if (!item.is_active || value.type === "division") return false;
        if (value.type === "college") {
          return item.type === "division" && item.education_level === "higher_education";
        }
        return (
          (item.type === "division" && item.education_level === "basic") ||
          (item.type === "college" && item.education_level === "higher_education")
        );
      }),
    [units, value.type],
  );

  const changeType = (type) => {
    setValue({
      ...value,
      type,
      parent_id: "",
      education_level: type === "college" ? "higher_education" : value.education_level,
    });
  };

  const changeParent = (parentId) => {
    const parent = units.find((item) => String(item.id) === parentId);
    setValue({
      ...value,
      parent_id: parentId,
      education_level: parent?.education_level || value.education_level,
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Organizational Unit"
      description="Choose the unit type first. Parent choices are limited to valid placements."
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Unit Type">
              <select className={inputClass} disabled={submitting} value={value.type} onChange={(event) => changeType(event.target.value)}>
                <option value="division">Division</option>
                <option value="college">College</option>
                <option value="department">Department</option>
              </select>
            </FormField>

            <FormField label="Education Level">
              <select className={inputClass} disabled={submitting || value.type !== "division"} value={value.education_level} onChange={(event) => setValue({ ...value, education_level: event.target.value, parent_id: "" })}>
                <option value="basic">Basic Education</option>
                <option value="higher_education">Higher Education</option>
              </select>
            </FormField>

            {value.type !== "division" && (
              <FormField label={value.type === "college" ? "Parent Division" : "Parent Unit"} className="sm:col-span-2">
                <select className={inputClass} required disabled={submitting} value={value.parent_id} onChange={(event) => changeParent(event.target.value)}>
                  <option value="">Select a valid parent</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent?.name ? `${item.parent.name} → ` : ""}{item.name} · {item.type}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Code">
              <input className={inputClass} required disabled={submitting} placeholder="e.g. JHS" value={value.code} onChange={(event) => setValue({ ...value, code: event.target.value.toUpperCase() })} />
            </FormField>

            <FormField label="Unit Name">
              <input className={inputClass} required disabled={submitting} placeholder="e.g. Junior High School" value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} />
            </FormField>
          </div>
        </div>

        <ModalFooter onCancel={onClose} submitting={submitting} label="Save Unit" />
      </form>
    </BaseModal>
  );
};

export default AcademicUnitModal;
