const StatCard = ({ label, value, icon, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-md
        border
        border-slate-100
        bg-white
        p-4
        shadow-sm
        transition
        ${
          onClick
            ? "cursor-pointer hover:border-[#01B8E5]/30 hover:shadow-md"
            : ""
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="
              text-[12px]
              text-[#94a3b8]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-[20px]
              font-medium
              text-[#475569]
            "
          >
            {value}
          </p>

          {description && (
            <p
              className="
                mt-1
                text-[10px]
                text-[#94a3b8]
              "
            >
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-md
              bg-slate-50
              text-[#94a3b8]
            "
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
