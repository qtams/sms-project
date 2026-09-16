const SummarySkeleton = ({ count = 3 }) => {
  return (
    <div className="grid gap-3 md:grid-cols-3">
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
