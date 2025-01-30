import Link from "next/link";

interface SummaryCardProps {
  title: string;
  count: number;
  color: string; // Tailwind color class
  icon: React.ReactNode; // Icon for the card
  route?: string; // Route to navigate when clicked
}

const SummaryCard = ({
  title,
  count,
  color,
  icon,
  route,
}: SummaryCardProps) => {
  return (
    <Link href={route ? route : "#"}>
      <div
        className={`relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex items-center p-6 gap-4 cursor-pointer hover:shadow-xl transition-shadow ${color}`}
      >
        {/* Icon Section */}
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-lg ${color}`}
        >
          {icon}
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400">{title}</span>
          <span className="text-3xl font-bold">{count}</span>
        </div>
      </div>
    </Link>
  );
};

export default SummaryCard;
