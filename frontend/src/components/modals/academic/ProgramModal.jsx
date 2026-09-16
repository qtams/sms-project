import { useMemo } from "react";
import BaseModal from "../common/BaseModal";
import { FormField, ModalFooter, inputClass } from "../common/ModalFormElements";

const ProgramModal = ({ isOpen, onClose, value, setValue, units, programs, submitting, onSubmit }) => {
  const requiresParent = ["strand", "specialization"].includes(value.program_type);

  const parentOptions = useMemo(() => {
    if (value.program_type === "strand") {
      return programs.filter((item) => item.is_active && item.program_type === "track");
    }
    if (value.program_type === "specialization") {
      return programs.filter((item) => item.is_active && ["track", "strand"].includes(item.program_type));
    }
    return [];
  }, [programs, value.program_type]);

  const unitOptions = useMemo(() => {
    if (requiresParent) {
      return units.filter((item) => String(item.id) === String(value.academic_unit_id));
    }
    if (value.program_type === "track") {
      return units.filter((item) => item.is_active && item.code === "SHS");
    }
    return units.filter(
      (item) => item.is_active && item.education_level === "higher_education" && ["college", "department"].includes(item.type),
    );
  }, [requiresParent, units, value.academic_unit_id, value.program_type]);

  const changeType = (programType) => {
    setValue({ ...value, program_type: programType, parent_id: "", academic_unit_id: "" });
  };

  const changeParent = (parentId) => {
    const parent = programs.find((item) => String(item.id) === parentId);
    setValue({ ...value, parent_id: parentId, academic_unit_id: parent ? String(parent.academic_unit_id) : "" });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Academic Offering"
      description="Create a degree program, SHS track, strand, or specialization in its valid academic home."
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Offering Type" className="sm:col-span-2">
              <select className={inputClass} disabled={submitting} value={value.program_type} onChange={(event) => changeType(event.target.value)}>
                <option value="program">Degree Program</option>
                <option value="track">SHS Track</option>
                <option value="strand">SHS Strand</option>
                <option value="specialization">Specialization</option>
              </select>
            </FormField>

            {requiresParent && (
              <FormField label="Parent Offering" className="sm:col-span-2">
                <select className={inputClass} required disabled={submitting} value={value.parent_id} onChange={(event) => changeParent(event.target.value)}>
                  <option value="">Select parent offering</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent?.name ? `${item.parent.name} → ` : ""}{item.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Academic Home" className="sm:col-span-2">
              <select className={inputClass} required disabled={submitting || requiresParent} value={value.academic_unit_id} onChange={(event) => setValue({ ...value, academic_unit_id: event.target.value })}>
                <option value="">Select academic home</option>
                {unitOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.parent?.name ? `${item.parent.name} → ` : ""}{item.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Code">
              <input className={inputClass} required disabled={submitting} placeholder="e.g. BSCRIM" value={value.code} onChange={(event) => setValue({ ...value, code: event.target.value.toUpperCase() })} />
            </FormField>

            <FormField label="Offering Name">
              <input className={inputClass} required disabled={submitting} placeholder="Academic offering name" value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} />
            </FormField>
          </div>
        </div>

        <ModalFooter onCancel={onClose} submitting={submitting} label="Save Offering" />
      </form>
    </BaseModal>
  );
};

export default ProgramModal;
