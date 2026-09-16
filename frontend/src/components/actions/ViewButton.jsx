import { FiChevronRight } from "react-icons/fi";

const ViewButton = ({ onClick, label = "View", variant = "default" }) => {
  if (variant === "table") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="
          inline-flex
          items-center
          gap-1
          text-[12px]
          text-[#69768b]
          transition
          hover:text-[#01B8E5]
        "
      >
        {label}

        <FiChevronRight
          className="
            transition-transform
            group-hover:translate-x-1
          "
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex
        items-center
        gap-1
        text-[12px]
        text-[#69768b]
        transition
        hover:text-[#01B8E5]
      "
    >
      {label}

      <FiChevronRight />
    </button>
  );
};

export default ViewButton;
