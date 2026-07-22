import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiImage,
  FiMail,
  FiSave,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiDebugRequest } from "../utils/apiDebugger";
import DocumentUploadModal from "../components/modals/DocumentUploadModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const applicants = [
  {
    id: 1,
    registrationNumber: "EIC-2026-000008",
    applicantId: "APP-000008",
    firstName: "Aisha Faye",
    middleName: "Rebagoda",
    lastName: "Tinio",
    dateOfBirth: "2010-06-04",
    gender: "Female",
    previousSchool: "Kaypian National High School",
    email: "aishatinioaishatinio@gmail.com",
    mobile: "09929471893",
    homeAddress:
      "Blk 21 Lot 22, Arkansas street Palmera Phase 7, Barangay Sto. Cristo, CSJDM",
    guardianName: "Ma. Juvy Eh. Tinio",
    relationship: "Mother",
    guardianContact: "09273376349",
    guardianEmail: "guardian@email.com",
    levelApplied: "Grade 7",
    department: "Junior High School",
    strand: "",
    program: "",
    schoolYear: "2026 - 2027",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    submittedAt: "Today",
  },
  {
    id: 2,
    registrationNumber: "EIC-2026-000006",
    applicantId: "APP-000006",
    firstName: "Kandice Clouie",
    middleName: "",
    lastName: "Castro",
    dateOfBirth: "2011-03-18",
    gender: "Female",
    previousSchool: "Sample National High School",
    email: "kandice.castro@email.com",
    mobile: "09987654321",
    homeAddress: "Cagayan de Oro City",
    guardianName: "Maria Castro",
    relationship: "Mother",
    guardianContact: "09123456789",
    guardianEmail: "",
    levelApplied: "Grade 8",
    department: "Junior High School",
    strand: "",
    program: "",
    schoolYear: "2026 - 2027",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    submittedAt: "Today",
  },
  {
    id: 3,
    registrationNumber: "EIC-2026-000005",
    applicantId: "APP-000005",
    firstName: "Aina",
    middleName: "",
    lastName: "Penales",
    dateOfBirth: "2010-09-12",
    gender: "Female",
    previousSchool: "Sample High School",
    email: "aina.penales@email.com",
    mobile: "09012345678",
    homeAddress: "Misamis Oriental",
    guardianName: "Pedro Penales",
    relationship: "Father",
    guardianContact: "09987654321",
    guardianEmail: "",
    levelApplied: "Grade 11",
    department: "Senior High School",
    strand: "STEM",
    program: "",
    schoolYear: "2026 - 2027",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    submittedAt: "Today",
  },
  {
    id: 4,
    registrationNumber: "EIC-2026-000004",
    applicantId: "APP-000004",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    dateOfBirth: "2009-01-20",
    gender: "Male",
    previousSchool: "Sample Integrated School",
    email: "juan.delacruz@email.com",
    mobile: "09111222333",
    homeAddress: "Bulacan",
    guardianName: "Maria Dela Cruz",
    relationship: "Mother",
    guardianContact: "09123456789",
    guardianEmail: "",
    levelApplied: "College",
    department: "College",
    strand: "",
    program: "Bachelor of Science in Business Administration",
    schoolYear: "2026 - 2027",
    verificationStatus: "Verified",
    applicationStatus: "Verified",
    submittedAt: "Today",
  },
];

const defaultDocuments = [
  {
    key: "photo",
    label: "2x2 Photo",
    accept: "image/*",
    file: null,
    fileName: "",
    fileSize: "",
    fileType: "",
    previewUrl: "",
  },
  {
    key: "birthCertificate",
    label: "Birth Certificate",
    accept: "image/*,application/pdf",
    file: null,
    fileName: "",
    fileSize: "",
    fileType: "",
    previewUrl: "",
  },
  {
    key: "goodMoral",
    label: "Good Moral",
    accept: "image/*,application/pdf",
    file: null,
    fileName: "",
    fileSize: "",
    fileType: "",
    previewUrl: "",
  },
  {
    key: "reportCardFront",
    label: "Report Card Front",
    accept: "image/*,application/pdf",
    file: null,
    fileName: "",
    fileSize: "",
    fileType: "",
    previewUrl: "",
  },
  {
    key: "reportCardBack",
    label: "Report Card Back",
    accept: "image/*,application/pdf",
    file: null,
    fileName: "",
    fileSize: "",
    fileType: "",
    previewUrl: "",
  },
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
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Information Technology",
  "Bachelor of Elementary Education",
  "Bachelor of Secondary Education",
];

const getDepartmentByLevel = (level) => {
  if (level === "College") return "College";

  if (["Grade 11", "Grade 12"].includes(level)) {
    return "Senior High School";
  }

  if (["Grade 7", "Grade 8", "Grade 9", "Grade 10"].includes(level)) {
    return "Junior High School";
  }

  if (["Nursery", "Kinder 1", "Kinder 2"].includes(level)) {
    return "Preschool";
  }

  return "Elementary";
};

const getFullName = (applicant) => {
  return [applicant.firstName, applicant.middleName, applicant.lastName]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (applicant) => {
  return `${applicant.firstName?.[0] || ""}${
    applicant.lastName?.[0] || ""
  }`.toUpperCase();
};

const formatFileSize = (size) => {
  if (!size) return "";
  return `${Math.round(size / 1024)} KB`;
};

const createImage = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = url;
  });
};

const getCroppedImage = async (imageSrc, croppedAreaPixels, fileName) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image."));
          return;
        }

        const croppedFile = new File(
          [blob],
          fileName || "cropped-document.jpg",
          {
            type: "image/jpeg",
          },
        );

        resolve({
          file: croppedFile,
          previewUrl: URL.createObjectURL(blob),
          fileName: croppedFile.name,
          fileSize: formatFileSize(blob.size),
          fileType: "image/jpeg",
        });
      },
      "image/jpeg",
      0.92,
    );
  });
};

const ApplicantDetails = () => {
  const navigate = useNavigate();
  const { registrationNumber } = useParams();

  const applicant = useMemo(() => {
    return applicants.find(
      (item) => item.registrationNumber === registrationNumber,
    );
  }, [registrationNumber]);

  const [formData, setFormData] = useState(applicant || {});
  const [draftData, setDraftData] = useState(applicant || {});
  const [editingSection, setEditingSection] = useState("");
  const [documents, setDocuments] = useState(defaultDocuments);

  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    documentItem: null,
    selectedFile: null,
    previewUrl: "",
    imageSrc: "",
    isImage: false,
    fileName: "",
    fileSize: "",
    fileType: "",
    isRecropping: false,
  });

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  if (!applicant) {
    return (
      <div className="space-y-5" data-aos="fade-up">
        <button
          type="button"
          onClick={() => navigate("/enrollment/verification")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to Verification
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            Applicant not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            The selected registration number does not exist.
          </p>
        </div>
      </div>
    );
  }

  const isVerified = formData.verificationStatus === "Verified";

  const startEdit = (section) => {
    setEditingSection(section);
    setDraftData(formData);
  };

  const cancelEdit = () => {
    setEditingSection("");
    setDraftData(formData);
  };

  const updateDraft = (field, value) => {
    setDraftData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveSection = async (section) => {
    await apiDebugRequest({
      module: "applicant-details",
      action: `update-${section}`,
      method: "PATCH",
      payload: {
        id: formData.id,
        registrationNumber: formData.registrationNumber,
        applicantId: formData.applicantId,
        applicantName: getFullName(formData),
        section,
        data: draftData,
        updatedAt: new Date().toISOString(),
      },
    });

    setFormData(draftData);
    setEditingSection("");
    toast.success("Applicant details updated.");
  };

  const handleVerifyApplicant = async () => {
    await apiDebugRequest({
      module: "applicant-details",
      action: "verify-applicant",
      method: "PATCH",
      payload: {
        id: formData.id,
        registrationNumber: formData.registrationNumber,
        applicantId: formData.applicantId,
        applicantName: getFullName(formData),
        previousStatus: formData.verificationStatus,
        nextStatus: "Verified",
        verifiedAt: new Date().toISOString(),
      },
    });

    setFormData((current) => ({
      ...current,
      verificationStatus: "Verified",
      applicationStatus: "Verified",
    }));

    toast.success("Applicant marked as verified.");
  };

  const openUploadModal = (documentItem) => {
    const isExistingImage = documentItem.fileType?.startsWith("image/");
    const existingPreview = documentItem.previewUrl || "";

    setUploadModal({
      isOpen: true,
      documentItem,
      selectedFile: null,
      previewUrl: existingPreview,
      imageSrc: isExistingImage ? existingPreview : "",
      isImage: isExistingImage,
      fileName: documentItem.fileName || "",
      fileSize: documentItem.fileSize || "",
      fileType: documentItem.fileType || "",
      isRecropping: isExistingImage && Boolean(existingPreview),
    });

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeUploadModal = () => {
    setUploadModal({
      isOpen: false,
      documentItem: null,
      selectedFile: null,
      previewUrl: "",
      imageSrc: "",
      isImage: false,
      fileName: "",
      fileSize: "",
      fileType: "",
      isRecropping: false,
    });

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const chooseFileInModal = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Files above 5MB will be rejected.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const previewUrl = URL.createObjectURL(file);

    setUploadModal((current) => ({
      ...current,
      selectedFile: file,
      previewUrl,
      imageSrc: isImage ? previewUrl : "",
      isImage,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      isRecropping: false,
    }));

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const saveUploadModal = async () => {
    if (!uploadModal.documentItem) return;

    const hasNewFile = Boolean(uploadModal.selectedFile);
    const isRecroppingExistingImage =
      uploadModal.isRecropping && uploadModal.imageSrc;

    if (!hasNewFile && !isRecroppingExistingImage) {
      closeUploadModal();
      return;
    }

    if (uploadModal.isImage && uploadModal.imageSrc && !croppedAreaPixels) {
      toast.error("Please wait for the image cropper to finish loading.");
      return;
    }

    let savedFile = uploadModal.selectedFile;
    let savedPreviewUrl = uploadModal.previewUrl;
    let savedFileName = uploadModal.fileName;
    let savedFileSize = uploadModal.fileSize;
    let savedFileType = uploadModal.fileType;

    if (uploadModal.isImage && uploadModal.imageSrc && croppedAreaPixels) {
      const croppedFile = await getCroppedImage(
        uploadModal.imageSrc,
        croppedAreaPixels,
        uploadModal.fileName || "cropped-document.jpg",
      );

      savedFile = croppedFile.file;
      savedPreviewUrl = croppedFile.previewUrl;
      savedFileName = croppedFile.fileName;
      savedFileSize = croppedFile.fileSize;
      savedFileType = croppedFile.fileType;
    }

    setDocuments((current) =>
      current.map((item) =>
        item.key === uploadModal.documentItem.key
          ? {
              ...item,
              file: savedFile,
              fileName: savedFileName,
              fileSize: savedFileSize,
              fileType: savedFileType,
              previewUrl: savedPreviewUrl,
            }
          : item,
      ),
    );

    await apiDebugRequest({
      module: "applicant-details",
      action: uploadModal.isRecropping ? "recrop-document" : "upload-document",
      method: "POST",
      payload: {
        registrationNumber: formData.registrationNumber,
        applicantId: formData.applicantId,
        applicantName: getFullName(formData),
        documentKey: uploadModal.documentItem.key,
        documentLabel: uploadModal.documentItem.label,
        file: savedFile,
        fileName: savedFileName,
        fileSize: savedFileSize,
        fileType: savedFileType,
        isImage: Boolean(savedFileType?.startsWith("image/")),
        isCropped: Boolean(uploadModal.isImage && croppedAreaPixels),
        isRecropping: Boolean(uploadModal.isRecropping),
        cropArea: croppedAreaPixels,
        uploadedAt: new Date().toISOString(),
      },
    });

    toast.success(`${uploadModal.documentItem.label} saved.`);
    closeUploadModal();
  };

  const removeDocument = async (documentKey) => {
    const documentItem = documents.find((item) => item.key === documentKey);

    setDocuments((current) =>
      current.map((item) =>
        item.key === documentKey
          ? {
              ...item,
              file: null,
              fileName: "",
              fileSize: "",
              fileType: "",
              previewUrl: "",
            }
          : item,
      ),
    );

    await apiDebugRequest({
      module: "applicant-details",
      action: "remove-document",
      method: "DELETE",
      payload: {
        registrationNumber: formData.registrationNumber,
        applicantId: formData.applicantId,
        applicantName: getFullName(formData),
        documentKey,
        documentLabel: documentItem?.label || documentKey,
        removedFileName: documentItem?.fileName || "",
        removedAt: new Date().toISOString(),
      },
    });

    toast.success("Document removed.");
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            Applicant Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review application information and uploaded requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/enrollment/verification")}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-medium text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(formData)}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Applicant</p>
              <h2 className="text-xl font-medium text-slate-950">
                {getFullName(formData)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-medium text-slate-600">
                  {formData.registrationNumber}
                </span>

                <ApplicationStatus status={formData.applicationStatus} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <VerificationBadge status={formData.verificationStatus} />

            {!isVerified && (
              <button
                type="button"
                onClick={handleVerifyApplicant}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                <FiShield />
                Verify Applicant
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="Applicant Information"
            icon={<FiUser />}
            color="cyan"
            section="personal"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Last Name", formData.lastName],
              ["First Name", formData.firstName],
              ["Middle Name", formData.middleName],
              ["Date of Birth", formData.dateOfBirth],
              ["Gender", formData.gender],
              ["Previous School", formData.previousSchool],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Last Name"
                value={draftData.lastName}
                onChange={(value) => updateDraft("lastName", value)}
              />
              <FormInput
                label="First Name"
                value={draftData.firstName}
                onChange={(value) => updateDraft("firstName", value)}
              />
              <FormInput
                label="Middle Name"
                value={draftData.middleName}
                onChange={(value) => updateDraft("middleName", value)}
              />
              <FormInput
                label="Date of Birth"
                type="date"
                value={draftData.dateOfBirth}
                onChange={(value) => updateDraft("dateOfBirth", value)}
              />
              <FormSelect
                label="Gender"
                value={draftData.gender}
                onChange={(value) => updateDraft("gender", value)}
                options={["Male", "Female"]}
              />
              <FormInput
                label="Previous School"
                value={draftData.previousSchool}
                onChange={(value) => updateDraft("previousSchool", value)}
              />
            </div>
          </DetailCard>

          <DetailCard
            title="Contact Information"
            icon={<FiMail />}
            color="orange"
            section="contact"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Email Address", formData.email],
              ["Mobile Number", formData.mobile],
              ["Home Address", formData.homeAddress],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Email Address"
                value={draftData.email}
                onChange={(value) => updateDraft("email", value)}
              />
              <FormInput
                label="Mobile Number"
                value={draftData.mobile}
                onChange={(value) => updateDraft("mobile", value)}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Home Address"
                  value={draftData.homeAddress}
                  onChange={(value) => updateDraft("homeAddress", value)}
                />
              </div>
            </div>
          </DetailCard>

          <DetailCard
            title="Guardian Information"
            icon={<FiUsers />}
            color="violet"
            section="guardian"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Guardian Name", formData.guardianName],
              ["Relationship", formData.relationship],
              ["Contact", formData.guardianContact],
              ["Email", formData.guardianEmail],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Guardian Name"
                value={draftData.guardianName}
                onChange={(value) => updateDraft("guardianName", value)}
              />
              <FormSelect
                label="Relationship"
                value={draftData.relationship}
                onChange={(value) => updateDraft("relationship", value)}
                options={["Mother", "Father", "Guardian", "Sibling", "Other"]}
              />
              <FormInput
                label="Contact"
                value={draftData.guardianContact}
                onChange={(value) => updateDraft("guardianContact", value)}
              />
              <FormInput
                label="Email"
                value={draftData.guardianEmail}
                onChange={(value) => updateDraft("guardianEmail", value)}
              />
            </div>
          </DetailCard>

          <DetailCard
            title="Application Details"
            icon={<FiBookOpen />}
            color="emerald"
            section="application"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Application ID", formData.id],
              ["Applicant ID", formData.applicantId],
              ["Registration Number", formData.registrationNumber],
              ["Level Applied", formData.levelApplied],
              ["Department", formData.department],
              ["Strand", formData.strand],
              ["Program", formData.program],
              ["School Year", formData.schoolYear],
              ["Last Updated", formData.submittedAt],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                label="Level Applied"
                value={draftData.levelApplied}
                onChange={(value) => {
                  setDraftData((current) => ({
                    ...current,
                    levelApplied: value,
                    department: getDepartmentByLevel(value),
                    strand: "",
                    program: "",
                  }));
                }}
                options={levelOptions}
              />

              <FormInput
                label="Department"
                value={draftData.department}
                disabled
                onChange={() => {}}
              />

              {draftData.department === "Senior High School" && (
                <FormSelect
                  label="Strand"
                  value={draftData.strand}
                  onChange={(value) => updateDraft("strand", value)}
                  options={strandOptions}
                />
              )}

              {draftData.department === "College" && (
                <FormSelect
                  label="Program"
                  value={draftData.program}
                  onChange={(value) => updateDraft("program", value)}
                  options={programOptions}
                />
              )}

              <FormInput
                label="School Year"
                value={draftData.schoolYear}
                disabled
                onChange={() => {}}
              />
            </div>
          </DetailCard>
        </div>

        <div className="mt-5 rounded-md bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
              <FiFileText />
            </div>

            <div>
              <h3 className="font-medium text-slate-950">
                Uploaded Requirements
              </h3>
              <p className="text-sm text-slate-500">
                Upload, preview, replace, crop, or remove submitted documents.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
            {documents.map((documentItem) => (
              <DocumentBox
                key={documentItem.key}
                documentItem={documentItem}
                onOpenUploadModal={openUploadModal}
                onRemoveDocument={removeDocument}
              />
            ))}
          </div>
        </div>
      </div>

      <DocumentUploadModal
        uploadModal={uploadModal}
        crop={crop}
        zoom={zoom}
        setCrop={setCrop}
        setZoom={setZoom}
        setCroppedAreaPixels={setCroppedAreaPixels}
        onClose={closeUploadModal}
        onChooseFile={chooseFileInModal}
        onSave={saveUploadModal}
      />
    </div>
  );
};

const DetailCard = ({
  title,
  icon,
  color = "cyan",
  section,
  editingSection,
  onEdit,
  onCancel,
  onSave,
  viewItems,
  children,
}) => {
  const isEditing = editingSection === section;

  const colorClass = {
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  const visibleItems = viewItems.filter(([, value]) => {
    return value !== "" && value !== null && value !== undefined;
  });

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-md ${
              colorClass[color] || colorClass.cyan
            }`}
          >
            {icon}
          </div>

          <h3 className="font-medium text-slate-950">{title}</h3>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => onEdit(section)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"
            title="Edit"
          >
            <FiEdit2 />
          </button>
        )}
      </div>

      <div className="p-5">
        {isEditing ? (
          <div className="space-y-4">
            {children}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => onSave(section)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                <FiSave />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visibleItems.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-md border px-3 text-sm font-medium outline-none transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
        }`}
      />
    </div>
  );
};

const FormSelect = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const DocumentBox = ({ documentItem, onOpenUploadModal, onRemoveDocument }) => {
  const hasFile = Boolean(documentItem.previewUrl);
  const isImage = documentItem.fileType?.startsWith("image/");

  return (
    <div className="rounded-md bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {documentItem.label}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Max file size: 5MB
          </p>
        </div>

        {hasFile && (
          <button
            type="button"
            onClick={() => onRemoveDocument(documentItem.key)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
            title="Remove"
          >
            <FiTrash2 />
          </button>
        )}
      </div>

      <div className="mt-4 flex h-28 items-center justify-center overflow-hidden rounded-md bg-white">
        {hasFile && isImage ? (
          <img
            src={documentItem.previewUrl}
            alt={documentItem.label}
            className="h-full w-full object-cover"
          />
        ) : hasFile ? (
          <div className="text-center text-slate-500">
            <FiFileText className="mx-auto text-2xl" />
            <p className="mt-2 text-xs font-medium">File selected</p>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <FiImage className="mx-auto text-2xl" />
            <p className="mt-2 text-xs font-medium">No preview</p>
          </div>
        )}
      </div>

      {hasFile && (
        <div className="mt-3">
          <p className="truncate text-xs font-medium text-slate-700">
            {documentItem.fileName}
          </p>
          <p className="text-xs font-medium text-slate-400">
            {documentItem.fileSize}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenUploadModal(documentItem)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-600 hover:text-white"
      >
        <FiUploadCloud />
        {hasFile ? "View / Reupload" : "Upload File"}
      </button>
    </div>
  );
};

const VerificationBadge = ({ status }) => {
  const isVerified = status === "Verified";

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
        isVerified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {isVerified ? <FiCheckCircle /> : <FiShield />}
      {status}
    </span>
  );
};

const ApplicationStatus = ({ status }) => {
  const isVerified = status === "Verified";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
        isVerified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-orange-50 text-orange-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isVerified ? "bg-emerald-500" : "bg-orange-500"
        }`}
      />
      {status}
    </span>
  );
};

export default ApplicantDetails;
