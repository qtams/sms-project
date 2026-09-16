import BaseModal from "../common/BaseModal";
import { FormField, ModalFooter, inputClass } from "../common/ModalFormElements";

const SchoolYearModal = ({
  isOpen,
  onClose,
  value,
  setValue,
  submitting,
  onSubmit,
}) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="Add School Year"
    description="Complete the required information below."
  >
    <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="School Year" className="sm:col-span-2">
            <input
              className={inputClass}
              required
              disabled={submitting}
              placeholder="2026 - 2027"
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
            />
          </FormField>

          <FormField label="Start Date">
            <input
              className={inputClass}
              type="date"
              disabled={submitting}
              value={value.start_date}
              onChange={(event) =>
                setValue({ ...value, start_date: event.target.value })
              }
            />
          </FormField>

          <FormField label="End Date">
            <input
              className={inputClass}
              type="date"
              disabled={submitting}
              value={value.end_date}
              onChange={(event) =>
                setValue({ ...value, end_date: event.target.value })
              }
            />
          </FormField>
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        submitting={submitting}
        label="Save School Year"
      />
    </form>
  </BaseModal>
);

export default SchoolYearModal;
