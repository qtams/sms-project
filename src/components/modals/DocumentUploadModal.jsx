import Cropper from "react-easy-crop";
import {
  FiFileText,
  FiImage,
  FiRefreshCw,
  FiSave,
  FiUploadCloud,
} from "react-icons/fi";
import BaseModal from "./BaseModal";

const DocumentUploadModal = ({
  uploadModal,
  crop,
  zoom,
  setCrop,
  setZoom,
  setCroppedAreaPixels,
  onClose,
  onChooseFile,
  onSave,
}) => {
  const documentItem = uploadModal.documentItem;
  const hasPreview = Boolean(uploadModal.previewUrl);
  const hasNewFile = Boolean(uploadModal.selectedFile);
  const canSave = hasNewFile || Boolean(uploadModal.isRecropping);

  return (
    <BaseModal
      isOpen={uploadModal.isOpen}
      title={documentItem ? `Upload ${documentItem.label}` : "Upload Document"}
      description="Choose a file, preview it, and crop images before saving."
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {!hasPreview && (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-cyan-400 bg-cyan-50/70 px-6 py-10 text-center transition hover:border-cyan-600 hover:bg-cyan-50">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-white text-2xl text-cyan-600 shadow-sm">
              <FiUploadCloud />
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Choose document file
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Images and PDF are allowed. Files above 5MB will be rejected.
            </p>

            <input
              type="file"
              accept={documentItem?.accept}
              onChange={(event) => onChooseFile(event.target.files?.[0])}
              className="hidden"
            />
          </label>
        )}

        {hasPreview && uploadModal.isImage && uploadModal.imageSrc && (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Crop Image
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Drag the image and use resize before saving.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white">
                <FiRefreshCw />
                Reupload
                <input
                  type="file"
                  accept={documentItem?.accept}
                  onChange={(event) => onChooseFile(event.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative h-80 overflow-hidden rounded-md bg-slate-950">
              <Cropper
                image={uploadModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={documentItem?.key === "photo" ? 1 : 1.6}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) =>
                  setCroppedAreaPixels(croppedPixels)
                }
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                Resize
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-44 accent-cyan-600"
                />
              </label>

              <div className="text-xs font-medium text-slate-500">
                {uploadModal.fileName}
                {uploadModal.fileSize && ` • ${uploadModal.fileSize}`}
              </div>
            </div>
          </div>
        )}

        {hasPreview && !uploadModal.isImage && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-xl text-slate-500 shadow-sm">
                  <FiFileText />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {uploadModal.fileName || "Selected file"}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {uploadModal.fileSize || "PDF or document file"}
                  </p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white">
                <FiRefreshCw />
                Reupload
                <input
                  type="file"
                  accept={documentItem?.accept}
                  onChange={(event) => onChooseFile(event.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {!hasPreview && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-slate-400">
            <FiImage className="mx-auto text-3xl" />
            <p className="mt-2 text-sm font-medium">No file selected yet.</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave />
            Save Document
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DocumentUploadModal;
