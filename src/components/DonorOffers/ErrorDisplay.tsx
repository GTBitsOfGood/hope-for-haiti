interface ErrorDisplayProps {
  errors: string[];
}

export const ErrorDisplay = ({ errors }: ErrorDisplayProps) => (
  <div className="mt-4">
    {errors.map((error, index) => (
      <div key={index} className="bg-red-50 border font-light border-red-500 text-red-500 p-3 mb-2 rounded">
        {error}
      </div>
    ))}
  </div>
); 