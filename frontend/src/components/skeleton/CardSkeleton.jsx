const CardSkeleton = ({ count = 8 }) => {
  return (
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
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="
            rounded-lg
            border
            border-slate-200
            bg-white
            p-5
          "
        >
          <div
            className="
            mx-auto
            h-20
            w-20
            animate-pulse
            rounded-full
            bg-slate-200
          "
          />

          <div
            className="
            mx-auto
            mt-4
            h-4
            w-32
            animate-pulse
            rounded
            bg-slate-200
          "
          />

          <div
            className="
            mx-auto
            mt-3
            h-3
            w-24
            animate-pulse
            rounded
            bg-slate-100
          "
          />

          <div
            className="
            mt-5
            grid
            grid-cols-2
            gap-3
          "
          >
            <div
              className="
              h-14
              animate-pulse
              rounded
              bg-slate-100
            "
            />

            <div
              className="
              h-14
              animate-pulse
              rounded
              bg-slate-100
            "
            />
          </div>

          <div
            className="
            mt-4
            h-8
            animate-pulse
            rounded
            bg-slate-100
          "
          />
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
