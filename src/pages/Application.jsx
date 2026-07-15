import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiEye,
  FiFileText,
  FiImage,
  FiInfo,
  FiMail,
  FiPhone,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import spryIcon from "../assets/Sprytechicon.webp";
import { apiDebugRequest } from "../utils/apiDebugger";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const steps = [
  { id: 1, title: "Personal Details" },
  { id: 2, title: "Guardian Detail" },
  { id: 3, title: "Grade / Course" },
  { id: 4, title: "Document Upload" },
  { id: 5, title: "Review" },
];

const genderOptions = ["Male", "Female"];
const relationshipOptions = [
  "Father",
  "Mother",
  "Guardian",
  "Sibling",
  "Other",
];

const levelOptions = [
  "Nursery",
  "Kinder 1",
  "Kinder 2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "College",
];

const strandOptions = ["STEM", "ABM", "HUMSS", "GAS", "TVL"];

const programOptions = [
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Business Administration",
  "Bachelor of Elementary Education",
  "Bachelor of Secondary Education",
];

const getAutomaticSchoolYear = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear} - ${currentYear + 1}`;
};

const getDepartmentByLevel = (levelApplied) => {
  if (!levelApplied) return "";

  if (levelApplied === "College") return "College";

  if (levelApplied === "Grade 11" || levelApplied === "Grade 12") {
    return "Senior High School";
  }

  if (
    levelApplied === "Grade 7" ||
    levelApplied === "Grade 8" ||
    levelApplied === "Grade 9" ||
    levelApplied === "Grade 10"
  ) {
    return "Junior High School";
  }

  if (
    levelApplied === "Nursery" ||
    levelApplied === "Kinder 1" ||
    levelApplied === "Kinder 2"
  ) {
    return "Preschool";
  }

  return "Elementary";
};

const defaultFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  lrn: "",
  previousSchool: "",

  email: "",
  mobile: "",
  homeAddress: "",

  guardianName: "",
  guardianRelationship: "",
  guardianContact: "",
  guardianEmail: "",

  levelApplied: "",
  department: "",
  strand: "",
  program: "",
  schoolYear: getAutomaticSchoolYear(),

  status: "Pending",
};

const defaultFiles = {
  photo2x2: null,
  birthCertificate: null,
  goodMoral: null,
  reportCardFront: null,
  reportCardBack: null,
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

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `2x2-photo-${Date.now()}.png`, {
          type: "image/png",
        });

        resolve({
          file,
          previewUrl: URL.createObjectURL(blob),
          type: file.type,
          name: file.name,
          size: file.size,
        });
      },
      "image/png",
      1,
    );
  });
};

const getFileSizeLabel = (file) => {
  if (!file) return "";

  const sizeInMb = file.size / 1024 / 1024;

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(file.size / 1024))} KB`;
};

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return "";

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age;
};

const isValidName = (value) => {
  return /^[A-Za-zÑñ\s.'-]+$/.test(value.trim());
};

const isValidMobile = (value) => {
  return /^09\d{9}$/.test(value.trim());
};

const hasValue = (value) => {
  return value !== "" && value !== null && value !== undefined;
};

const Applications = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState(defaultFormData);
  const [files, setFiles] = useState(defaultFiles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const age = useMemo(
    () => getAge(formData.dateOfBirth),
    [formData.dateOfBirth],
  );

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLevelChange = (value) => {
    const department = getDepartmentByLevel(value);
    const isCollege = value === "College";

    setFormData((current) => ({
      ...current,
      levelApplied: value,
      department,
      strand: isCollege ? current.strand : "",
      program: isCollege ? current.program : "",
    }));
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const markStepCompleted = (stepId) => {
    setCompletedSteps((current) => {
      if (current.includes(stepId)) return current;
      return [...current, stepId];
    });
  };

  const validateFileSize = (file) => {
    if (!file) return false;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Files above 5MB will be rejected.");
      return false;
    }

    return true;
  };

  const createFileItem = (file) => {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      size: file.size,
    };
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!validateFileSize(file)) {
      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedPhoto(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropOpen(true);

    event.target.value = "";
  };

  const handleApplyCrop = async () => {
    if (!selectedPhoto || !croppedAreaPixels) return;

    const croppedImage = await getCroppedImage(
      selectedPhoto,
      croppedAreaPixels,
    );

    setFiles((current) => ({
      ...current,
      photo2x2: croppedImage,
    }));

    setSelectedPhoto("");
    setIsCropOpen(false);
    toast.success("2x2 photo cropped successfully.");
  };

  const handleCancelCrop = () => {
    setSelectedPhoto("");
    setIsCropOpen(false);
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    if (!validateFileSize(file)) return;

    setFiles((current) => ({
      ...current,
      [field]: createFileItem(file),
    }));

    toast.success("File attached.");
  };

  const handleRemoveFile = (field) => {
    setFiles((current) => ({
      ...current,
      [field]: null,
    }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        toast.error(
          "Please complete first name, last name, and date of birth.",
        );
        return false;
      }

      if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
        toast.error("Names do not accept numbers or special characters.");
        return false;
      }

      if (formData.middleName && !isValidName(formData.middleName)) {
        toast.error(
          "Middle name does not accept numbers or special characters.",
        );
        return false;
      }

      if (!formData.gender) {
        toast.error("Please select gender.");
        return false;
      }

      if (!formData.email || !formData.mobile || !formData.homeAddress) {
        toast.error("Please complete email, mobile number, and home address.");
        return false;
      }

      if (!isValidMobile(formData.mobile)) {
        toast.error("Mobile number must be 11 digits and start with 09.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (age !== "" && age < 18) {
        if (
          !formData.guardianName ||
          !formData.guardianRelationship ||
          !formData.guardianContact
        ) {
          toast.error("Guardian details are required for applicants below 18.");
          return false;
        }

        if (!isValidMobile(formData.guardianContact)) {
          toast.error("Guardian contact must be 11 digits and start with 09.");
          return false;
        }
      }

      if (
        formData.guardianContact &&
        !isValidMobile(formData.guardianContact)
      ) {
        toast.error("Guardian contact must be 11 digits and start with 09.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.levelApplied || !formData.department) {
        toast.error("Please select grade or course level.");
        return false;
      }

      if (formData.levelApplied === "College" && !formData.program) {
        toast.error("Please select college program.");
        return false;
      }
    }

    if (currentStep === 5 && !isReviewed) {
      toast.error("Please confirm that you reviewed all details.");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;

    markStepCompleted(currentStep);
    setCurrentStep((current) => Math.min(current + 1, steps.length));
  };

  const goBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 1));
  };

  const handleStepClick = (stepId) => {
    if (stepId < currentStep || completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    markStepCompleted(5);
    setIsSubmitting(true);

    const payload = {
      ...formData,
      age,
      requirements: {
        photo2x2: files.photo2x2
          ? {
              name: files.photo2x2.name,
              size: files.photo2x2.size,
              type: files.photo2x2.type,
            }
          : null,
        birthCertificate: files.birthCertificate
          ? {
              name: files.birthCertificate.name,
              size: files.birthCertificate.size,
              type: files.birthCertificate.type,
            }
          : null,
        goodMoral: files.goodMoral
          ? {
              name: files.goodMoral.name,
              size: files.goodMoral.size,
              type: files.goodMoral.type,
            }
          : null,
        reportCardFront: files.reportCardFront
          ? {
              name: files.reportCardFront.name,
              size: files.reportCardFront.size,
              type: files.reportCardFront.type,
            }
          : null,
        reportCardBack: files.reportCardBack
          ? {
              name: files.reportCardBack.name,
              size: files.reportCardBack.size,
              type: files.reportCardBack.type,
            }
          : null,
      },
      reviewedAndConfirmed: isReviewed,
    };

    await apiDebugRequest({
      module: "enrollment-application",
      action: "submit",
      method: "POST",
      payload,
    });

    setIsSubmitting(false);

    Swal.fire({
      icon: "success",
      title: "Application Submitted",
      text: "The enrollment application is ready for backend integration.",
      confirmButtonColor: "#03a4d3",
    });
  };

  const cropModal = isCropOpen ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-md bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Crop 2x2 Photo
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Drag and zoom the image. The result will be square.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelCrop}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition hover:bg-slate-900 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-md bg-slate-900">
          <Cropper
            image={selectedPhoto}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropSize={{
              width: 260,
              height: 260,
            }}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700">
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

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancelCrop}
            className="rounded-md bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div data-aos="fade-up" className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col items-center justify-center text-center">
        <img
          src={spryIcon}
          alt="SPRYtech"
          className="mb-3 h-14 w-14 object-contain"
        />

        <h1 className="text-2xl font-black text-slate-950">
          Enrollment Application
        </h1>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          Complete the student application form below.
        </p>
      </div>

      <ProgressStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {currentStep === 1 && (
        <PersonalDetailsStep
          formData={formData}
          age={age}
          handleChange={handleChange}
        />
      )}

      {currentStep === 2 && (
        <GuardianDetailStep
          formData={formData}
          age={age}
          handleChange={handleChange}
        />
      )}

      {currentStep === 3 && (
        <GradeCourseStep
          formData={formData}
          handleChange={handleChange}
          handleLevelChange={handleLevelChange}
        />
      )}

      {currentStep === 4 && (
        <DocumentUploadStep
          files={files}
          handlePhotoSelect={handlePhotoSelect}
          handleFileChange={handleFileChange}
          handleRemoveFile={handleRemoveFile}
        />
      )}

      {currentStep === 5 && (
        <ReviewStep
          formData={formData}
          files={files}
          age={age}
          isReviewed={isReviewed}
          setIsReviewed={setIsReviewed}
        />
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 1}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiArrowLeft />
          Back
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
          >
            Next
            <FiArrowRight />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitApplication}
            disabled={isSubmitting || !isReviewed}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheck />
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>

      {cropModal && createPortal(cropModal, document.body)}
    </div>
  );
};

const ProgressStepper = ({ currentStep, completedSteps, onStepClick }) => {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-auto pb-2">
      <div className="relative mx-auto flex min-w-[900px] max-w-6xl items-start justify-between px-8">
        <div className="absolute left-16 right-16 top-4 h-px bg-slate-300" />

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const canClick = step.id < currentStep || isCompleted;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canClick}
              onClick={() => onStepClick(step.id)}
              className="relative z-10 flex w-40 flex-col items-center text-center disabled:cursor-not-allowed"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-sm transition ${
                  isCompleted
                    ? "bg-[#fb920e] text-white"
                    : isActive
                      ? "bg-[#03a4d3] text-white"
                      : "bg-slate-300 text-white"
                }`}
              >
                {isCompleted ? <FiCheck /> : step.id}
              </span>

              <span
                className={`mt-3 text-xs font-black ${
                  isActive
                    ? "text-[#03a4d3]"
                    : isCompleted
                      ? "text-[#fb920e]"
                      : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, description }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-black text-orange-700">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
};

const PersonalDetailsStep = ({ formData, age, handleChange }) => {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          title="Basic Information"
          description="Names do not accept numbers or special characters."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="First Name"
            value={formData.firstName}
            onChange={(value) => handleChange("firstName", value)}
            placeholder="Juan"
            required
          />

          <TextField
            label="Middle Name"
            value={formData.middleName}
            onChange={(value) => handleChange("middleName", value)}
            placeholder="Optional"
          />

          <TextField
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => handleChange("lastName", value)}
            placeholder="Dela Cruz"
            required
          />

          <div>
            <DateField
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(value) => handleChange("dateOfBirth", value)}
              required
            />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              {age !== "" ? `Age: ${age}` : "Age will appear here."}
            </p>
          </div>

          <SelectField
            label="Gender"
            value={formData.gender}
            onChange={(value) => handleChange("gender", value)}
            options={genderOptions}
            placeholder="Select"
            required
          />

          <TextField
            label="LRN"
            value={formData.lrn}
            onChange={(value) => handleChange("lrn", value)}
            placeholder="Learner Reference Number"
          />

          <div className="md:col-span-2">
            <TextField
              label="Previous School"
              value={formData.previousSchool}
              onChange={(value) => handleChange("previousSchool", value)}
              placeholder="Name of your previous school"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          title="Contact Details"
          description="Mobile must be 11 digits and start with 09."
        />

        <div className="grid gap-4">
          <TextField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(value) => handleChange("email", value)}
            placeholder="name@gmail.com"
            required
          />

          <TextField
            label="Mobile Number"
            value={formData.mobile}
            onChange={(value) => handleChange("mobile", value)}
            placeholder="09XXXXXXXXX"
            required
          />

          <TextField
            label="Home Address"
            value={formData.homeAddress}
            onChange={(value) => handleChange("homeAddress", value)}
            placeholder="House No., Street, Barangay, City"
            required
          />
        </div>
      </div>
    </div>
  );
};

const GuardianDetailStep = ({ formData, age, handleChange }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        title="Guardian Detail"
        description="Provide a contact person for student updates."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Parent/Guardian Name"
          value={formData.guardianName}
          onChange={(value) => handleChange("guardianName", value)}
          placeholder="Full Name"
        />

        <SelectField
          label="Relationship"
          value={formData.guardianRelationship}
          onChange={(value) => handleChange("guardianRelationship", value)}
          options={relationshipOptions}
          placeholder="Select"
        />

        <TextField
          label="Guardian Contact"
          value={formData.guardianContact}
          onChange={(value) => handleChange("guardianContact", value)}
          placeholder="09XXXXXXXXX"
        />

        <TextField
          label="Guardian Email"
          type="email"
          value={formData.guardianEmail}
          onChange={(value) => handleChange("guardianEmail", value)}
          placeholder="guardian@email.com"
        />
      </div>

      <div className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-cyan-800">
          <FiInfo className="text-cyan-600" />
          {age !== "" && age >= 18
            ? "Applicant is 18 or above. Parent or guardian consent may not be required."
            : "Applicants below 18 must provide guardian details."}
        </p>
      </div>
    </div>
  );
};

const GradeCourseStep = ({ formData, handleChange, handleLevelChange }) => {
  const isCollege = formData.levelApplied === "College";

  return (
    <div className="mx-auto max-w-5xl rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        title="Grade / Course"
        description="Select the grade level or course. Department will be auto-filled."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Level Applied"
          value={formData.levelApplied}
          onChange={handleLevelChange}
          options={levelOptions}
          placeholder="Select level"
          required
        />

        <TextField
          label="Department"
          value={formData.department}
          onChange={() => {}}
          placeholder="Auto-selected department"
          disabled
          required
        />

        <TextField
          label="School Year"
          value={formData.schoolYear}
          onChange={() => {}}
          placeholder="Automatic school year"
          disabled
          required
        />

        {isCollege && (
          <>
            <SelectField
              label="Strand"
              value={formData.strand}
              onChange={(value) => handleChange("strand", value)}
              options={strandOptions}
              placeholder="Select strand"
            />

            <div className="md:col-span-2">
              <SelectField
                label="Program"
                value={formData.program}
                onChange={(value) => handleChange("program", value)}
                options={programOptions}
                placeholder="Select program"
                required
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DocumentUploadStep = ({
  files,
  handlePhotoSelect,
  handleFileChange,
  handleRemoveFile,
}) => {
  return (
    <div className="mx-auto max-w-5xl rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        title="Document Upload"
        description="All requirements are optional. Files above 5MB will be rejected."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PhotoUploadBox
          label="2x2 Photo"
          fileItem={files.photo2x2}
          onChange={handlePhotoSelect}
          onRemove={() => handleRemoveFile("photo2x2")}
        />

        <FileUploadBox
          label="Birth Certificate"
          fileItem={files.birthCertificate}
          onChange={(file) => handleFileChange("birthCertificate", file)}
          onRemove={() => handleRemoveFile("birthCertificate")}
        />

        <FileUploadBox
          label="Certificate of Good Moral"
          fileItem={files.goodMoral}
          onChange={(file) => handleFileChange("goodMoral", file)}
          onRemove={() => handleRemoveFile("goodMoral")}
        />

        <FileUploadBox
          label="Report Card Front"
          fileItem={files.reportCardFront}
          onChange={(file) => handleFileChange("reportCardFront", file)}
          onRemove={() => handleRemoveFile("reportCardFront")}
        />

        <FileUploadBox
          label="Report Card Back"
          fileItem={files.reportCardBack}
          onChange={(file) => handleFileChange("reportCardBack", file)}
          onRemove={() => handleRemoveFile("reportCardBack")}
        />
      </div>
    </div>
  );
};

const ReviewStep = ({ formData, files, age, isReviewed, setIsReviewed }) => {
  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(" ");

  const uploadedCount = Object.values(files).filter(Boolean).length;

  const personalItems = [
    ["Date of Birth", formData.dateOfBirth],
    ["Age", age !== "" ? age : ""],
    ["Gender", formData.gender],
    ["LRN", formData.lrn],
    ["Previous School", formData.previousSchool],
  ];

  const contactItems = [
    ["Email", formData.email],
    ["Mobile", formData.mobile],
    ["Home Address", formData.homeAddress],
  ];

  const guardianItems = [
    ["Name", formData.guardianName],
    ["Relationship", formData.guardianRelationship],
    ["Contact", formData.guardianContact],
    ["Email", formData.guardianEmail],
  ];

  const gradeCourseItems = [
    ["Level Applied", formData.levelApplied],
    ["Department", formData.department],
    ["School Year", formData.schoolYear],
    ["Strand", formData.strand],
    ["Program", formData.program],
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-orange-700">
              Review Details
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Please check the summary before submitting.
            </p>
          </div>

          <div className="rounded-md bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
            {uploadedCount} of 5 files uploaded
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 xl:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-lg font-black text-cyan-700 ring-4 ring-cyan-100">
                {formData.firstName?.[0]}
                {formData.lastName?.[0]}
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-900">
                  {fullName || "-"}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {formData.levelApplied || "No level selected"}
                  {formData.department ? ` • ${formData.department}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {personalItems
                .filter((item) => hasValue(item[1]))
                .map(([label, value]) => (
                  <ReviewMiniRow key={label} label={label} value={value} />
                ))}
            </div>
          </div>

          <div className="grid gap-4 xl:col-span-3">
            <div className="grid gap-4 lg:grid-cols-1">
              <ReviewCompactCard
                title="Contact"
                icon={<FiPhone />}
                items={contactItems}
              />

              <ReviewCompactCard
                title="Guardian"
                icon={<FiMail />}
                items={guardianItems}
              />
            </div>

            <ReviewCompactCard
              title="Grade / Course"
              icon={<FiBookOpen />}
              items={gradeCourseItems}
              columns="md:grid-cols-3"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
              <FiFileText className="text-cyan-600" />
              Uploaded Requirements
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Compact preview of all uploaded files.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <RequirementPreview label="2x2 Photo" fileItem={files.photo2x2} />
          <RequirementPreview
            label="Birth Certificate"
            fileItem={files.birthCertificate}
          />
          <RequirementPreview
            label="Certificate of Good Moral"
            fileItem={files.goodMoral}
          />
          <RequirementPreview
            label="Report Card Front"
            fileItem={files.reportCardFront}
          />
          <RequirementPreview
            label="Report Card Back"
            fileItem={files.reportCardBack}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <input
          type="checkbox"
          checked={isReviewed}
          onChange={(event) => setIsReviewed(event.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer accent-orange-500"
        />

        <span className="text-sm font-bold text-orange-900">
          I have reviewed all details and confirm that the information and
          uploaded documents are correct before submitting this application.
        </span>
      </label>
    </div>
  );
};

const ReviewMiniRow = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
};

const ReviewCompactCard = ({
  title,
  icon,
  items,
  columns = "md:grid-cols-2",
}) => {
  const visibleItems = items.filter((item) => hasValue(item[1]));

  if (visibleItems.length === 0) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <span className="text-cyan-600">{icon}</span>
        {title}
      </h3>

      <div className={`grid gap-2 ${columns}`}>
        {visibleItems.map(([label, value]) => (
          <ReviewMiniRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
};

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-orange-500"> *</span>}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-md border border-slate-200 px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-500"
            : "bg-white text-slate-700"
        }`}
      />
    </div>
  );
};

const DateField = ({ label, value, onChange, required = false }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-orange-500"> *</span>}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      />
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-orange-500"> *</span>}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const PhotoUploadBox = ({ label, fileItem, onChange, onRemove }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <UploadHeader label={label} fileItem={fileItem} onRemove={onRemove} />

      {fileItem ? (
        <PreviewContent fileItem={fileItem} changeLabel="Change Photo">
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </PreviewContent>
      ) : (
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-white p-4 transition hover:border-cyan-500 hover:bg-cyan-50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-xl text-cyan-600">
            <FiImage />
          </div>

          <div>
            <p className="text-sm font-black text-slate-800">
              Upload and crop 2x2 photo
            </p>
            <p className="text-xs font-semibold text-slate-500">
              JPG, PNG, or WEBP. Max 5MB.
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

const FileUploadBox = ({ label, fileItem, onChange, onRemove }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <UploadHeader label={label} fileItem={fileItem} onRemove={onRemove} />

      {fileItem ? (
        <PreviewContent fileItem={fileItem} changeLabel="Change File">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => onChange(event.target.files?.[0])}
            className="hidden"
          />
        </PreviewContent>
      ) : (
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-white p-4 transition hover:border-cyan-500 hover:bg-cyan-50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-xl text-cyan-600">
            <FiUploadCloud />
          </div>

          <div>
            <p className="text-sm font-black text-slate-800">Choose file</p>
            <p className="text-xs font-semibold text-slate-500">
              PDF, JPG, PNG, or WEBP. Max 5MB.
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => onChange(event.target.files?.[0])}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

const UploadHeader = ({ label, fileItem, onRemove }) => {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black text-slate-900">{label}</h3>
        <p className="text-xs font-semibold text-slate-500">
          Optional. Max 5MB.
        </p>
      </div>

      {fileItem && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
          title="Remove file"
        >
          <FiTrash2 />
        </button>
      )}
    </div>
  );
};

const PreviewContent = ({ fileItem, changeLabel, children }) => {
  return (
    <div className="flex items-center gap-4">
      <FilePreview fileItem={fileItem} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-800">
          {fileItem.name}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-500">
          {getFileSizeLabel(fileItem.file)}
        </p>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:bg-cyan-100">
          {changeLabel}
          {children}
        </label>
      </div>
    </div>
  );
};

const FilePreview = ({ fileItem }) => {
  const isImage = fileItem.type?.startsWith("image/");
  const isPdf = fileItem.type === "application/pdf";

  if (isImage) {
    return (
      <img
        src={fileItem.previewUrl}
        alt={fileItem.name}
        className="h-24 w-24 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
      />
    );
  }

  if (isPdf) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50">
        <FiFileText className="text-3xl text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
      <FiFileText className="text-3xl text-slate-400" />
    </div>
  );
};

const RequirementPreview = ({ label, fileItem }) => {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      {fileItem ? (
        <CompactFilePreview fileItem={fileItem} />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white">
          <FiEye className="text-xl text-slate-300" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
          {label}
        </p>

        {fileItem ? (
          <>
            <p className="mt-1 truncate text-sm font-black text-slate-800">
              {fileItem.name}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {getFileSizeLabel(fileItem.file)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm font-bold text-slate-400">Not uploaded</p>
        )}
      </div>
    </div>
  );
};

const CompactFilePreview = ({ fileItem }) => {
  const isImage = fileItem.type?.startsWith("image/");
  const isPdf = fileItem.type === "application/pdf";

  if (isImage) {
    return (
      <img
        src={fileItem.previewUrl}
        alt={fileItem.name}
        className="h-16 w-16 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
      />
    );
  }

  if (isPdf) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50">
        <FiFileText className="text-2xl text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
      <FiFileText className="text-2xl text-slate-400" />
    </div>
  );
};

export default Applications;
