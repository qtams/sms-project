import { useEffect, useMemo, useState } from "react";

import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

import { toast } from "react-toastify";

import BaseModal from "../common/BaseModal";
import api from "../../../services/api";

import { statusOptions } from "../../../data/user-management/userManagementData";

/* =========================================================
   STEPS
========================================================= */

const STEP_PERSONAL = 1;
const STEP_ACCOUNT = 2;
const STEP_EMPLOYMENT = 3;

const TOTAL_STEPS = 3;

/* =========================================================
   FORM
========================================================= */

const EMPTY_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",

  mobile: "",
  birthday: "",

  username: "",
  email: "",

  departmentId: "",
  positionId: "",

  hireDate: "",
  employmentStatus: "active",

  address: "",

  status: "Active",
};

/* =========================================================
   FIELD -> STEP
========================================================= */

const FIELD_STEPS = {
  firstName: STEP_PERSONAL,
  middleName: STEP_PERSONAL,
  lastName: STEP_PERSONAL,
  suffix: STEP_PERSONAL,
  mobile: STEP_PERSONAL,
  birthday: STEP_PERSONAL,

  username: STEP_ACCOUNT,
  email: STEP_ACCOUNT,

  departmentId: STEP_EMPLOYMENT,
  positionId: STEP_EMPLOYMENT,
  hireDate: STEP_EMPLOYMENT,
  employmentStatus: STEP_EMPLOYMENT,
  address: STEP_EMPLOYMENT,
  status: STEP_EMPLOYMENT,
};

/* =========================================================
   STEP FIELDS
========================================================= */

const STEP_FIELDS = {
  [STEP_PERSONAL]: [
    "firstName",
    "middleName",
    "lastName",
    "suffix",
    "mobile",
    "birthday",
  ],

  [STEP_ACCOUNT]: ["username", "email"],

  [STEP_EMPLOYMENT]: ["departmentId", "positionId"],
};

/* =========================================================
   COMPONENT
========================================================= */

const UserManagementModal = ({
  isOpen,
  mode = "create",
  role,
  roleLabel = "User",
  user = null,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState(STEP_PERSONAL);

  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
  });

  const [touched, setTouched] = useState({});

  const [attemptedSteps, setAttemptedSteps] = useState({});

  const [metadata, setMetadata] = useState({
    departments: [],
    positions: [],
  });

  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  /* =======================================================
     RESET / EDIT FORM
  ======================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCurrentStep(STEP_PERSONAL);

    setTouched({});

    setAttemptedSteps({});

    if (user) {
      setFormData({
        firstName: user.firstName || "",

        middleName: user.middleName || "",

        lastName: user.lastName || "",

        suffix: user.suffix || "",

        mobile: user.mobile || "",

        birthday: normalizeDate(user.birthday),

        username: user.username || "",

        email: user.email || "",

        departmentId: String(user.departmentId || ""),

        positionId: String(user.positionId || ""),

        hireDate: normalizeDate(user.hireDate),

        employmentStatus: user.employmentStatus || "active",

        address: user.address || "",

        status: user.status || "Active",
      });

      return;
    }

    setFormData({
      ...EMPTY_FORM,
    });
  }, [isOpen, user]);

  /* =======================================================
     LOAD DEPARTMENTS / POSITIONS
  ======================================================= */

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isMounted = true;

    const loadMetadata = async () => {
      setIsMetadataLoading(true);

      try {
        const response = await api.get("/api/staff-metadata");

        if (!isMounted) {
          return;
        }

        const data = response?.data?.data || response?.data || {};

        setMetadata({
          departments: Array.isArray(data.departments) ? data.departments : [],

          positions: Array.isArray(data.positions) ? data.positions : [],
        });
      } catch (error) {
        console.error("Unable to load staff metadata:", error);

        if (!isMounted) {
          return;
        }

        setMetadata({
          departments: [],
          positions: [],
        });

        toast.error(
          error?.response?.data?.message ||
            "Unable to load departments and positions.",
        );
      } finally {
        if (isMounted) {
          setIsMetadataLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  /* =======================================================
     OPTIONS
  ======================================================= */

  const departmentOptions = useMemo(() => {
    const departmentCode = {
      admin: "ADMIN",
      registrar: "REG",
      guard: "SEC",
    }[role];

    return metadata.departments
      .filter((item) => !departmentCode || item.code === departmentCode)
      .map((item) => ({
        value: String(item.id),

        label: item.name || item.label || "Department",
      }));
  }, [metadata.departments, role]);

  const positionOptions = useMemo(() => {
    const positionCodes = {
      admin: ["SUPER_ADMIN", "SYS_ADMIN"],
      registrar: ["REGISTRAR"],
      guard: ["GUARD"],
    }[role];

    return metadata.positions
      .filter(
        (item) =>
          String(item.department_id ?? item.departmentId ?? "") ===
            formData.departmentId &&
          (!positionCodes || positionCodes.includes(item.code)),
      )
      .map((item) => ({
        value: String(item.id),

        label: item.name || item.label || "Position",
      }));
  }, [formData.departmentId, metadata.positions, role]);

  /* =======================================================
     GENERATED PASSWORD
  ======================================================= */

  const generatedPassword = useMemo(() => {
    return birthdayToPassword(formData.birthday);
  }, [formData.birthday]);

  /* =======================================================
     UPDATE VALUE
  ======================================================= */

  const updateFormValue = (field, value) => {
    setFormData((current) => ({
      ...current,

      [field]: value,

      ...(field === "departmentId" ? { positionId: "" } : {}),
    }));
  };

  /* =======================================================
     TOUCH
  ======================================================= */

  const touchField = (field) => {
    setTouched((current) => ({
      ...current,

      [field]: true,
    }));
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateField = (field) => {
    const value = formData[field];

    const trimmedValue = typeof value === "string" ? value.trim() : value;

    switch (field) {
      /* ---------------------------------------
         FIRST NAME
      --------------------------------------- */

      case "firstName":
        if (!trimmedValue) {
          return "First name is required.";
        }

        if (!isValidPersonName(trimmedValue)) {
          return "First name can only contain letters.";
        }

        return "";

      /* ---------------------------------------
         MIDDLE NAME
      --------------------------------------- */

      case "middleName":
        if (!trimmedValue) {
          return "";
        }

        if (!isValidPersonName(trimmedValue)) {
          return "Middle name can only contain letters.";
        }

        return "";

      /* ---------------------------------------
         LAST NAME
      --------------------------------------- */

      case "lastName":
        if (!trimmedValue) {
          return "Last name is required.";
        }

        if (!isValidPersonName(trimmedValue)) {
          return "Last name can only contain letters.";
        }

        return "";

      /* ---------------------------------------
         SUFFIX
      --------------------------------------- */

      case "suffix":
        if (!trimmedValue) {
          return "";
        }

        if (!isValidSuffix(trimmedValue)) {
          return "Suffix contains invalid characters.";
        }

        return "";

      /* ---------------------------------------
         MOBILE
      --------------------------------------- */

      case "mobile":
        if (!trimmedValue) {
          return "";
        }

        if (!isValidMobile(trimmedValue)) {
          return "Enter a valid mobile number.";
        }

        return "";

      /* ---------------------------------------
         BIRTHDAY
      --------------------------------------- */

      case "birthday":
        if (!trimmedValue) {
          return "Birthday is required.";
        }

        if (isFutureDate(trimmedValue)) {
          return "Birthday cannot be in the future.";
        }

        return "";

      /* ---------------------------------------
         USERNAME
      --------------------------------------- */

      case "username":
        if (!trimmedValue) {
          return "Username is required.";
        }

        if (trimmedValue.length < 3) {
          return "Username must contain at least 3 characters.";
        }

        if (!isValidUsername(trimmedValue)) {
          return "Username contains invalid characters.";
        }

        return "";

      /* ---------------------------------------
         EMAIL
      --------------------------------------- */

      case "email":
        if (!trimmedValue) {
          return "";
        }

        if (!isValidEmail(trimmedValue)) {
          return "Enter a valid email address.";
        }

        return "";

      /* ---------------------------------------
         DEPARTMENT
      --------------------------------------- */

      case "departmentId":
        if (!trimmedValue) {
          return "Department is required.";
        }

        return "";

      /* ---------------------------------------
         POSITION
      --------------------------------------- */

      case "positionId":
        if (!trimmedValue) {
          return "Position is required.";
        }

        return "";

      default:
        return "";
    }
  };

  /* =======================================================
     SHOULD SHOW ERROR
  ======================================================= */

  const getError = (field) => {
    const error = validateField(field);

    if (!error) {
      return "";
    }

    const value = formData[field];

    const hasValue = String(value ?? "").trim() !== "";

    /*
     * Invalid values show immediately
     * while typing.
     *
     * Example:
     *
     * John2
     * -> red immediately
     *
     * John
     * -> error immediately disappears
     */
    if (hasValue) {
      return error;
    }

    /*
     * Empty required values only become
     * red after blur or trying to continue.
     */
    const fieldStep = FIELD_STEPS[field];

    if (touched[field] || attemptedSteps[fieldStep]) {
      return error;
    }

    return "";
  };

  /* =======================================================
     VALIDATE STEP
  ======================================================= */

  const validateStep = (step) => {
    const fields = STEP_FIELDS[step] || [];

    setAttemptedSteps((current) => ({
      ...current,

      [step]: true,
    }));

    const hasErrors = fields.some((field) => Boolean(validateField(field)));

    if (hasErrors) {
      toast.error("Please check the highlighted fields.");

      return false;
    }

    return true;
  };

  /* =======================================================
     NEXT
  ======================================================= */

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((current) => current + 1);
    }
  };

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const handlePrevious = () => {
    if (currentStep > STEP_PERSONAL) {
      setCurrentStep((current) => current - 1);
    }
  };

  /* =======================================================
     PROGRESS BAR CLICK
  ======================================================= */

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) {
      return;
    }

    /*
     * Going backward is always allowed.
     */
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);

      return;
    }

    /*
     * Going forward requires all
     * previous steps to be valid.
     */
    for (let step = currentStep; step < targetStep; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);

        return;
      }
    }

    setCurrentStep(targetStep);
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    /*
     * Enter key on step 1/2
     * goes to the next step.
     */
    if (currentStep < TOTAL_STEPS) {
      handleNext();

      return;
    }

    const personalValid = validateStep(STEP_PERSONAL);

    if (!personalValid) {
      setCurrentStep(STEP_PERSONAL);

      return;
    }

    const accountValid = validateStep(STEP_ACCOUNT);

    if (!accountValid) {
      setCurrentStep(STEP_ACCOUNT);

      return;
    }

    const employmentValid = validateStep(STEP_EMPLOYMENT);

    if (!employmentValid) {
      setCurrentStep(STEP_EMPLOYMENT);

      return;
    }

    const payload = {
      ...formData,

      firstName: formData.firstName.trim(),

      middleName: formData.middleName.trim(),

      lastName: formData.lastName.trim(),

      suffix: formData.suffix.trim(),

      mobile: formData.mobile.trim(),

      username: formData.username.trim(),

      email: formData.email.trim(),

      address: formData.address.trim(),
    };

    /* =================================================
         CREATE PASSWORD FROM BIRTHDAY
      ================================================= */

    if (mode === "create") {
      if (!generatedPassword) {
        setCurrentStep(STEP_PERSONAL);

        setAttemptedSteps((current) => ({
          ...current,

          [STEP_PERSONAL]: true,
        }));

        toast.error("Birthday is required.");

        return;
      }

      payload.password = generatedPassword;

      payload.password_confirmation = generatedPassword;
    }

    /* =================================================
         EDIT DOES NOT TOUCH PASSWORD
      ================================================= */

    if (mode === "edit") {
      delete payload.password;

      delete payload.password_confirmation;
    }

    try {
      await onSave?.(payload);
    } catch (error) {
      console.error("Unable to save user:", error);
    }
  };

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose?.();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <BaseModal
      isOpen={isOpen}
      title={mode === "edit" ? `Edit ${roleLabel}` : `Add ${roleLabel}`}
      description={getStepDescription(currentStep)}
      onClose={handleClose}
      maxWidth="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* =================================================
            PROGRESS ONLY
            NO LABELS
        ================================================= */}

        <div className="shrink-0 border-b border-slate-100 py-3">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({
              length: TOTAL_STEPS,
            }).map((_, index) => {
              const step = index + 1;

              const active = step <= currentStep;

              return (
                <button
                  key={step}
                  type="button"
                  disabled={isSaving}
                  aria-label={`Go to step ${step}`}
                  onClick={() => handleStepClick(step)}
                  className="group h-4 py-[6px]"
                >
                  <span
                    className={`block h-[3px] w-full rounded-full transition-all duration-200 ${
                      active
                        ? "bg-slate-800"
                        : "bg-slate-200 group-hover:bg-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto py-5 pr-1">
          {/* ===============================================
              STEP 1
              PERSONAL
          =============================================== */}

          {currentStep === STEP_PERSONAL && (
            <FormSection
              icon={<FiUser />}
              title="Personal Information"
              description="Enter the user's basic personal information."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                <FormInput
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(value) => updateFormValue("firstName", value)}
                  onBlur={() => touchField("firstName")}
                  error={getError("firstName")}
                  placeholder="Enter first name"
                />

                <FormInput
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={(value) => updateFormValue("middleName", value)}
                  onBlur={() => touchField("middleName")}
                  error={getError("middleName")}
                  placeholder="Optional"
                />

                <FormInput
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(value) => updateFormValue("lastName", value)}
                  onBlur={() => touchField("lastName")}
                  error={getError("lastName")}
                  placeholder="Enter last name"
                />

                <FormInput
                  label="Suffix"
                  value={formData.suffix}
                  onChange={(value) => updateFormValue("suffix", value)}
                  onBlur={() => touchField("suffix")}
                  error={getError("suffix")}
                  placeholder="Jr., Sr., III"
                />

                <FormInput
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={(value) => updateFormValue("mobile", value)}
                  onBlur={() => touchField("mobile")}
                  error={getError("mobile")}
                  placeholder="09XXXXXXXXX"
                  inputMode="tel"
                />

                <FormInput
                  label="Birthday"
                  type="date"
                  required
                  value={formData.birthday}
                  onChange={(value) => updateFormValue("birthday", value)}
                  onBlur={() => touchField("birthday")}
                  error={getError("birthday")}
                  helperText={
                    mode === "create" && generatedPassword
                      ? `Initial password: ${generatedPassword}`
                      : mode === "create"
                        ? "Birthday will be used to generate the initial password."
                        : ""
                  }
                />
              </div>
            </FormSection>
          )}

          {/* ===============================================
              STEP 2
              ACCOUNT
          =============================================== */}

          {currentStep === STEP_ACCOUNT && (
            <FormSection
              title="Account Information"
              description="Set the username and optional email address."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                <FormInput
                  label="Username"
                  required
                  value={formData.username}
                  onChange={(value) => updateFormValue("username", value)}
                  onBlur={() => touchField("username")}
                  error={getError("username")}
                  placeholder="Enter username"
                  autoComplete="off"
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => updateFormValue("email", value)}
                  onBlur={() => touchField("email")}
                  error={getError("email")}
                  placeholder="Enter email"
                  autoComplete="off"
                />
              </div>

              {mode === "create" && (
                <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-normal text-slate-600">
                    Initial password
                  </p>

                  <p className="mt-1 text-xs font-normal leading-5 text-slate-400">
                    The user's birthday is converted to MMDDYYYY.
                  </p>

                  {generatedPassword ? (
                    <p className="mt-2 font-mono text-sm font-medium text-slate-800">
                      {generatedPassword}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-normal text-slate-400">
                      Select a birthday first.
                    </p>
                  )}
                </div>
              )}
            </FormSection>
          )}

          {/* ===============================================
              STEP 3
              EMPLOYMENT
          =============================================== */}

          {currentStep === STEP_EMPLOYMENT && (
            <FormSection
              icon={<FiBriefcase />}
              title="Employment Information"
              description="Assign the department, position, and account status."
            >
              {isMetadataLoading ? (
                <MetadataSkeleton />
              ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                  <FormSelect
                    label="Department"
                    required
                    value={formData.departmentId}
                    onChange={(value) => updateFormValue("departmentId", value)}
                    onBlur={() => touchField("departmentId")}
                    error={getError("departmentId")}
                    options={departmentOptions}
                    placeholder="Select department"
                  />

                  <FormSelect
                    label="Position"
                    required
                    value={formData.positionId}
                    onChange={(value) => updateFormValue("positionId", value)}
                    onBlur={() => touchField("positionId")}
                    error={getError("positionId")}
                    options={positionOptions}
                    placeholder={
                      formData.departmentId
                        ? "Select position"
                        : "Select department first"
                    }
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
                    onChange={(value) =>
                      updateFormValue("employmentStatus", value)
                    }
                    options={[
                      {
                        value: "active",

                        label: "Active",
                      },

                      {
                        value: "inactive",

                        label: "Inactive",
                      },

                      {
                        value: "on_leave",

                        label: "On Leave",
                      },

                      {
                        value: "separated",

                        label: "Separated",
                      },
                    ]}
                  />

                  <div className="md:col-span-2">
                    <FormTextarea
                      label="Address"
                      value={formData.address}
                      onChange={(value) => updateFormValue("address", value)}
                      placeholder="Enter complete address"
                    />
                  </div>

                  <FormSelect
                    label="Account Status"
                    value={formData.status}
                    onChange={(value) => updateFormValue("status", value)}
                    options={statusOptions}
                  />
                </div>
              )}
            </FormSection>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="shrink-0 border-t border-slate-100 bg-white py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* LEFT */}

            <div>
              {currentStep > STEP_PERSONAL && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiArrowLeft />
                  Previous
                </button>
              )}
            </div>

            {/* RIGHT */}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX />
                Cancel
              </button>

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                  <FiArrowRight />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving || isMetadataLoading}
                  className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave />

                      {mode === "edit" ? "Save Changes" : "Create User"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

/* =========================================================
   FORM SECTION
========================================================= */

const FormSection = ({ title, description, icon, children }) => {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
            {icon}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>

          {description && (
            <p className="mt-1 text-xs font-normal leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
};

/* =========================================================
   INPUT
========================================================= */

const FormInput = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  inputMode,
  autoComplete,
  error = "",
  helperText = "",
}) => {
  const hasError = Boolean(error);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-normal text-slate-600">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        className={`
          h-11
          w-full
          rounded-md
          border
          bg-white
          px-4
          text-sm
          font-normal
          text-slate-700
          outline-none
          transition
          placeholder:text-slate-400
          disabled:cursor-not-allowed
          disabled:bg-slate-50
          disabled:text-slate-400

          ${
            hasError
              ? `
                border-red-400
                focus:border-red-500
                focus:ring-4
                focus:ring-red-50
              `
              : `
                border-slate-200
                hover:border-slate-300
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-50
              `
          }
        `}
      />

      {hasError ? (
        <p className="mt-1.5 text-xs font-normal text-red-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs font-normal text-slate-400">
          {helperText}
        </p>
      ) : null}
    </label>
  );
};

/* =========================================================
   SELECT
========================================================= */

const FormSelect = ({
  label,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  error = "",
}) => {
  const hasError = Boolean(error);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-normal text-slate-600">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={hasError}
        className={`
          h-11
          w-full
          cursor-pointer
          rounded-md
          border
          bg-white
          px-4
          text-sm
          font-normal
          text-slate-700
          outline-none
          transition
          disabled:cursor-not-allowed
          disabled:bg-slate-50
          disabled:text-slate-400

          ${
            hasError
              ? `
                border-red-400
                focus:border-red-500
                focus:ring-4
                focus:ring-red-50
              `
              : `
                border-slate-200
                hover:border-slate-300
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-50
              `
          }
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((option) => {
          const optionValue = option?.value ?? option;

          const optionLabel = option?.label ?? option;

          return (
            <option key={String(optionValue)} value={String(optionValue)}>
              {optionLabel}
            </option>
          );
        })}
      </select>

      {hasError && (
        <p className="mt-1.5 text-xs font-normal text-red-500">{error}</p>
      )}
    </label>
  );
};

/* =========================================================
   TEXTAREA
========================================================= */

const FormTextarea = ({ label, value, onChange, placeholder }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-normal text-slate-600">
        {label}
      </span>

      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="min-h-[90px] w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      />
    </label>
  );
};

/* =========================================================
   METADATA SKELETON
========================================================= */

const MetadataSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200" />

          <div className="h-11 w-full animate-pulse rounded-md bg-slate-200" />
        </div>
      ))}

      <div className="md:col-span-2">
        <div className="mb-2 h-4 w-20 animate-pulse rounded bg-slate-200" />

        <div className="h-[90px] w-full animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const getStepDescription = (step) => {
  switch (step) {
    case STEP_PERSONAL:
      return "Enter the user's personal information.";

    case STEP_ACCOUNT:
      return "Configure the account information.";

    case STEP_EMPLOYMENT:
      return "Complete the employment information.";

    default:
      return "";
  }
};

/* =========================================================
   PERSON NAME VALIDATION
========================================================= */

const isValidPersonName = (value) => {
  /*
   * Allows:
   *
   * Juan
   * Maria Clara
   * Dela Cruz
   * O'Connor
   * Anne-Marie
   * Niño
   *
   * Does NOT allow:
   *
   * Juan1
   * Maria123
   * @Juan
   */

  return /^[\p{L}\s.'-]+$/u.test(value);
};

/* =========================================================
   SUFFIX
========================================================= */

const isValidSuffix = (value) => {
  return /^[\p{L}\s.'-]+$/u.test(value);
};

/* =========================================================
   USERNAME
========================================================= */

const isValidUsername = (value) => {
  /*
   * Supports:
   *
   * @Tamahome
   * tamahome
   * john.doe
   * john_doe
   * john-doe
   */

  return /^@?[A-Za-z0-9._-]+$/.test(value);
};

/* =========================================================
   EMAIL
========================================================= */

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/* =========================================================
   MOBILE
========================================================= */

const isValidMobile = (value) => {
  /*
   * Allows:
   *
   * 09171234567
   * +639171234567
   * 0917 123 4567
   * 0917-123-4567
   */

  if (!/^[0-9+\s()-]+$/.test(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 13;
};

/* =========================================================
   BIRTHDAY -> PASSWORD
========================================================= */

const birthdayToPassword = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;

  return `${month}${day}${year}`;
};

/* =========================================================
   NORMALIZE DATE
========================================================= */

const normalizeDate = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

/* =========================================================
   FUTURE DATE
========================================================= */

const isFutureDate = (value) => {
  if (!value) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate > today;
};

export default UserManagementModal;
