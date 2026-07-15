import { useEffect, useState } from "react";
import {
  FiCreditCard,
  FiFileText,
  FiRefreshCw,
  FiSave,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import BaseModal from "./BaseModal";
import { apiDebugRequest } from "../../utils/apiDebugger";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const isAllowedFile = (file) => {
  const fileName = file.name.toLowerCase();

  return (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv")
  );
};

const formatFileSize = (size) => {
  if (!size) return "";

  const sizeInMb = size / 1024 / 1024;

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const RfidUploadModal = ({
  isOpen,
  onClose,
  ownerType = "student",
  ownerId = "",
  ownerName = "",
  currentRfid = "",
  apiModule = "rfid",
  apiAction = "upload-rfid",
  onSaved,
}) => {
  const [rfidValue, setRfidValue] = useState("");
  const [rfidFile, setRfidFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setRfidValue(currentRfid || "");
    setRfidFile(null);
    setIsSaving(false);
  }, [isOpen, currentRfid]);

  const handleChooseFile = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Files above 5MB will be rejected.");
      return;
    }

    if (!isAllowedFile(file)) {
      toast.error("Only CSV, XLS, or XLSX files are allowed.");
      return;
    }

    setRfidFile(file);
  };

  const handleRemoveFile = () => {
    setRfidFile(null);
  };

  const handleSave = async () => {
    const cleanedRfid = rfidValue.trim();

    if (!cleanedRfid && !rfidFile) {
      toast.error("Enter RFID or upload an RFID file.");
      return;
    }

    setIsSaving(true);

    await apiDebugRequest({
      module: apiModule,
      action: apiAction,
      method: "POST",
      payload: {
        ownerType,
        ownerId,
        ownerName,
        previousRfid: currentRfid,
        rfid: cleanedRfid,
        file: rfidFile,
        fileName: rfidFile?.name || "",
        fileSize: rfidFile?.size || "",
        fileType: rfidFile?.type || "",
        uploadedAt: new Date().toISOString(),
      },
    });

    onSaved?.({
      ownerType,
      ownerId,
      ownerName,
      rfid: cleanedRfid,
      file: rfidFile,
    });

    toast.success("RFID saved successfully.");
    setIsSaving(false);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Upload RFID"
      description={`Assign or update RFID for ${ownerName || ownerType}.`}
      onClose={isSaving ? () => {} : onClose}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
              <FiCreditCard />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {ownerName || "Selected record"}
              </p>
              <p className="text-xs font-medium text-slate-500">
                {ownerType} ID: {ownerId || "-"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            RFID Number
          </label>

          <div className="relative">
            <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={rfidValue}
              disabled={isSaving}
              onChange={(event) => setRfidValue(event.target.value)}
              placeholder="Scan or enter RFID number"
              className="h-12 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            You can scan the RFID card or type the RFID manually.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-cyan-300 bg-cyan-50/60 px-6 py-8 text-center transition hover:border-cyan-500 hover:bg-cyan-50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-white text-xl text-cyan-600 shadow-sm">
            <FiUploadCloud />
          </div>

          <p className="text-sm font-medium text-slate-900">
            Upload RFID file
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            CSV, XLS, or XLSX only. Max file size is 5MB.
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            disabled={isSaving}
            onChange={(event) => handleChooseFile(event.target.files?.[0])}
            className="hidden"
          />
        </label>

        {rfidFile && (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500">
                  <FiFileText />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {rfidFile.name}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {formatFileSize(rfidFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleRemoveFile}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                title="Remove file"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save RFID
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default RfidUploadModal;