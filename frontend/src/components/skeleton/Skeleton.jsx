// components/skeleton/Skeleton.jsx

const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`
        animate-pulse
        rounded
        bg-slate-200
        ${className}
      `}
    />
  );
};

export default Skeleton;
