import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiHash,
  FiMoreVertical,
  FiSearch,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiDebugRequest } from "../utils/apiDebugger";

const rowsPerPageOptions = [5, 10, 25, 50];

const initialVerificationList = [
  {
    id: 1,
    registrationNumber: "EIC-2026-000008",
    firstName: "Aisha Faye",
    middleName: "",
    lastName: "Tinio",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    email: "aisha.tinio@email.com",
    mobile: "09123456789",
    levelApplied: "Grade 7",
    submittedAt: "2026-07-15",
  },
  {
    id: 2,
    registrationNumber: "EIC-2026-000006",
    firstName: "Kandice Clouie",
    middleName: "",
    lastName: "Castro",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    email: "kandice.castro@email.com",
    mobile: "09987654321",
    levelApplied: "Grade 8",
    submittedAt: "2026-07-15",
  },
  {
    id: 3,
    registrationNumber: "EIC-2026-000005",
    firstName: "Aina",
    middleName: "",
    lastName: "Penales",
    verificationStatus: "Not Verified",
    applicationStatus: "Pending",
    email: "aina.penales@email.com",
    mobile: "09012345678",
    levelApplied: "Grade 11",
    submittedAt: "2026-07-15",
  },
  {
    id: 4,
    registrationNumber: "EIC-2026-000004",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    verificationStatus: "Verified",
    applicationStatus: "Verified",
    email: "juan.delacruz@email.com",
    mobile: "09111222333",
    levelApplied: "College",
    submittedAt: "2026-07-14",
  },
];

const avatarStyles = [
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-orange-50 text-orange-700 ring-orange-100",
  "bg-pink-50 text-pink-700 ring-pink-100",
];

const getAvatarStyle = (id) => {
  return avatarStyles[id % avatarStyles.length];
};

const getApplicantName = (applicant) => {
  return `${applicant.lastName}, ${applicant.firstName}`;
};

const getInitials = (applicant) => {
  const firstInitial = applicant.firstName?.[0] || "";
  const lastInitial = applicant.lastName?.[0] || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const Verification = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState(initialVerificationList);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const closeMenu = () => setOpenMenu(null);

    if (openMenu) {
      document.addEventListener("click", closeMenu);
    }

    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, [openMenu]);

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        getApplicantName(item).toLowerCase().includes(searchValue) ||
        item.registrationNumber.toLowerCase().includes(searchValue) ||
        item.verificationStatus.toLowerCase().includes(searchValue) ||
        item.applicationStatus.toLowerCase().includes(searchValue) ||
        item.levelApplied.toLowerCase().includes(searchValue) ||
        item.email.toLowerCase().includes(searchValue) ||
        item.mobile.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || item.applicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const displayedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (a.applicationStatus !== b.applicationStatus) {
        if (a.applicationStatus === "Pending") return -1;
        if (b.applicationStatus === "Pending") return 1;
      }

      return getApplicantName(a).localeCompare(getApplicantName(b));
    });
  }, [filteredApplications]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedApplications.length / rowsPerPage),
  );

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedApplications = displayedApplications.slice(
    startIndex,
    endIndex,
  );

  const showingStart = displayedApplications.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, displayedApplications.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const allDisplayedSelected =
    paginatedApplications.length > 0 &&
    paginatedApplications.every((item) => selectedIds.includes(item.id));

  const pendingCount = applications.filter(
    (item) => item.applicationStatus === "Pending",
  ).length;

  const verifiedCount = applications.filter(
    (item) => item.applicationStatus === "Verified",
  ).length;

  const handleOpenMenu = (event, item) => {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    setOpenMenu({
      id: item.id,
      item,
      top: rect.bottom + 8,
      left: rect.right - 180,
    });
  };

  const handleSelect = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((itemId) => itemId !== id);
      }

      return [...current, id];
    });
  };

  const handleSelectAll = () => {
    if (allDisplayedSelected) {
      const displayedIds = paginatedApplications.map((item) => item.id);

      setSelectedIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedIds((current) => {
      const nextIds = [...current];

      paginatedApplications.forEach((item) => {
        if (!nextIds.includes(item.id)) {
          nextIds.push(item.id);
        }
      });

      return nextIds;
    });
  };

  const handleView = async (item) => {
    setOpenMenu(null);

    await apiDebugRequest({
      module: "enrollment-verification",
      action: "view-details-page",
      method: "GET",
      payload: {
        id: item.id,
        registrationNumber: item.registrationNumber,
      },
    });

    navigate(`/enrollment/verification/${item.registrationNumber}`);
  };

  const handleMarkVerified = async (item) => {
    setOpenMenu(null);

    await apiDebugRequest({
      module: "enrollment-verification",
      action: "mark-verified",
      method: "PATCH",
      payload: {
        id: item.id,
        registrationNumber: item.registrationNumber,
        previousStatus: item.applicationStatus,
        nextStatus: "Verified",
      },
    });

    setApplications((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              verificationStatus: "Verified",
              applicationStatus: "Verified",
            }
          : currentItem,
      ),
    );

    toast.success("Application marked as verified.");
  };

  const handleSetPending = async (item) => {
    setOpenMenu(null);

    await apiDebugRequest({
      module: "enrollment-verification",
      action: "set-pending",
      method: "PATCH",
      payload: {
        id: item.id,
        registrationNumber: item.registrationNumber,
        previousStatus: item.applicationStatus,
        nextStatus: "Pending",
      },
    });

    setApplications((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              verificationStatus: "Not Verified",
              applicationStatus: "Pending",
            }
          : currentItem,
      ),
    );

    toast.success("Application moved back to pending.");
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one application.");
      return;
    }

    const selectedApplications = applications.filter((item) =>
      selectedIds.includes(item.id),
    );

    await apiDebugRequest({
      module: "enrollment-verification",
      action: "bulk-verify",
      method: "PATCH",
      payload: {
        ids: selectedIds,
        applications: selectedApplications.map((item) => ({
          id: item.id,
          registrationNumber: item.registrationNumber,
          name: getApplicantName(item),
        })),
      },
    });

    setApplications((current) =>
      current.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              verificationStatus: "Verified",
              applicationStatus: "Verified",
            }
          : item,
      ),
    );

    setSelectedIds([]);
    toast.success("Selected applications marked as verified.");
  };

  return (
    <div data-aos="fade-up" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Enrollment Verification
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review pending applications and mark verified applicants.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleBulkVerify}
            className="flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <FiUserCheck />
            Verify Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Total Applications" value={applications.length} />
        <SummaryCard label="Pending" value={pendingCount} />
        <SummaryCard label="Verified" value={verifiedCount} />
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Verification List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Applicant name, registration number, status, and action.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search applicant, registration..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 lg:w-44"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
            </select>
          </div>
        </div>

        <VerificationTable
          applications={paginatedApplications}
          selectedIds={selectedIds}
          allDisplayedSelected={allDisplayedSelected}
          openMenu={openMenu}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onOpenMenu={handleOpenMenu}
          onView={handleView}
          onMarkVerified={handleMarkVerified}
          onSetPending={handleSetPending}
        />

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={displayedApplications.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onRowsPerPageChange={setRowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

const VerificationTable = ({
  applications,
  selectedIds,
  allDisplayedSelected,
  openMenu,
  onSelect,
  onSelectAll,
  onOpenMenu,
  onView,
  onMarkVerified,
  onSetPending,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
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

              <TableHeader label="Applicant" />
              <TableHeader label="Registration Number" />
              <TableHeader label="Level" />
              <TableHeader label="Submitted" />
              <TableHeader label="Status" />

              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {applications.length > 0 ? (
              applications.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      isSelected ? "bg-cyan-50/40" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(item.id)}
                        className="h-4 w-4 cursor-pointer accent-cyan-600"
                      />
                    </td>

                    <td className="px-5 py-4">
                      <ApplicantBlock applicant={item} />
                    </td>

                    <td className="px-5 py-4">
                      <RegistrationNumber value={item.registrationNumber} />
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {item.levelApplied || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {item.submittedAt || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <ApplicationStatus status={item.applicationStatus} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          title="View Application"
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => onOpenMenu(event, item)}
                          title="More Actions"
                          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                            openMenu?.id === item.id
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <FiMoreVertical />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7">
                  <EmptyState />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openMenu && (
        <ActionDropdown
          menu={openMenu}
          onMarkVerified={onMarkVerified}
          onSetPending={onSetPending}
        />
      )}
    </>
  );
};

const ActionDropdown = ({ menu, onMarkVerified, onSetPending }) => {
  return createPortal(
    <div
      onClick={(event) => event.stopPropagation()}
      className="fixed z-[99999] w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl"
      style={{
        top: `${menu.top}px`,
        left: `${Math.max(menu.left, 12)}px`,
      }}
    >
      <button
        type="button"
        onClick={() => onMarkVerified(menu.item)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
      >
        <FiCheckCircle />
        Mark Verified
      </button>

      <button
        type="button"
        onClick={() => onSetPending(menu.item)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <FiClock />
        Set Pending
      </button>
    </div>,
    document.body,
  );
};

const ApplicantBlock = ({ applicant }) => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4 ${getAvatarStyle(
          applicant.id,
        )}`}
      >
        {getInitials(applicant)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {getApplicantName(applicant)}
        </p>

        <VerificationBadge status={applicant.verificationStatus} />
      </div>
    </div>
  );
};

const VerificationBadge = ({ status }) => {
  const isVerified = status === "Verified";

  return (
    <span
      className={`mt-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium ${
        isVerified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isVerified ? (
        <FiCheckCircle className="text-emerald-600" />
      ) : (
        <FiShield className="text-slate-500" />
      )}
      {status}
    </span>
  );
};

const RegistrationNumber = ({ value }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
      <FiHash className="shrink-0 text-slate-400" />
      <span>{value}</span>
    </div>
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

const PaginationFooter = ({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  showingStart,
  showingEnd,
  onRowsPerPageChange,
  onPageChange,
}) => {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Show</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="text-sm text-slate-500">entries</span>
        </div>

        <p className="text-sm text-slate-500">
          Showing {showingStart} to {showingEnd} of {totalRows} applications
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronLeft />
          Prev
        </button>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </th>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{value}</h2>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-semibold text-slate-900">No applications found</p>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or status filter.
      </p>
    </div>
  );
};

export default Verification;
