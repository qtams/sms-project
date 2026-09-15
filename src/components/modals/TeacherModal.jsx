import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiImage,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import BaseModal from "./BaseModal";

const departmentOptions = [
  "Preschool",
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
];

/* =========================================================
   STEPS
========================================================= */

const STEP_PERSONAL = 1;
const STEP_CONTACT = 2;
const STEP_EMPLOYMENT = 3;

const TOTAL_STEPS = 3;

/* =========================================================
   FIELD -> STEP
========================================================= */

const FIELD_STEPS = {
  firstName: STEP_PERSONAL,
  middleName: STEP_PERSONAL,
  lastName: STEP_PERSONAL,

  email: STEP_CONTACT,
  mobile: STEP_CONTACT,

  teacherId: STEP_EMPLOYMENT,
  department: STEP_EMPLOYMENT,
};

/* =========================================================
   STEP FIELDS
========================================================= */

const STEP_FIELDS = {
  [STEP_PERSONAL]: ["firstName", "middleName", "lastName"],
  [STEP_CONTACT]: ["email", "mobile"],
  [STEP_EMPLOYMENT]: ["teacherId", "department"],
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));

    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImage = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");

  const size = Math.min(pixelCrop.width, pixelCrop.height);

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `teacher-photo-${Date.now()}.png`, {
          type: "image/png",
        });

        resolve({
          file,
          preview: URL.createObjectURL(blob),
        });
      },
      "image/png",
      1,
    );
  });
};

const TeacherModal = ({
  isOpen,
  editingTeacher,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(STEP_PERSONAL);

  const [touched, setTouched] = useState({});
  const [attemptedSteps, setAttemptedSteps] = useState({});

  const [selectedImage, setSelectedImage] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  /* =======================================================
     RESET STEP ON OPEN
  ======================================================= */

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEP_PERSONAL);
      setTouched({});
      setAttemptedSteps({});
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const touchField = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleStatusToggle = () => {
    setFormData((current) => ({
      ...current,
      status: current.status === "Active" ? "Inactive" : "Active",
    }));
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setCrop({
      x: 0,
      y: 0,
    });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropOpen(true);

    event.target.value = "";
  };

  const handleApplyCrop = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    const croppedImage = await getCroppedImage(
      selectedImage,
      croppedAreaPixels,
    );

    setFormData((current) => ({
      ...current,
      photoFile: croppedImage.file,
      photoPreview: croppedImage.preview,
      photoRemoved: false,
    }));

    setSelectedImage("");
    setIsCropOpen(false);
  };

  const handleCancelCrop = () => {
    setSelectedImage("");
    setIsCropOpen(false);
  };

  const handleRemovePhoto = () => {
    setFormData((current) => ({
      ...current,
      photoFile: null,
      photoPreview: "",
      photoRemoved: true,
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
         TEACHER ID
      --------------------------------------- */

      case "teacherId":
        if (!trimmedValue) {
          return "Teacher ID is required.";
        }

        return "";

      /* ---------------------------------------
         DEPARTMENT
      --------------------------------------- */

      case "department":
        if (!trimmedValue) {
          return "Department is required.";
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

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((current) => current + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > STEP_PERSONAL) {
      setCurrentStep((current) => current - 1);
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) {
      return;
    }

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);

      return;
    }

    for (let step = currentStep; step < targetStep; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);

        return;
      }
    }

    setCurrentStep(targetStep);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    if (currentStep < TOTAL_STEPS) {
      handleNext();

      return;
    }

    const personalValid = validateStep(STEP_PERSONAL);

    if (!personalValid) {
      setCurrentStep(STEP_PERSONAL);

      return;
    }

    const contactValid = validateStep(STEP_CONTACT);

    if (!contactValid) {
      setCurrentStep(STEP_CONTACT);

      return;
    }

    const employmentValid = validateStep(STEP_EMPLOYMENT);

    if (!employmentValid) {
      setCurrentStep(STEP_EMPLOYMENT);

      return;
    }

    onSubmit?.(event);
  };

  const cropModal = isCropOpen ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-md border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Crop Teacher Photo
            </p>
            <p className="mt-1 text-xs font-normal leading-5 text-slate-500">
              Drag and zoom the image inside the circle.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelCrop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <FiX />
          </button>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-md bg-slate-900">
          <Cropper
            image={selectedImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropSize={{
              width: 260,
              height: 260,
            }}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-normal text-slate-600">
            Zoom
          </label>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-cyan-600"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancelCrop}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        title={editingTeacher ? "Edit Teacher" : "Add Teacher"}
        description={getStepDescription(currentStep)}
        onClose={onClose}
        maxWidth="max-w-3xl"
      >
        <form
          onSubmit={handleFormSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* =================================================
              PROGRESS
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
                PERSONAL (PHOTO + NAME)
            =============================================== */}

            {currentStep === STEP_PERSONAL && (
              <div className="space-y-5">
                <FormSection
                  icon={<FiImage />}
                  title="Teacher Photo"
                  description="PNG, JPG, or WEBP. The image will be cropped as a circle."
                >
                  {formData.photoPreview ? (
                    <div className="relative flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                        title="Remove photo"
                      >
                        <FiX />
                      </button>

                      <img
                        src={formData.photoPreview}
                        alt="Teacher preview"
                        className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white shadow-sm"
                      />

                      <div className="pr-10">
                        <p className="text-sm font-medium text-slate-900">
                          Photo selected
                        </p>
                        <p className="mt-1 text-xs font-normal leading-5 text-slate-500">
                          This cropped photo will be sent as{" "}
                          <span className="font-medium">teacherPhoto</span> in
                          API FormData.
                        </p>

                        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-cyan-500 hover:bg-cyan-50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                        <FiImage />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Choose and crop teacher photo
                        </p>
                        <p className="text-xs font-normal text-slate-500">
                          Click to browse for an image
                        </p>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </FormSection>

                <FormSection
                  icon={<FiUser />}
                  title="Personal Information"
                  description="Enter the teacher's basic personal information."
                >
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-3">
                    <FormInput
                      label="First Name"
                      required
                      value={formData.firstName}
                      onChange={(value) => handleChange("firstName", value)}
                      onBlur={() => touchField("firstName")}
                      error={getError("firstName")}
                      placeholder="Example: Arvin"
                    />

                    <FormInput
                      label="Middle Name"
                      value={formData.middleName}
                      onChange={(value) => handleChange("middleName", value)}
                      onBlur={() => touchField("middleName")}
                      error={getError("middleName")}
                      placeholder="Optional"
                    />

                    <FormInput
                      label="Last Name"
                      required
                      value={formData.lastName}
                      onChange={(value) => handleChange("lastName", value)}
                      onBlur={() => touchField("lastName")}
                      error={getError("lastName")}
                      placeholder="Example: Buendia"
                    />
                  </div>
                </FormSection>
              </div>
            )}

            {/* ===============================================
                STEP 2
                CONTACT
            =============================================== */}

            {currentStep === STEP_CONTACT && (
              <FormSection
                title="Contact Information"
                description="Set the teacher's email and mobile number."
              >
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                  <FormInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(value) => handleChange("email", value)}
                    onBlur={() => touchField("email")}
                    error={getError("email")}
                    placeholder="teacher@email.com"
                  />

                  <FormInput
                    label="Mobile Number"
                    type="tel"
                    value={formData.mobile}
                    onChange={(value) => handleChange("mobile", value)}
                    onBlur={() => touchField("mobile")}
                    error={getError("mobile")}
                    placeholder="09XXXXXXXXX"
                    inputMode="tel"
                  />
                </div>
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
                description="Assign the teacher ID, department, and account status."
              >
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                  <FormInput
                    label="Teacher ID"
                    required
                    value={formData.teacherId}
                    onChange={(value) => handleChange("teacherId", value)}
                    onBlur={() => touchField("teacherId")}
                    error={getError("teacherId")}
                    placeholder="TCH-0001"
                  />

                  <FormSelect
                    label="Department"
                    required
                    value={formData.department}
                    onChange={(value) => handleChange("department", value)}
                    onBlur={() => touchField("department")}
                    error={getError("department")}
                    options={departmentOptions}
                    placeholder="Select department"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Teacher Status
                    </p>
                    <p className="text-xs font-normal text-slate-500">
                      Active teachers can be assigned to sections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    className={`flex h-7 w-12 cursor-pointer items-center rounded-full p-1 transition ${
                      formData.status === "Active"
                        ? "bg-cyan-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transition ${
                        formData.status === "Active"
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
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
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
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
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-normal text-slate-600 transition hover:bg-slate-50"
                >
                  <FiX />
                  Cancel
                </button>

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700"
                  >
                    Next
                    <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 text-sm font-medium text-white transition hover:bg-cyan-700"
                  >
                    <FiSave />
                    {editingTeacher ? "Save Changes" : "Add Teacher"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </BaseModal>

      {cropModal && createPortal(cropModal, document.body)}
    </>
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
  inputMode,
  error = "",
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
        inputMode={inputMode}
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

      {hasError && (
        <p className="mt-1.5 text-xs font-normal text-red-500">{error}</p>
      )}
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
   HELPERS
========================================================= */

const getStepDescription = (step) => {
  switch (step) {
    case STEP_PERSONAL:
      return "Enter the teacher's photo and personal information.";

    case STEP_CONTACT:
      return "Set the teacher's contact information.";

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

export default TeacherModal;
