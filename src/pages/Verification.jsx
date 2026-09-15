import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../lib/api";

/* =========================================================
   API

   Change this only if your backend uses another route.
========================================================= */

const VERIFICATION_API_PATH = "/enrollment/verification";

const verificationApi = {
  list: VERIFICATION_API_PATH,

  status: (id) => `${VERIFICATION_API_PATH}/${encodeURIComponent(id)}/status`,

  bulkVerify: `${VERIFICATION_API_PATH}/bulk-verify`,
};

/* =========================================================
   PAGINATION
========================================================= */

const rowsPerPageOptions = [5, 10, 25, 50];

/* =========================================================
   HELPERS
========================================================= */

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const normalizeApplicationStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (
    status === "verified" ||
    status === "approved" ||
    status === "complete" ||
    status === "completed"
  ) {
    return "Verified";
  }

  return "Pending";
};

const normalizeVerificationStatus = (value, applicationStatus) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (status === "verified" || applicationStatus === "Verified") {
    return "Verified";
  }

  return "Not Verified";
};

const normalizeApplication = (item = {}) => {
  const applicant =
    item.applicant || item.student || item.user || item.profile || {};

  const source = {
    ...applicant,
    ...item,
  };

  const applicationStatus = normalizeApplicationStatus(
    source.applicationStatus ?? source.application_status ?? source.status,
  );

  const firstName =
    source.firstName ?? source.first_name ?? source.firstname ?? "";

  const middleName =
    source.middleName ?? source.middle_name ?? source.middlename ?? "";

  const lastName = source.lastName ?? source.last_name ?? source.lastname ?? "";

  const fullName = source.fullName ?? source.full_name ?? source.name ?? "";

  const registrationNumber =
    source.registrationNumber ??
    source.registration_number ??
    source.registrationNo ??
    source.registration_no ??
    source.referenceNumber ??
    source.reference_number ??
    "";

  return {
    id:
      source.id ??
      source.applicationId ??
      source.application_id ??
      source.registrationId ??
      source.registration_id ??
      registrationNumber,

    registrationNumber,

    firstName,
    middleName,
    lastName,
    fullName,

    verificationStatus: normalizeVerificationStatus(
      source.verificationStatus ?? source.verification_status,
      applicationStatus,
    ),

    applicationStatus,

    email: source.email ?? source.emailAddress ?? source.email_address ?? "",

    mobile:
      source.mobile ??
      source.mobileNumber ??
      source.mobile_number ??
      source.phone ??
      source.contactNumber ??
      source.contact_number ??
      "",

    levelApplied:
      source.levelApplied ??
      source.level_applied ??
      source.gradeLevel ??
      source.grade_level ??
      source.level ??
      "",

    submittedAt:
      source.submittedAt ??
      source.submitted_at ??
      source.createdAt ??
      source.created_at ??
      "",
  };
};

const extractApplications = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload.map(normalizeApplication);
  }

  const candidates = [
    payload?.applications,
    payload?.items,
    payload?.records,
    payload?.results,
    payload?.rows,
    payload?.data,
  ];

  const list = candidates.find((candidate) => Array.isArray(candidate));

  if (!list) {
    return [];
  }

  return list.map(normalizeApplication);
};

const extractApplication = (response) => {
  const payload =
    response?.data?.data ??
    response?.data?.application ??
    response?.data?.item ??
    response?.data;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return normalizeApplication(payload);
};

const getApplicantName = (applicant) => {
  if (applicant.fullName) {
    return applicant.fullName;
  }

  const firstName = String(applicant.firstName || "").trim();

  const middleName = String(applicant.middleName || "").trim();

  const lastName = String(applicant.lastName || "").trim();

  const givenName = [firstName, middleName].filter(Boolean).join(" ");

  if (lastName && givenName) {
    return `${lastName}, ${givenName}`;
  }

  return [firstName, middleName, lastName].filter(Boolean).join(" ") || "-";
};

const getInitials = (applicant) => {
  const name = getApplicantName(applicant);

  if (!name || name === "-") {
    return "?";
  }

  const first = applicant.firstName?.[0] || applicant.fullName?.[0] || "";

  const last =
    applicant.lastName?.[0] ||
    applicant.fullName?.trim()?.split(" ")?.at(-1)?.[0] ||
    "";

  return `${first}${last}`.toUpperCase();
};

const formatSubmittedDate = (value) => {
  if (!value) {
    return "-";
  }

  const rawValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

/* =========================================================
   COMPONENT
========================================================= */

const Verification = () => {
  const navigate = useNavigate();

  const requestIdRef = useRef(0);

  const [applications, setApplications] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [pendingActionId, setPendingActionId] = useState(null);

  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [openMenu, setOpenMenu] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* =======================================================
     LOAD APPLICATIONS
  ======================================================= */

  const loadApplications = useCallback(async ({ showSkeleton = true } = {}) => {
    const requestId = ++requestIdRef.current;

    if (showSkeleton) {
      setIsLoading(true);
    }

    try {
      const response = await api.get(verificationApi.list);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const records = extractApplications(response);

      setApplications(records);
      setSelectedIds([]);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setApplications([]);

      toast.error(
        getApiErrorMessage(error, "Unable to load verification applications."),
      );
    } finally {
      if (requestId === requestIdRef.current && showSkeleton) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadApplications();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadApplications]);

  /* =======================================================
     CLOSE ACTION MENU
  ======================================================= */

  useEffect(() => {
    const closeMenu = () => {
      setOpenMenu(null);
    };

    if (openMenu) {
      document.addEventListener("click", closeMenu);

      window.addEventListener("resize", closeMenu);

      window.addEventListener("scroll", closeMenu, true);
    }

    return () => {
      document.removeEventListener("click", closeMenu);

      window.removeEventListener("resize", closeMenu);

      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openMenu]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((item) => {
      const searchableValues = [
        getApplicantName(item),
        item.registrationNumber,
        item.verificationStatus,
        item.applicationStatus,
        item.levelApplied,
        item.email,
        item.mobile,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "All" || item.applicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  /* =======================================================
     SORT

     Pending stays on top.
  ======================================================= */

  const displayedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (a.applicationStatus !== b.applicationStatus) {
        if (a.applicationStatus === "Pending") {
          return -1;
        }

        if (b.applicationStatus === "Pending") {
          return 1;
        }
      }

      return getApplicantName(a).localeCompare(getApplicantName(b));
    });
  }, [filteredApplications]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(displayedApplications.length / rowsPerPage),
  );

  const startIndex = (currentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedApplications = useMemo(() => {
    return displayedApplications.slice(startIndex, endIndex);
  }, [displayedApplications, startIndex, endIndex]);

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

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    const pending = applications.filter(
      (item) => item.applicationStatus === "Pending",
    ).length;

    const verified = applications.filter(
      (item) => item.applicationStatus === "Verified",
    ).length;

    return {
      total: applications.length,
      pending,
      verified,
    };
  }, [applications]);

  /* =======================================================
     SELECTION
  ======================================================= */

  const allDisplayedSelected =
    paginatedApplications.length > 0 &&
    paginatedApplications.every((item) => selectedIds.includes(item.id));

  const handleSelect = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((itemId) => itemId !== id);
      }

      return [...current, id];
    });
  };

  const handleSelectAll = () => {
    const displayedIds = paginatedApplications.map((item) => item.id);

    if (allDisplayedSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !displayedIds.includes(id)),
      );

      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      displayedIds.forEach((id) => {
        next.add(id);
      });

      return Array.from(next);
    });
  };

  /* =======================================================
     ACTION MENU
  ======================================================= */

  const handleOpenMenu = (event, item) => {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 180;

    let left = rect.right - menuWidth;

    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    setOpenMenu((current) => {
      if (current?.id === item.id) {
        return null;
      }

      return {
        id: item.id,
        item,
        top: rect.bottom + 8,
        left: Math.max(left, 12),
      };
    });
  };

  /* =======================================================
     VIEW
  ======================================================= */

  const handleView = (item) => {
    setOpenMenu(null);

    if (!item.registrationNumber) {
      toast.error("Registration number is missing.");

      return;
    }

    navigate(
      `/enrollment/verification/${encodeURIComponent(item.registrationNumber)}`,
      {
        state: {
          application: item,
        },
      },
    );
  };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleUpdateStatus = async (item, nextStatus) => {
    if (pendingActionId || isBulkSaving) {
      return;
    }

    if (!item?.id) {
      toast.error(
        "Unable to update this application because the application ID is missing.",
      );

      return;
    }

    setOpenMenu(null);
    setPendingActionId(item.id);

    const verificationStatus =
      nextStatus === "Verified" ? "Verified" : "Not Verified";

    try {
      const response = await api.patch(verificationApi.status(item.id), {
        status: nextStatus,

        applicationStatus: nextStatus,

        verificationStatus,
      });

      const returnedApplication = extractApplication(response);

      setApplications((current) =>
        current.map((currentApplication) => {
          if (String(currentApplication.id) !== String(item.id)) {
            return currentApplication;
          }

          if (returnedApplication?.id) {
            return {
              ...currentApplication,
              ...returnedApplication,
            };
          }

          return {
            ...currentApplication,
            applicationStatus: nextStatus,
            verificationStatus,
          };
        }),
      );

      toast.success(
        response?.data?.message ||
          (nextStatus === "Verified"
            ? "Application marked as verified."
            : "Application moved back to pending."),
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to update application status."),
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleMarkVerified = (item) => {
    handleUpdateStatus(item, "Verified");
  };

  const handleSetPending = (item) => {
    handleUpdateStatus(item, "Pending");
  };

  /* =======================================================
     BULK VERIFY
  ======================================================= */

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one application.");

      return;
    }

    if (isBulkSaving || pendingActionId) {
      return;
    }

    setIsBulkSaving(true);

    try {
      const response = await api.patch(verificationApi.bulkVerify, {
        ids: selectedIds,
        status: "Verified",
        applicationStatus: "Verified",
        verificationStatus: "Verified",
      });

      const selectedSet = new Set(selectedIds.map(String));

      const returnedApplications = extractApplications(response);

      if (returnedApplications.length > 0) {
        const returnedMap = new Map(
          returnedApplications.map((item) => [String(item.id), item]),
        );

        setApplications((current) =>
          current.map((item) => {
            const updated = returnedMap.get(String(item.id));

            if (updated) {
              return {
                ...item,
                ...updated,
              };
            }

            if (selectedSet.has(String(item.id))) {
              return {
                ...item,
                applicationStatus: "Verified",
                verificationStatus: "Verified",
              };
            }

            return item;
          }),
        );
      } else {
        setApplications((current) =>
          current.map((item) =>
            selectedSet.has(String(item.id))
              ? {
                  ...item,
                  applicationStatus: "Verified",
                  verificationStatus: "Verified",
                }
              : item,
          ),
        );
      }

      setSelectedIds([]);

      toast.success(
        response?.data?.message || "Selected applications marked as verified.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to verify the selected applications.",
        ),
      );
    } finally {
      setIsBulkSaving(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      {isLoading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-5 [font-family:'Poppins',sans-serif]">
          {/* ===============================================
              HEADER
          =============================================== */}

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <h1 className="text-2xl font-medium text-slate-950">
              Enrollment Verification
            </h1>

            {selectedIds.length > 0 && (
              <button
                type="button"
                disabled={isBulkSaving || Boolean(pendingActionId)}
                onClick={handleBulkVerify}
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiUserCheck />

                {isBulkSaving
                  ? "Verifying..."
                  : `Verify Selected (${selectedIds.length})`}
              </button>
            )}
          </div>

          {/* ===============================================
              SUMMARY
          =============================================== */}

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="Total Applications" value={summary.total} />

            <SummaryCard label="Pending" value={summary.pending} />

            <SummaryCard label="Verified" value={summary.verified} />
          </div>

          {/* ===============================================
              TABLE CONTAINER
          =============================================== */}

          <div className="overflow-hidden rounded-md bg-white shadow-sm">
            {/* FILTER */}

            <div className="border-b border-slate-100 p-4">
              <p className="text-base font-medium text-slate-900">
                Verification Applications
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search applicant, registration number, email, mobile, or level..."
                    className="h-11 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                >
                  <option value="All">All Status</option>

                  <option value="Pending">Pending</option>

                  <option value="Verified">Verified</option>
                </select>
              </div>
            </div>

            {/* TABLE */}

            <VerificationTable
              applications={paginatedApplications}
              selectedIds={selectedIds}
              allDisplayedSelected={allDisplayedSelected}
              openMenu={openMenu}
              pendingActionId={pendingActionId}
              isBulkSaving={isBulkSaving}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onOpenMenu={handleOpenMenu}
              onView={handleView}
              onMarkVerified={handleMarkVerified}
              onSetPending={handleSetPending}
            />

            {/* ===============================================
                PAGINATION
            =============================================== */}

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
      )}
    </>
  );
};

/* =========================================================
   VERIFICATION TABLE
========================================================= */

const VerificationTable = ({
  applications,
  selectedIds,
  allDisplayedSelected,
  openMenu,
  pendingActionId,
  isBulkSaving,
  searchTerm,
  statusFilter,
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
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-14 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allDisplayedSelected}
                  disabled={applications.length === 0 || isBulkSaving}
                  onChange={onSelectAll}
                  aria-label="Select all applications on this page"
                  className="h-4 w-4 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </th>

              <TableHeader label="Applicant" />

              <TableHeader label="Registration Number" />

              <TableHeader label="Level" />

              <TableHeader label="Submitted" />

              <TableHeader label="Status" />

              <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {applications.length > 0 ? (
              applications.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                const pending = String(pendingActionId) === String(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      isSelected ? "bg-cyan-50/40" : ""
                    }`}
                  >
                    {/* CHECKBOX */}

                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={pending || isBulkSaving}
                        onChange={() => onSelect(item.id)}
                        aria-label={`Select ${getApplicantName(item)}`}
                        className="h-4 w-4 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>

                    {/* APPLICANT */}

                    <td className="px-5 py-4">
                      <ApplicantBlock applicant={item} />
                    </td>

                    {/* REGISTRATION */}

                    <td className="px-5 py-4">
                      <RegistrationNumber value={item.registrationNumber} />
                    </td>

                    {/* LEVEL */}

                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      {item.levelApplied || "-"}
                    </td>

                    {/* SUBMITTED */}

                    <td className="px-5 py-4 text-sm font-normal text-slate-600">
                      {formatSubmittedDate(item.submittedAt)}
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <ApplicationStatus status={item.applicationStatus} />
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          title="View Application"
                          icon={<FiEye />}
                          onClick={() => onView(item)}
                          className="bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white"
                        />

                        <IconButton
                          title="More Actions"
                          icon={<FiMoreVertical />}
                          disabled={pending || isBulkSaving}
                          onClick={(event) => onOpenMenu(event, item)}
                          className={
                            openMenu?.id === item.id
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7">
                  <EmptyState
                    hasFilter={
                      Boolean(searchTerm.trim()) || statusFilter !== "All"
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openMenu && (
        <ActionDropdown
          menu={openMenu}
          pendingActionId={pendingActionId}
          onMarkVerified={onMarkVerified}
          onSetPending={onSetPending}
        />
      )}
    </>
  );
};

/* =========================================================
   ACTION DROPDOWN
========================================================= */

const ActionDropdown = ({
  menu,
  pendingActionId,
  onMarkVerified,
  onSetPending,
}) => {
  const pending = String(pendingActionId) === String(menu.item.id);

  const isVerified = menu.item.applicationStatus === "Verified";

  return createPortal(
    <div
      onClick={(event) => event.stopPropagation()}
      className="fixed z-[99999] w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl"
      style={{
        top: `${menu.top}px`,
        left: `${menu.left}px`,
      }}
    >
      {!isVerified && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onMarkVerified(menu.item)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-normal text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiCheckCircle />

          {pending ? "Updating..." : "Mark Verified"}
        </button>
      )}

      {isVerified && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onSetPending(menu.item)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiClock />

          {pending ? "Updating..." : "Set Pending"}
        </button>
      )}
    </div>,
    document.body,
  );
};

/* =========================================================
   APPLICANT
========================================================= */

const ApplicantBlock = ({ applicant }) => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-medium text-cyan-700 ring-4 ring-cyan-50">
        {getInitials(applicant)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-normal text-slate-900">
          {getApplicantName(applicant)}
        </p>

        <VerificationBadge status={applicant.verificationStatus} />
      </div>
    </div>
  );
};

/* =========================================================
   VERIFICATION BADGE
========================================================= */

const VerificationBadge = ({ status }) => {
  const verified = status === "Verified";

  return (
    <span
      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-normal ${
        verified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {verified ? <FiCheckCircle /> : <FiShield />}

      {status || "Not Verified"}
    </span>
  );
};

/* =========================================================
   REGISTRATION NUMBER
========================================================= */

const RegistrationNumber = ({ value }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-slate-600">
      <FiHash className="shrink-0 text-slate-400" />

      <span>{value || "-"}</span>
    </div>
  );
};

/* =========================================================
   APPLICATION STATUS
========================================================= */

const ApplicationStatus = ({ status }) => {
  const verified = status === "Verified";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-normal ${
        verified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-orange-50 text-orange-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          verified ? "bg-emerald-500" : "bg-orange-500"
        }`}
      />

      {status || "Pending"}
    </span>
  );
};

/* =========================================================
   PAGINATION
========================================================= */

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
      {/* LEFT */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal text-slate-500">Show</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="text-sm font-normal text-slate-500">entries</span>
        </div>

        <p className="text-sm font-normal text-slate-500">
          Showing {showingStart} to {showingEnd} of {totalRows} applications
        </p>
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
        >
          <FiChevronLeft />
          Prev
        </button>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-normal text-slate-600">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70"
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <p className="text-sm font-normal text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-medium text-slate-950">{value}</p>
    </div>
  );
};

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({ label }) => {
  return (
    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </th>
  );
};

/* =========================================================
   ICON BUTTON
========================================================= */

const IconButton = ({ title, icon, className, onClick, disabled = false }) => {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {icon}
    </button>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({ hasFilter }) => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-normal text-slate-600">
        {hasFilter
          ? "No matching verification applications."
          : "No verification applications yet."}
      </p>

      <p className="mt-1 text-xs font-normal text-slate-400">
        {hasFilter
          ? "Try another search or status."
          : "Applications will appear here once they are submitted."}
      </p>
    </div>
  );
};

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
};

const PageSkeleton = () => {
  return (
    <div className="space-y-5 [font-family:'Poppins',sans-serif]">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-64" />

        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div key={index} className="rounded-md bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-28" />

            <Skeleton className="mt-3 h-7 w-10" />
          </div>
        ))}
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-md bg-white shadow-sm">
        {/* FILTER */}

        <div className="border-b border-slate-100 p-4">
          <Skeleton className="h-5 w-44" />

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <Skeleton className="h-11 w-full rounded-md" />

            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {Array.from({
                  length: 7,
                }).map((_, index) => (
                  <th key={index} className="px-5 py-4">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: 6,
              }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  {/* CHECKBOX */}

                  <td className="px-5 py-5">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  </td>

                  {/* APPLICANT */}

                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

                      <div>
                        <Skeleton className="h-4 w-32" />

                        <Skeleton className="mt-2 h-6 w-24" />
                      </div>
                    </div>
                  </td>

                  {/* REGISTRATION */}

                  <td className="px-5 py-5">
                    <Skeleton className="h-4 w-36" />
                  </td>

                  {/* LEVEL */}

                  <td className="px-5 py-5">
                    <Skeleton className="h-4 w-20" />
                  </td>

                  {/* SUBMITTED */}

                  <td className="px-5 py-5">
                    <Skeleton className="h-4 w-24" />
                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-5">
                    <Skeleton className="h-7 w-20" />
                  </td>

                  {/* ACTION */}

                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9 rounded-md" />

                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-8" />

            <Skeleton className="h-9 w-16" />

            <Skeleton className="h-4 w-12" />

            <Skeleton className="h-4 w-52" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />

            <Skeleton className="h-9 w-24" />

            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
