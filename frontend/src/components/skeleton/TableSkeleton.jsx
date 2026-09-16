const TableSkeleton = ({ rows = 8, columns = 6 }) => {
  return (
    <div className="overflow-hidden rounded-md bg-white">
      {/* HEADER */}

      <div
        className="
        flex
        gap-4
        border-b
        border-slate-100
        bg-slate-50
        px-5
        py-3
      "
      >
        {Array.from({
          length: columns,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-3
              flex-1
              animate-pulse
              rounded
              bg-slate-200
            "
          />
        ))}
      </div>

      {/* ROWS */}

      {Array.from({
        length: rows,
      }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="
            flex
            gap-4
            border-b
            border-slate-100
            px-5
            py-4
          "
        >
          {Array.from({
            length: columns,
          }).map((_, columnIndex) => (
            <div
              key={columnIndex}
              className="
                h-4
                flex-1
                animate-pulse
                rounded
                bg-slate-100
              "
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
