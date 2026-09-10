import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiHash,
  FiImage,
  FiMail,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiDebugRequest } from "../utils/apiDebugger";
import DocumentUploadModal from "../components/modals/DocumentUploadModal";
import api from "../lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

const gradeOptions = [
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

const statusOptions = ["Enrolled", "Unenrolled", "Inactive"];
const genderOptions = ["Male", "Female"];
const relationshipOptions = [
  "Mother",
  "Father",
  "Guardian",
  "Sibling",
  "Other",
];

const getDepartmentByGrade = (gradeLevel) => {
  if (gradeLevel === "College") return "College";

  if (["Grade 11", "Grade 12"].includes(gradeLevel)) {
    return "Senior High School";
  }

  if (["Grade 7", "Grade 8", "Grade 9", "Grade 10"].includes(gradeLevel)) {
    return "Junior High School";
  }

  if (["Nursery", "Kinder 1", "Kinder 2"].includes(gradeLevel)) {
    return "Preschool";
  }

  return "Elementary";
};

const getFullName = (student) => {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
};

const getInitials = (student) => {
  return `${student.firstName?.[0] || ""}${
    student.lastName?.[0] || ""
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

const StudentDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [draftStudent, setDraftStudent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError("");
    api
      .get(`/api/students/${encodeURIComponent(studentId)}`)
      .then((response) => {
        if (cancelled) return;
        setStudent(response.data.student);
        setDraftStudent(response.data.student);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error.response?.data?.message || "The selected student record does not exist.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="rounded-md bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">Loading student details...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/students")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back to Students
        </button>

        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-medium text-slate-900">
            Student not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {loadError}
          </p>
        </div>
      </div>
    );
  }

  const startEdit = (section) => {
    setEditingSection(section);
    setDraftStudent(student);
  };

  const cancelEdit = () => {
    setEditingSection("");
    setDraftStudent(student);
  };

  const updateDraft = (field, value) => {
    setDraftStudent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveSection = async (section) => {
    try {
      const response = await api.patch(
        `/api/students/${encodeURIComponent(student.studentId)}`,
        draftStudent,
      );
      setStudent(response.data.student);
      setDraftStudent(response.data.student);
      setEditingSection("");
      toast.success(response.data.message || "Student details updated.");
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;
      toast.error(
        firstError || error.response?.data?.message || "Unable to update student details.",
      );
    }
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
      module: "student",
      action: uploadModal.isRecropping ? "recrop-document" : "upload-document",
      method: "POST",
      payload: {
        id: student.id,
        studentId: student.studentId,
        studentName: getFullName(student),
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
      module: "student",
      action: "remove-document",
      method: "DELETE",
      payload: {
        id: student.id,
        studentId: student.studentId,
        studentName: getFullName(student),
        documentKey,
        documentLabel: documentItem?.label || documentKey,
        removedFileName: documentItem?.fileName || "",
        removedAt: new Date().toISOString(),
      },
    });

    toast.success("Document removed.");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-950">
            Student Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and update student profile, contact, class, guardian details,
            and documents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/students")}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <div className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xl font-medium text-cyan-700 ring-4 ring-cyan-100">
              {getInitials(student)}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Student</p>

              <h2 className="text-xl font-medium text-slate-950">
                {getFullName(student)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-600">
                  <FiHash />
                  {student.studentId}
                </span>

                <StatusBadge status={student.status} />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Class</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {student.gradeLevel} - {student.section}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <DetailCard
            title="Student Information"
            icon={<FiUser />}
            color="cyan"
            section="student"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            viewItems={[
              ["Last Name", student.lastName],
              ["First Name", student.firstName],
              ["Middle Name", student.middleName],
              ["Birth Date", student.birthDate],
              ["Gender", student.gender],
              ["Status", student.status],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Last Name"
                value={draftStudent.lastName}
                onChange={(value) => updateDraft("lastName", value)}
              />

              <FormInput
                label="First Name"
                value={draftStudent.firstName}
                onChange={(value) => updateDraft("firstName", value)}
              />

              <FormInput
                label="Middle Name"
                value={draftStudent.middleName}
                onChange={(value) => updateDraft("middleName", value)}
              />

              <FormInput
                label="Birth Date"
                type="date"
                value={draftStudent.birthDate}
                onChange={(value) => updateDraft("birthDate", value)}
              />

              <FormSelect
                label="Gender"
                value={draftStudent.gender}
                options={genderOptions}
                onChange={(value) => updateDraft("gender", value)}
              />

              <FormSelect
                label="Status"
                value={draftStudent.status}
                options={statusOptions}
                onChange={(value) => updateDraft("status", value)}
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
              ["Email Address", student.email],
              ["Mobile Number", student.mobile],
              ["Home Address", student.address],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Email Address"
                value={draftStudent.email}
                onChange={(value) => updateDraft("email", value)}
              />

              <FormInput
                label="Mobile Number"
                value={draftStudent.mobile}
                onChange={(value) => updateDraft("mobile", value)}
              />

              <div className="sm:col-span-2">
                <FormInput
                  label="Home Address"
                  value={draftStudent.address}
                  onChange={(value) => updateDraft("address", value)}
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
              ["Guardian Name", student.guardianName],
              ["Relationship", student.relationship],
              ["Guardian Contact", student.guardianContact],
              ["Guardian Email", student.guardianEmail],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Guardian Name"
                value={draftStudent.guardianName}
                onChange={(value) => updateDraft("guardianName", value)}
              />

              <FormSelect
                label="Relationship"
                value={draftStudent.relationship}
                options={relationshipOptions}
                onChange={(value) => updateDraft("relationship", value)}
              />

              <FormInput
                label="Guardian Contact"
                value={draftStudent.guardianContact}
                onChange={(value) => updateDraft("guardianContact", value)}
              />

              <FormInput
                label="Guardian Email"
                value={draftStudent.guardianEmail}
                onChange={(value) => updateDraft("guardianEmail", value)}
              />
            </div>
          </DetailCard>

          <DetailCard
            title="Academic Details"
            icon={<FiBookOpen />}
            color="emerald"
            section="academic"
            editingSection={editingSection}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveSection}
            editable={false}
            viewItems={[
              ["Student ID", student.studentId],
              ["RFID", student.rfid],
              ["Grade Level", student.gradeLevel],
              ["Section", student.section],
              ["Department", student.department],
              ["School Year", student.schoolYear],
            ]}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Student ID"
                value={draftStudent.studentId}
                onChange={(value) => updateDraft("studentId", value)}
              />

              <FormInput
                label="RFID"
                value={draftStudent.rfid}
                onChange={(value) => updateDraft("rfid", value)}
              />

              <FormSelect
                label="Grade Level"
                value={draftStudent.gradeLevel}
                options={gradeOptions}
                onChange={(value) => {
                  setDraftStudent((current) => ({
                    ...current,
                    gradeLevel: value,
                    department: getDepartmentByGrade(value),
                  }));
                }}
              />

              <FormInput
                label="Section"
                value={draftStudent.section}
                onChange={(value) => updateDraft("section", value)}
              />

              <FormInput
                label="Department"
                value={draftStudent.department}
                disabled
                onChange={() => {}}
              />

              <FormInput
                label="School Year"
                value={draftStudent.schoolYear}
                onChange={(value) => updateDraft("schoolYear", value)}
              />
            </div>
          </DetailCard>
        </div>

        <div className="mt-5 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
              <FiFileText />
            </div>

            <div>
              <h3 className="font-medium text-slate-950">Student Documents</h3>
              <p className="text-sm text-slate-500">
                Upload, preview, replace, crop, or remove student documents.
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
  color,
  section,
  editingSection,
  onEdit,
  onCancel,
  onSave,
  editable = true,
  viewItems,
  children,
}) => {
  const isEditing = editingSection === section;

  const colorClass = {
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const visibleItems = viewItems.filter(([, value]) => {
    return value !== "" && value !== null && value !== undefined;
  });

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
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

        {!isEditing && editable && (
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

const FormSelect = ({ label, value, options, onChange }) => {
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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
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

const StatusBadge = ({ status }) => {
  const style =
    status === "Enrolled"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Unenrolled"
        ? "bg-orange-50 text-orange-700"
        : "bg-slate-100 text-slate-500";

  const dotStyle =
    status === "Enrolled"
      ? "bg-emerald-500"
      : status === "Unenrolled"
        ? "bg-orange-500"
        : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${style}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyle}`} />
      {status}
    </span>
  );
};

export default StudentDetails;
