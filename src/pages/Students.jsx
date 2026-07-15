import { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCreditCard,
  FiEdit2,
  FiEye,
  FiGrid,
  FiHash,
  FiList,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import StudentModal from "../components/modals/StudentModal";
import ImportStudentModal from "../components/modals/ImportStudentModal";
import { apiDebugRequest } from "../utils/apiDebugger";

const studentStatusOptions = ["Enrolled", "Unenrolled", "Inactive"];

const defaultStudentForm = {
  studentId: "",
  rfid: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gradeLevel: "",
  section: "",
  birthDate: "",
  guardianName: "",
  guardianContact: "",
  address: "",
  status: "Enrolled",
  photoFile: null,
  photoPreview: "",
  photoRemoved: false,
};

const initialStudents = [
  {
    id: 1,
    studentId: "STD-0001",
    rfid: "RFID-000001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    gradeLevel: "Grade 7",
    section: "A",
    birthDate: "2013-05-10",
    guardianName: "Maria Dela Cruz",
    guardianContact: "09123456789",
    address: "Cagayan de Oro City",
    status: "Enrolled",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 2,
    studentId: "STD-0002",
    rfid: "RFID-000002",
    firstName: "Ana",
    middleName: "",
    lastName: "Santos",
    gradeLevel: "Grade 8",
    section: "B",
    birthDate: "2012-03-18",
    guardianName: "Pedro Santos",
    guardianContact: "09987654321",
    address: "Misamis Oriental",
    status: "Enrolled",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 3,
    studentId: "STD-0003",
    rfid: "RFID-000003",
    firstName: "Carlo",
    middleName: "",
    lastName: "Reyes",
    gradeLevel: "Grade 11",
    section: "STEM A",
    birthDate: "2010-08-22",
    guardianName: "",
    guardianContact: "",
    address: "",
    status: "Unenrolled",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
  {
    id: 4,
    studentId: "STD-0004",
    rfid: "RFID-000004",
    firstName: "Mark",
    middleName: "",
    lastName: "Villanueva",
    gradeLevel: "Grade 9",
    section: "C",
    birthDate: "2011-11-14",
    guardianName: "",
    guardianContact: "",
    address: "",
    status: "Inactive",
    photoFile: null,
    photoPreview: "",
    photoRemoved: false,
  },
];

const getStudentDisplayName = (student) => {
  return `${student.lastName}, ${student.firstName}`;
};

const getInitials = (student) => {
  const firstInitial = student.firstName?.[0] || "";
  const lastInitial = student.lastName?.[0] || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (studentId) => {
  return avatarStyles[studentId % avatarStyles.length];
};

const getNextStatus = (currentStatus) => {
  if (currentStatus === "Enrolled") return "Unenrolled";
  if (currentStatus === "Unenrolled") return "Inactive";
  return "Enrolled";
};

const getStatusRank = (status) => {
  if (status === "Enrolled") return 1;
  if (status === "Unenrolled") return 2;
  return 3;
};

const formatFileSize = (file) => {
  const sizeInMb = file.size / 1024 / 1024;

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(file.size / 1024))} KB`;
};

const isExcelFile = (file) => {
  const validExtensions = [".xlsx", ".xls"];

  return validExtensions.some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );
};

const Students = () => {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [movingStudentId, setMovingStudentId] = useState(null);
  const [poppedStudentId, setPoppedStudentId] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFiles, setImportFiles] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState(defaultStudentForm);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        getStudentDisplayName(student).toLowerCase().includes(searchValue) ||
        student.studentId.toLowerCase().includes(searchValue) ||
        student.rfid.toLowerCase().includes(searchValue) ||
        student.gradeLevel.toLowerCase().includes(searchValue) ||
        student.section.toLowerCase().includes(searchValue) ||
        student.guardianName.toLowerCase().includes(searchValue) ||
        student.guardianContact.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const displayedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const statusSort = getStatusRank(a.status) - getStatusRank(b.status);

      if (statusSort !== 0) return statusSort;

      return getStudentDisplayName(a).localeCompare(getStudentDisplayName(b));
    });
  }, [filteredStudents]);

  const enrolledStudents = students.filter(
    (student) => student.status === "Enrolled",
  ).length;

  const unenrolledStudents = students.filter(
    (student) => student.status === "Unenrolled",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  const allDisplayedSelected =
    displayedStudents.length > 0 &&
    displayedStudents.every((student) =>
      selectedStudentIds.includes(student.id),
    );

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    if (isImporting) return;

    setIsImportModalOpen(false);
    setImportFiles([]);
    setImportProgress(0);
  };

  const handleChooseImportFiles = (fileList) => {
    const selectedFiles = Array.from(fileList || []);

    if (selectedFiles.length === 0) return;

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (isExcelFile(file)) {
        validFiles.push({
          tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: formatFileSize(file),
          type: file.type || "Excel File",
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error("Only .xlsx and .xls files are allowed.");
    }

    if (validFiles.length === 0) return;

    setImportFiles((current) => {
      const existingKeys = new Set(
        current.map((item) => `${item.name}-${item.file.size}`),
      );

      const newFiles = validFiles.filter(
        (item) => !existingKeys.has(`${item.name}-${item.file.size}`),
      );

      return [...current, ...newFiles];
    });
  };

  const handleRemoveImportFile = (tempId) => {
    setImportFiles((current) =>
      current.filter((item) => item.tempId !== tempId),
    );
  };

  const handleImportStudents = async () => {
    if (importFiles.length === 0) {
      toast.error("Please select at least one Excel file.");
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const progressTimer = window.setInterval(() => {
      setImportProgress((current) => {
        if (current >= 90) return current;
        return current + 10;
      });
    }, 250);

    await apiDebugRequest({
      module: "student",
      action: "import-excel",
      method: "POST",
      payload: {
        files: importFiles.map((item) => ({
          fileName: item.name,
          fileSize: item.size,
          fileType: item.type,
        })),
        totalFiles: importFiles.length,
        note: "Backend should replace this debug request with FormData upload. Append each file using the field name studentsExcelFiles.",
      },
    });

    window.clearInterval(progressTimer);
    setImportProgress(100);

    window.setTimeout(() => {
      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportFiles([]);
      setImportProgress(0);
      toast.success("Student Excel import request sent.");
    }, 500);
  };

  const openEditStudentModal = (student) => {
    setEditingStudent(student);

    setStudentForm({
      studentId: student.studentId,
      rfid: student.rfid,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gradeLevel: student.gradeLevel,
      section: student.section,
      birthDate: student.birthDate,
      guardianName: student.guardianName,
      guardianContact: student.guardianContact,
      address: student.address,
      status: student.status,
      photoFile: null,
      photoPreview: student.photoPreview || "",
      photoRemoved: false,
    });

    setIsStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    setStudentForm(defaultStudentForm);
  };

  const handleViewStudent = async (student) => {
    await apiDebugRequest({
      module: "student",
      action: "view",
      method: "GET",
      payload: {
        id: student.id,
        studentId: student.studentId,
      },
    });

    Swal.fire({
      title: getStudentDisplayName(student),
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.8;">
          <p><b>Student ID:</b> ${student.studentId}</p>
          <p><b>RFID:</b> ${student.rfid || "-"}</p>
          <p><b>Class:</b> ${student.gradeLevel} - ${student.section}</p>
          <p><b>Birth Date:</b> ${student.birthDate || "-"}</p>
          <p><b>Guardian:</b> ${student.guardianName || "-"}</p>
          <p><b>Guardian Contact:</b> ${student.guardianContact || "-"}</p>
          <p><b>Address:</b> ${student.address || "-"}</p>
          <p><b>Status:</b> ${student.status}</p>
        </div>
      `,
      confirmButtonColor: "#0891b2",
    });
  };

  const handleToggleSelect = (studentId) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }

      return [...current, studentId];
    });
  };

  const handleSelectAllDisplayed = () => {
    if (allDisplayedSelected) {
      const displayedIds = displayedStudents.map((student) => student.id);

      setSelectedStudentIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedStudentIds((current) => {
      const nextIds = [...current];

      displayedStudents.forEach((student) => {
        if (!nextIds.includes(student.id)) {
          nextIds.push(student.id);
        }
      });

      return nextIds;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    const selectedStudents = students.filter((student) =>
      selectedStudentIds.includes(student.id),
    );

    const result = await Swal.fire({
      title: "Delete selected students?",
      text: `${selectedStudents.length} student record(s) will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "student",
      action: "bulk-delete",
      method: "DELETE",
      payload: {
        ids: selectedStudentIds,
        students: selectedStudents.map((student) => ({
          id: student.id,
          studentId: student.studentId,
          displayName: getStudentDisplayName(student),
        })),
      },
    });

    setStudents((current) =>
      current.filter((student) => !selectedStudentIds.includes(student.id)),
    );

    setSelectedStudentIds([]);
    toast.success("Selected students deleted successfully.");
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    const cleanedData = {
      ...studentForm,
      studentId: studentForm.studentId.trim(),
      rfid: studentForm.rfid.trim(),
      firstName: studentForm.firstName.trim(),
      middleName: studentForm.middleName.trim(),
      lastName: studentForm.lastName.trim(),
      gradeLevel: studentForm.gradeLevel.trim(),
      section: studentForm.section.trim(),
      birthDate: studentForm.birthDate,
      guardianName: studentForm.guardianName.trim(),
      guardianContact: studentForm.guardianContact.trim(),
      address: studentForm.address.trim(),
    };

    if (
      !cleanedData.studentId ||
      !cleanedData.rfid ||
      !cleanedData.firstName ||
      !cleanedData.lastName ||
      !cleanedData.gradeLevel ||
      !cleanedData.section
    ) {
      toast.error("Please complete all required student details.");
      return;
    }

    const duplicateStudentId = students.some((student) => {
      const sameStudentId =
        student.studentId.toLowerCase() === cleanedData.studentId.toLowerCase();

      if (editingStudent) {
        return sameStudentId && student.id !== editingStudent.id;
      }

      return sameStudentId;
    });

    if (duplicateStudentId) {
      toast.error("Student ID already exists.");
      return;
    }

    const duplicateRfid = students.some((student) => {
      const sameRfid =
        student.rfid.toLowerCase() === cleanedData.rfid.toLowerCase();

      if (editingStudent) {
        return sameRfid && student.id !== editingStudent.id;
      }

      return sameRfid;
    });

    if (duplicateRfid) {
      toast.error("RFID already exists.");
      return;
    }

    const apiPayload = {
      studentId: cleanedData.studentId,
      rfid: cleanedData.rfid,
      firstName: cleanedData.firstName,
      middleName: cleanedData.middleName,
      lastName: cleanedData.lastName,
      displayName: `${cleanedData.lastName}, ${cleanedData.firstName}`,
      gradeLevel: cleanedData.gradeLevel,
      section: cleanedData.section,
      birthDate: cleanedData.birthDate,
      guardianName: cleanedData.guardianName,
      guardianContact: cleanedData.guardianContact,
      address: cleanedData.address,
      status: cleanedData.status,
      studentPhoto: cleanedData.photoFile,
      photoRemoved: cleanedData.photoRemoved,
    };

    if (editingStudent) {
      const payload = {
        id: editingStudent.id,
        ...apiPayload,
      };

      await apiDebugRequest({
        module: "student",
        action: "update",
        method: "PUT",
        payload,
      });

      setStudents((current) =>
        current.map((student) =>
          student.id === editingStudent.id
            ? {
                ...student,
                ...cleanedData,
              }
            : student,
        ),
      );

      toast.success("Student updated successfully.");
      closeStudentModal();
    }
  };

  const handleDeleteStudent = async (student) => {
    const result = await Swal.fire({
      title: "Delete student?",
      text: `${getStudentDisplayName(student)} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await apiDebugRequest({
      module: "student",
      action: "delete",
      method: "DELETE",
      payload: {
        id: student.id,
        studentId: student.studentId,
        displayName: getStudentDisplayName(student),
      },
    });

    setStudents((current) =>
      current.filter((currentStudent) => currentStudent.id !== student.id),
    );

    setSelectedStudentIds((current) =>
      current.filter((id) => id !== student.id),
    );

    toast.success("Student deleted successfully.");
  };

  const handleToggleStudentStatus = async (student) => {
    if (movingStudentId) return;

    const nextStatus = getNextStatus(student.status);

    await apiDebugRequest({
      module: "student",
      action: "change-status",
      method: "PATCH",
      payload: {
        id: student.id,
        studentId: student.studentId,
        previousStatus: student.status,
        nextStatus,
      },
    });

    setMovingStudentId(student.id);

    window.setTimeout(() => {
      setStudents((current) =>
        current.map((currentStudent) =>
          currentStudent.id === student.id
            ? {
                ...currentStudent,
                status: nextStatus,
              }
            : currentStudent,
        ),
      );

      setMovingStudentId(null);
      setPoppedStudentId(student.id);

      window.setTimeout(() => {
        setPoppedStudentId(null);
      }, 450);
    }, 260);

    toast.success(`Student status changed to ${nextStatus}.`);
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Students</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage imported students, enrollment status, RFID, and class
            details.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {selectedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex w-fit items-center gap-2 rounded-md bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
            >
              <FiTrash2 />
              Delete Selected ({selectedStudentIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={openImportModal}
            className="flex w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            <FiUploadCloud />
            Import Student
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total Students" value={students.length} />
        <SummaryCard label="Enrolled" value={enrolledStudents} />
        <SummaryCard label="Unenrolled" value={unenrolledStudents} />
        <SummaryCard label="Inactive" value={inactiveStudents} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Student List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Student ID is under the name. RFID and class have separate
              columns.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, ID, RFID..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 lg:w-44"
            >
              <option value="All">All Status</option>
              {studentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex h-11 rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                  viewMode === "grid"
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiGrid />
                Cards
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                  viewMode === "table"
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FiList />
                Table
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <StudentGrid
            students={displayedStudents}
            selectedStudentIds={selectedStudentIds}
            movingStudentId={movingStudentId}
            poppedStudentId={poppedStudentId}
            onSelect={handleToggleSelect}
            onView={handleViewStudent}
            onEdit={openEditStudentModal}
            onDelete={handleDeleteStudent}
            onToggleStatus={handleToggleStudentStatus}
          />
        ) : (
          <StudentTable
            students={displayedStudents}
            selectedStudentIds={selectedStudentIds}
            movingStudentId={movingStudentId}
            poppedStudentId={poppedStudentId}
            allDisplayedSelected={allDisplayedSelected}
            onSelect={handleToggleSelect}
            onSelectAll={handleSelectAllDisplayed}
            onView={handleViewStudent}
            onEdit={openEditStudentModal}
            onDelete={handleDeleteStudent}
            onToggleStatus={handleToggleStudentStatus}
          />
        )}
      </div>

      <ImportStudentModal
        isOpen={isImportModalOpen}
        importFiles={importFiles}
        isImporting={isImporting}
        importProgress={importProgress}
        onClose={closeImportModal}
        onChooseFiles={handleChooseImportFiles}
        onRemoveImportFile={handleRemoveImportFile}
        onImport={handleImportStudents}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        editingStudent={editingStudent}
        formData={studentForm}
        setFormData={setStudentForm}
        onClose={closeStudentModal}
        onSubmit={handleStudentSubmit}
      />

      <style>
        {`
          @keyframes studentPopOut {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            100% {
              opacity: 0.35;
              transform: scale(0.96) translateY(14px);
            }
          }

          @keyframes studentPopIn {
            0% {
              opacity: 0;
              transform: scale(0.94) translateY(-10px);
            }
            70% {
              opacity: 1;
              transform: scale(1.03) translateY(0);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .student-pop-out {
            animation: studentPopOut 260ms ease-in forwards;
          }

          .student-pop-in {
            animation: studentPopIn 420ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
          }
        `}
      </style>
    </div>
  );
};

const StudentNameBlock = ({ student, inactive = false }) => {
  return (
    <div>
      <p
        className={`text-sm font-black ${
          inactive ? "text-slate-500" : "text-slate-900"
        }`}
      >
        {getStudentDisplayName(student)}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <FiHash className="shrink-0" />
        <span>{student.studentId}</span>
      </div>
    </div>
  );
};

const RfidInfo = ({ rfid }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
      <FiCreditCard className="shrink-0 text-slate-400" />
      <span>{rfid || "-"}</span>
    </div>
  );
};

const ClassInfo = ({ student }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
      <FiBookOpen className="shrink-0 text-slate-400" />
      <span>
        {student.gradeLevel} - {student.section}
      </span>
    </div>
  );
};

const StudentGrid = ({
  students,
  selectedStudentIds,
  movingStudentId,
  poppedStudentId,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (students.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {students.map((student) => {
        const isInactive = student.status === "Inactive";
        const isMoving = movingStudentId === student.id;
        const isPopped = poppedStudentId === student.id;
        const isSelected = selectedStudentIds.includes(student.id);

        return (
          <div
            key={student.id}
            className={`relative overflow-hidden rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              isSelected
                ? "border-cyan-300 ring-4 ring-cyan-50"
                : "border-slate-200"
            } ${
              isInactive ? "bg-slate-50 opacity-75" : "bg-white"
            } ${isMoving ? "student-pop-out" : ""} ${
              isPopped ? "student-pop-in" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(student.id)}
                className="h-4 w-4 cursor-pointer accent-cyan-600"
              />

              <div className="flex gap-2">
                <IconButton type="view" onClick={() => onView(student)} />
                <IconButton type="edit" onClick={() => onEdit(student)} />
                <IconButton type="delete" onClick={() => onDelete(student)} />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <StudentAvatar
                student={student}
                size="hero"
                inactive={isInactive}
              />

              <div className="mt-5 text-center">
                <StudentNameBlock student={student} inactive={isInactive} />
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-left">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                  RFID
                </p>
                <RfidInfo rfid={student.rfid} />
              </div>

              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                  Class
                </p>
                <ClassInfo student={student} />
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <StatusToggle
                status={student.status}
                disabled={Boolean(movingStudentId)}
                onClick={() => onToggleStatus(student)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StudentTable = ({
  students,
  selectedStudentIds,
  movingStudentId,
  poppedStudentId,
  allDisplayedSelected,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="w-14 px-5 py-3">
              <input
                type="checkbox"
                checked={allDisplayedSelected}
                onChange={onSelectAll}
                className="h-4 w-4 cursor-pointer accent-cyan-600"
              />
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Student
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              RFID
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Class
            </th>

            <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {students.length > 0 ? (
            students.map((student) => {
              const isInactive = student.status === "Inactive";
              const isMoving = movingStudentId === student.id;
              const isPopped = poppedStudentId === student.id;
              const isSelected = selectedStudentIds.includes(student.id);

              return (
                <tr
                  key={student.id}
                  className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                    isSelected ? "bg-cyan-50/40" : ""
                  } ${isInactive ? "bg-slate-50 opacity-75" : ""} ${
                    isMoving ? "student-pop-out" : ""
                  } ${isPopped ? "student-pop-in" : ""}`}
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(student.id)}
                      className="h-4 w-4 cursor-pointer accent-cyan-600"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <StudentAvatar student={student} inactive={isInactive} />
                      <StudentNameBlock
                        student={student}
                        inactive={isInactive}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <RfidInfo rfid={student.rfid} />
                  </td>

                  <td className="px-5 py-4">
                    <ClassInfo student={student} />
                  </td>

                  <td className="px-5 py-4">
                    <StatusButton
                      status={student.status}
                      disabled={Boolean(movingStudentId)}
                      onClick={() => onToggleStatus(student)}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <IconButton type="view" onClick={() => onView(student)} />
                      <IconButton type="edit" onClick={() => onEdit(student)} />
                      <IconButton
                        type="delete"
                        onClick={() => onDelete(student)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">
                <EmptyState />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const StudentAvatar = ({ student, size = "normal", inactive = false }) => {
  const sizeClass =
    size === "hero"
      ? "h-32 w-32 text-3xl"
      : size === "large"
        ? "h-16 w-16 text-sm"
        : "h-10 w-10 text-xs";

  if (student.photoPreview) {
    return (
      <img
        src={student.photoPreview}
        alt={getStudentDisplayName(student)}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-4 ${
          inactive ? "grayscale ring-slate-200" : "ring-slate-100"
        }`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-black ring-4 ${
        inactive
          ? "bg-slate-100 text-slate-400 ring-slate-200"
          : getAvatarStyle(student.id)
      }`}
    >
      {getInitials(student)}
    </div>
  );
};

const StatusToggle = ({ status, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Click to change status"
      className={`flex h-8 w-20 cursor-pointer items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        status === "Enrolled"
          ? "bg-emerald-500"
          : status === "Unenrolled"
            ? "bg-orange-400"
            : "bg-slate-300"
      }`}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition ${
          status === "Enrolled"
            ? "translate-x-12"
            : status === "Unenrolled"
              ? "translate-x-6"
              : "translate-x-0"
        }`}
      />
    </button>
  );
};

const StatusButton = ({ status, disabled = false, onClick }) => {
  const statusClass =
    status === "Enrolled"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : status === "Unenrolled"
        ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200";

  const dotClass =
    status === "Enrolled"
      ? "bg-emerald-500"
      : status === "Unenrolled"
        ? "bg-orange-500"
        : "bg-slate-400";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Click to change status"
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${statusClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {status}
    </button>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{value}</h2>
    </div>
  );
};

const IconButton = ({ type, onClick }) => {
  const buttonStyles = {
    view: "bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white",
    edit: "bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white",
    delete: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  const icons = {
    view: <FiEye />,
    edit: <FiEdit2 />,
    delete: <FiTrash2 />,
  };

  const labels = {
    view: "View Student",
    edit: "Edit Student",
    delete: "Delete Student",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={labels[type]}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${buttonStyles[type]}`}
    >
      {icons[type]}
    </button>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-black text-slate-900">No students found</p>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or import student records.
      </p>
    </div>
  );
};

export default Students;
