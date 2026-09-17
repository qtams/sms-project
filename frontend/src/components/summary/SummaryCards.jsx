import StatCard from "./StatCard";
import SummarySkeleton from "../skeleton/SummarySkeleton";

const SummaryCards = ({ items = [], columns = 3, loading = false }) => {
  if (loading) {
    return (
      <SummarySkeleton count={items.length || columns} columns={columns} />
    );
  }
  const gridColumns = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
  };

  return (
    <div
      className={`
        grid
        gap-3
        ${gridColumns[columns] || gridColumns[3]}
      `}
    >
      {items.map((item, index) => (
        <StatCard key={item.key || item.label || index} {...item} />
      ))}
    </div>
  );
};

export default SummaryCards;
