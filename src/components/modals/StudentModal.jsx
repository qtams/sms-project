import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { FiImage, FiX } from "react-icons/fi";
import BaseModal from "./BaseModal";

const gradeLevelOptions = [
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

const sectionOptions = ["A", "B", "C", "STEM A", "STEM B", "ABM A", "HUMSS A"];

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
        const file = new File([blob], `student-photo-${Date.now()}.png`, {
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

const StudentModal = ({
  isOpen,
  editingStudent,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  const [selectedImage, setSelectedImage] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
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

  const cropModal = isCropOpen ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-md bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Crop Student Photo
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Drag and zoom the image inside the circle.
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
    <>
      <BaseModal
        isOpen={isOpen}
        title={editingStudent ? "Edit Student" : "Add Student"}
        description="Create student profiles and connect them to grade levels and sections."
        onClose={onClose}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Student Photo
            </label>

            {formData.photoPreview ? (
              <div className="relative flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white transition hover:bg-red-600"
                  title="Remove photo"
                >
                  <FiX />
                </button>

                <img
                  src={formData.photoPreview}
                  alt="Student preview"
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white shadow-md"
                />

                <div className="pr-10">
                  <p className="text-sm font-black text-slate-900">
                    Photo selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    This cropped photo will be sent as{" "}
                    <span className="font-black">studentPhoto</span> in API
                    FormData.
                  </p>

                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:bg-cyan-100">
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
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                  <FiImage />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-700">
                    Choose and crop student photo
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, or WEBP. The image will be cropped as a circle.
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Student ID
              </label>

              <input
                type="text"
                value={formData.studentId}
                onChange={(event) =>
                  handleChange("studentId", event.target.value)
                }
                placeholder="STD-0001"
                required
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                RFID
              </label>

              <input
                type="text"
                value={formData.rfid}
                onChange={(event) => handleChange("rfid", event.target.value)}
                placeholder="RFID-000001"
                required
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                First Name
              </label>

              <input
                type="text"
                value={formData.firstName}
                onChange={(event) =>
                  handleChange("firstName", event.target.value)
                }
                placeholder="Example: Juan"
                required
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Middle Name
              </label>

              <input
                type="text"
                value={formData.middleName}
                onChange={(event) =>
                  handleChange("middleName", event.target.value)
                }
                placeholder="Optional"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Last Name
              </label>

              <input
                type="text"
                value={formData.lastName}
                onChange={(event) =>
                  handleChange("lastName", event.target.value)
                }
                placeholder="Example: Dela Cruz"
                required
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Grade Level
              </label>

              <select
                value={formData.gradeLevel}
                onChange={(event) =>
                  handleChange("gradeLevel", event.target.value)
                }
                required
                className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              >
                <option value="">Select grade level</option>

                {gradeLevelOptions.map((gradeLevel) => (
                  <option key={gradeLevel} value={gradeLevel}>
                    {gradeLevel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Section
              </label>

              <select
                value={formData.section}
                onChange={(event) =>
                  handleChange("section", event.target.value)
                }
                required
                className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              >
                <option value="">Select section</option>

                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Birth Date
              </label>

              <input
                type="date"
                value={formData.birthDate}
                onChange={(event) =>
                  handleChange("birthDate", event.target.value)
                }
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Guardian Name
              </label>

              <input
                type="text"
                value={formData.guardianName}
                onChange={(event) =>
                  handleChange("guardianName", event.target.value)
                }
                placeholder="Parent or guardian"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Guardian Contact
              </label>

              <input
                type="tel"
                value={formData.guardianContact}
                onChange={(event) =>
                  handleChange("guardianContact", event.target.value)
                }
                placeholder="09XXXXXXXXX"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Address
              </label>

              <input
                type="text"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                placeholder="Student address"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-black text-slate-800">
                Student Status
              </p>
              <p className="text-xs text-slate-500">
                Active students will appear first in the student list.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStatusToggle}
              className={`flex h-8 w-14 cursor-pointer items-center rounded-full p-1 transition ${
                formData.status === "Active" ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow transition ${
                  formData.status === "Active"
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-red-500 px-6 py-3 text-sm font-black text-white transition hover:bg-red-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-cyan-600"
            >
              {editingStudent ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </BaseModal>

      {cropModal && createPortal(cropModal, document.body)}
    </>
  );
};

export default StudentModal;
