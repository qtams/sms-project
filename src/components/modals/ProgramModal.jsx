import BaseModal from "./BaseModal";
import { FormField, ModalFooter, inputClass } from "./ModalFormElements";

const ProgramModal = ({
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
    title="Add Program / Track"
    description="Complete the required information below."
  >
    <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Academic Unit" className="sm:col-span-2">
            <select
              className={inputClass}
              required
              disabled={submitting}
              value={value.academic_unit_id}
              onChange={(event) =>
                setValue({ ...value, academic_unit_id: event.target.value })
              }
            >
              <option value="">Select academic unit</option>

              {units
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Code">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="e.g. BSCE"
              value={value.code}
              onChange={(event) =>
                setValue({ ...value, code: event.target.value.toUpperCase() })
              }
            />
          </FormField>

          <FormField label="Program Type">
            <select
              className={inputClass}
              disabled={submitting}
              value={value.program_type}
              onChange={(event) =>
                setValue({ ...value, program_type: event.target.value })
              }
            >
              <option value="program">Program</option>
              <option value="track">Track</option>
              <option value="strand">Strand</option>
            </select>
          </FormField>

          <FormField label="Program / Track Name" className="sm:col-span-2">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="Program or track name"
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
            />
          </FormField>
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        submitting={submitting}
        label="Save Program / Track"
      />
    </form>
  </BaseModal>
);

export default ProgramModal;
