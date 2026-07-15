import { FiFileText, FiUploadCloud, FiX } from "react-icons/fi";
import BaseModal from "./BaseModal";

const ImportStudentModal = ({
  isOpen,
  importFiles,
  isImporting,
  importProgress,
  onClose,
  onChooseFiles,
  onRemoveImportFile,
  onImport,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      title="Import Students"
      description="Upload one Excel file or multiple Excel files for student import."
      onClose={isImporting ? () => {} : onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-cyan-500 hover:bg-cyan-50">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-white text-2xl text-cyan-600 shadow-sm">
            <FiUploadCloud />
          </div>

          <p className="text-sm font-black text-slate-900">
            Choose Excel file or files
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Accepted file types: .xlsx and .xls. You can upload multiple files.
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            multiple
            disabled={isImporting}
            onChange={(event) => onChooseFiles(event.target.files)}
            className="hidden"
          />
        </label>

        {importFiles.length > 0 && (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
              <p className="text-sm font-black text-slate-900">
                Selected Excel Files
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {importFiles.length} Excel{" "}
                {importFiles.length === 1 ? "file" : "files"} ready to import.
              </p>
            </div>

            <div className="max-h-64 divide-y divide-slate-200 overflow-y-auto">
              {importFiles.map((item) => (
                <div
                  key={item.tempId}
                  className="flex items-center justify-between gap-4 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-xl text-emerald-600">
                      <FiFileText />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {item.size}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={() => onRemoveImportFile(item.tempId)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    title="Remove Excel file"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isImporting && (
          <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-cyan-800">
                  Importing Students
                </p>
                <p className="text-xs font-semibold text-cyan-700">
                  Please wait while the selected Excel files are being uploaded.
                </p>
              </div>

              <span className="text-sm font-black text-cyan-800">
                {importProgress}%
              </span>
            </div>

            <div className="h-3 rounded-full bg-white">
              <div
                className="h-3 rounded-full bg-cyan-600 transition-all duration-200"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="rounded-md bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onImport}
            disabled={isImporting || importFiles.length === 0}
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Import Students"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ImportStudentModal;
