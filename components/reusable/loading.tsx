// components/ui/Spinner.tsx
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number; // Size of the spinner
  color?: string; // Tailwind color classes
  className?: string; // Additional class names
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  color = "text-blue-500",
  className = "",
}) => {
  return (
    <div
      className={`flex justify-center items-center ${className}`}
      role="status"
    >
      <Loader2
        className={`animate-spin ${color}`}
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default Spinner;
