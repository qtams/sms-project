import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Skeleton } from "../skeleton";

const TablePagination = ({
  currentPage,
  totalPages,

  rowsPerPage,

  totalRows,

  showingStart,
  showingEnd,

  onRowsPerPageChange,
  onPageChange,

  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-100
          px-4
          py-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        flex
        flex-col
        gap-4
        border-t
        border-slate-100
        px-4
        py-4
        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#94a3b8]">Show</span>

        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="
            h-8
            rounded-md
            border
            border-slate-200
            px-2
            text-[11px]
          "
        >
          {[5, 10, 25, 50].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <span className="text-[11px] text-[#94a3b8]">
          Showing {showingStart} to {showingEnd} of {totalRows}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="
            flex
            h-8
            items-center
            gap-1
            rounded-md
            border
            px-3
            text-[11px]
            disabled:opacity-40
          "
        >
          <FiChevronLeft />
          Prev
        </button>

        <span
          className="
            rounded-md
            bg-slate-50
            px-3
            py-2
            text-[11px]
          "
        >
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="
            flex
            h-8
            items-center
            gap-1
            rounded-md
            border
            px-3
            text-[11px]
            disabled:opacity-40
          "
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
