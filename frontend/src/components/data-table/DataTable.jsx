import TableToolbar from "./TableToolbar";
import TablePagination from "./TablePagination";

import { TableSkeleton, CardSkeleton } from "../skeleton";

const getRowKey = (row, rowKey, index) => {
  if (typeof rowKey === "function") {
    return rowKey(row, index);
  }

  return row?.[rowKey] ?? row?.id ?? index;
};

const TableEmptyState = ({
  title = "No records found",
  description = "Try changing your filters.",
}) => {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[13px] text-[#69768b]">{title}</p>

      <p className="mt-1 text-[11px] text-[#94a3b8]">{description}</p>
    </div>
  );
};

const DataTable = ({
  title,
  subtitle,

  columns = [],
  rows = [],

  rowKey = "id",

  loading = false,

  search,

  statusFilter,

  extraFilters,

  onReset,

  view,

  renderCard,

  pagination,

  emptyTitle,
  emptyDescription,
}) => {
  const showCards = view?.mode === "cards" && renderCard;

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-sm">
      <TableToolbar
        title={title}
        subtitle={subtitle}
        search={search}
        statusFilter={statusFilter}
        extraFilters={extraFilters}
        onReset={onReset}
        view={view}
        loading={loading}
      />

      {loading ? (
        showCards ? (
          <CardSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : showCards ? (
        rows.length > 0 ? (
          <div
            className="
              grid
              gap-4
              p-4
              sm:grid-cols-2
              xl:grid-cols-3
              2xl:grid-cols-4
            "
          >
            {rows.map((row, index) => (
              <div key={getRowKey(row, rowKey, index)}>
                {renderCard(row, index)}
              </div>
            ))}
          </div>
        ) : (
          <TableEmptyState title={emptyTitle} description={emptyDescription} />
        )
      ) : (
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              min-w-[900px]
              border-collapse
              text-left
            "
          >
            <thead>
              <tr
                className="
                  border-b
                  border-slate-100
                  bg-slate-50
                "
              >
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="
                        px-5
                        py-3
                        text-[10px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-[#94a3b8]
                      "
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr
                    key={getRowKey(row, rowKey, index)}
                    className="
                        border-b
                        border-slate-100
                        transition
                        hover:bg-slate-50
                      "
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="
                              px-5
                              py-4
                            "
                      >
                        {column.render
                          ? column.render(row, index)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <TableEmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && <TablePagination {...pagination} loading={loading} />}
    </div>
  );
};

export default DataTable;
