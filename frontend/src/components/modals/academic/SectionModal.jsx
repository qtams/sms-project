import BaseModal from "../common/BaseModal";
import { FormField, ModalFooter, inputClass } from "../common/ModalFormElements";

const SectionModal = ({
  isOpen,
  onClose,
  value,
  setValue,
  data,
  submitting,
  onSubmit,
}) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="Add Section"
    description="Complete the required information below."
  >
    <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Academic Level" className="sm:col-span-2">
            <select
              className={inputClass}
              required
              disabled={submitting}
              value={value.grade_level_id}
              onChange={(event) =>
                setValue({ ...value, grade_level_id: event.target.value })
              }
            >
              <option value="">Select a grade or year level</option>

              {data.gradeLevels
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.academic_unit?.parent?.name
                      ? `${item.academic_unit.parent.name} → `
                      : ""}
                    {item.academic_unit?.name} → {item.academic_program?.name
                      ? `${item.academic_program.name} → `
                      : ""}
                    {item.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="School Year">
            <select
              className={inputClass}
              required
              disabled={submitting}
              value={value.school_year_id}
              onChange={(event) =>
                setValue({ ...value, school_year_id: event.target.value })
              }
            >
              <option value="">Select school year</option>

              {data.schoolYears
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Section Name">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="Section name"
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
            />
          </FormField>

          <FormField label="Capacity" className="sm:col-span-2">
            <input
              className={inputClass}
              min="1"
              type="number"
              disabled={submitting}
              placeholder="Capacity"
              value={value.capacity}
              onChange={(event) =>
                setValue({ ...value, capacity: event.target.value })
              }
            />
          </FormField>
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        submitting={submitting}
        label="Save Section"
      />
    </form>
  </BaseModal>
);

export default SectionModal;
