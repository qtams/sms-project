const SummarySkeleton = ({ count = 3, columns = 3 }) => {
  const gridColumns = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`
        grid
        gap-3
        ${gridColumns[columns] || gridColumns[3]}
      `}
    >
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="
            rounded-md
            border
            border-slate-100
            bg-white
            p-4
            shadow-sm
          "
        >
          <div
            className="
              h-3
              w-20
              animate-pulse
              rounded
              bg-slate-200
            "
          />

          <div
            className="
              mt-3
              h-7
              w-16
              animate-pulse
              rounded
              bg-slate-200
            "
          />
        </div>
      ))}
    </div>
  );
};

export default SummarySkeleton;
