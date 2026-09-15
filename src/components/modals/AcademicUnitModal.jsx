import BaseModal from "./BaseModal";
import { FormField, ModalFooter, inputClass } from "./ModalFormElements";

const AcademicUnitModal = ({
  isOpen,
  onClose,
  value,
  setValue,
  units,
  submitting,
  onSubmit,
}) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="Add Academic Unit"
    description="Complete the required information below."
  >
    <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Code">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="e.g. JHS"
              value={value.code}
              onChange={(event) =>
                setValue({ ...value, code: event.target.value.toUpperCase() })
              }
            />
          </FormField>

          <FormField label="Academic Unit">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="Academic unit name"
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
            />
          </FormField>

          <FormField label="Parent Unit">
            <select
              className={inputClass}
              disabled={submitting}
              value={value.parent_id}
              onChange={(event) =>
                setValue({ ...value, parent_id: event.target.value })
              }
            >
              <option value="">No parent unit</option>

              {units
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Type">
            <select
              className={inputClass}
              disabled={submitting}
              value={value.type}
              onChange={(event) =>
                setValue({ ...value, type: event.target.value })
              }
            >
              <option value="division">Division</option>
              <option value="college">College</option>
              <option value="department">Department</option>
            </select>
          </FormField>

          <FormField label="Education Level" className="sm:col-span-2">
            <select
              className={inputClass}
              disabled={submitting}
              value={value.education_level}
              onChange={(event) =>
                setValue({ ...value, education_level: event.target.value })
              }
            >
              <option value="basic">Basic Education</option>
              <option value="higher_education">Higher Education</option>
            </select>
          </FormField>
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        submitting={submitting}
        label="Save Academic Unit"
      />
    </form>
  </BaseModal>
);

export default AcademicUnitModal;
