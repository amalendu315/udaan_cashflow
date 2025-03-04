interface BannerProps {
  title: string; // Page title
  description?: string; // Optional page description
  action?: React.ReactNode; // Optional action button or element
}

const Banner = ({ title, description, action }: BannerProps) => {
  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      {/* Title and Description */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">{title}</h1>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>

      {/* Optional Action */}
      {action && <div className="mt-4 md:mt-0">{action}</div>}
    </div>
  );
};

export default Banner;
