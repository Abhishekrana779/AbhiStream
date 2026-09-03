import { FiRefreshCw } from "react-icons/fi";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4"></div>
      <p className="text-gray-400 text-lg mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary"
        >
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}