import BaseModal from "../common/BaseModal";
import { FormField, ModalFooter, inputClass } from "../common/ModalFormElements";

const GradeLevelModal = ({
  isOpen,
  onClose,
  value,
  setValue,
  data,
  submitting,
  onSubmit,
}) => {
  const programs = data.academicPrograms.filter(
    (item) =>
      String(item.academic_unit_id) === String(value.academic_unit_id) &&
      item.is_active,
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Grade Level"
      description="Complete the required information below."
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Academic Home">
              <select
                className={inputClass}
                required
                disabled={submitting}
                value={value.academic_unit_id}
                onChange={(event) =>
                  setValue({
                    ...value,
                    academic_unit_id: event.target.value,
                    academic_program_id: "",
                  })
                }
              >
                <option value="">Select department or college</option>

                {data.academicUnits
                  .filter(
                    (item) =>
                      item.is_active && ["college", "department"].includes(item.type),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent?.name ? `${item.parent.name} → ` : ""}
                      {item.name}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Program / Strand / Specialization">
              <select
                className={inputClass}
                disabled={submitting}
                value={value.academic_program_id}
                onChange={(event) =>
                  setValue({
                    ...value,
                    academic_program_id: event.target.value,
                  })
                }
              >
                <option value="">Directly under academic home</option>

                {programs
                  .filter((item) => item.children_count === 0)
                  .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.parent?.name ? `${item.parent.name} → ` : ""}
                    {item.name}
                  </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Grade / Year Level">
              <input
                className={inputClass}
                required
                disabled={submitting}
                placeholder="e.g. Grade 7 or 1st Year"
                value={value.name}
                onChange={(event) =>
                  setValue({ ...value, name: event.target.value })
                }
              />
            </FormField>

            <FormField label="Sort Order">
              <input
                className={inputClass}
                min="0"
                type="number"
                disabled={submitting}
                placeholder="Sort order"
                value={value.sort_order}
                onChange={(event) =>
                  setValue({ ...value, sort_order: event.target.value })
                }
              />
            </FormField>
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitting={submitting}
          label="Save Level"
        />
      </form>
    </BaseModal>
  );
};

export default GradeLevelModal;
