import { FiGrid, FiList, FiSearch } from "react-icons/fi";
import { Skeleton } from "../skeleton";

const TableToolbar = ({
  title,
  subtitle,

  search,

  statusFilter,

  extraFilters,

  onReset,

  view,

  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className="
          border-b
          border-slate-100
          p-4
        "
      >
        <div className="flex flex-col gap-4">
          {/* TITLE */}
          {(title || subtitle) && (
            <div>
              {title && <Skeleton className="h-4 w-28" />}

              {subtitle && <Skeleton className="mt-2 h-3 w-52" />}
            </div>
          )}

          {/* CONTROLS */}
          <div
            className="
              flex
              flex-col
              gap-3
              xl:flex-row
            "
          >
            {search && (
              <Skeleton
                className="
                  h-11
                  flex-1
                  rounded-md
                "
              />
            )}

            {statusFilter && (
              <Skeleton
                className="
                  h-11
                  w-full
                  rounded-md
                  xl:w-[110px]
                "
              />
            )}

            {extraFilters && (
              <Skeleton
                className="
                  h-11
                  w-full
                  rounded-md
                  xl:w-[220px]
                "
              />
            )}

            {onReset && (
              <Skeleton
                className="
                  h-11
                  w-full
                  rounded-md
                  xl:w-[66px]
                "
              />
            )}

            {view && (
              <Skeleton
                className="
                  h-11
                  w-full
                  rounded-md
                  xl:w-[82px]
                "
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        border-b
        border-slate-100
        p-4
      "
    >
      <div className="flex flex-col gap-4">
        {(title || subtitle) && (
          <div>
            {title && (
              <p className="text-[14px] font-medium text-slate-900">{title}</p>
            )}

            {subtitle && (
              <p className="mt-1 text-[11px] text-[#94a3b8]">{subtitle}</p>
            )}
          </div>
        )}

        <div
          className="
            flex
            flex-col
            gap-3
            xl:flex-row
          "
        >
          {search && (
            <div className="relative flex-1">
              <FiSearch
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[#94a3b8]
                "
              />

              <input
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || "Search..."}
                className="
                  h-11
                  w-full
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  pl-11
                  pr-4
                  text-[12px]
                  text-[#69768b]
                  outline-none
                  focus:border-[#01B8E5]
                "
              />
            </div>
          )}

          {statusFilter && (
            <select
              value={statusFilter.value}
              onChange={(e) => statusFilter.onChange(e.target.value)}
              className="
                h-11
                rounded-md
                border
                border-slate-200
                bg-white
                px-4
                text-[12px]
                text-[#69768b]
                outline-none
              "
            >
              {statusFilter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {extraFilters}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="
                h-11
                rounded-md
                bg-slate-100
                px-4
                text-[12px]
                text-[#69768b]
              "
            >
              Reset
            </button>
          )}

          {view && (
            <div
              className="
                flex
                h-11
                rounded-md
                border
                border-slate-200
                bg-white
                p-1
              "
            >
              <button
                type="button"
                onClick={() => view.onChange("cards")}
                className={`
                  rounded
                  px-3
                  text-[12px]
                  ${
                    view.mode === "cards"
                      ? "bg-slate-100 text-slate-900"
                      : "text-[#94a3b8]"
                  }
                `}
              >
                <FiGrid />
              </button>

              <button
                type="button"
                onClick={() => view.onChange("table")}
                className={`
                  rounded
                  px-3
                  text-[12px]
                  ${
                    view.mode === "table"
                      ? "bg-slate-100 text-slate-900"
                      : "text-[#94a3b8]"
                  }
                `}
              >
                <FiList />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableToolbar;
