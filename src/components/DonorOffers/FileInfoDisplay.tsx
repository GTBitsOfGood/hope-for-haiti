import { WarningCircle, X } from "@phosphor-icons/react";

interface FileInfoDisplayProps {
  fileName: string;
  fileSize: number;
  /** Specific error message from validation/API, or null when no error */
  fileErrorMessage?: string | null;
  onReset: () => void;
}

export const FileInfoDisplay = ({
  fileName,
  fileSize,
  fileErrorMessage = null,
  onReset,
}: FileInfoDisplayProps) => {
  const hasError = Boolean(fileErrorMessage);

  return (
  <div
    className={`border rounded w-full py-2 px-2 text-gray-700 
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-200"}`}
  >
    {fileName ? (
      <div className="flex justify-between">
        <div>
          <p className="text-black text-xs">{fileName}</p>
          {!hasError && (
            <p className="text-zinc-500 font-light mt-2 text-xs">
              {fileSize > 1024 * 1024
                ? (fileSize / (1024 * 1024)).toFixed(2) + " mb"
                : (fileSize / 1024).toFixed(2) + " kb"}
            </p>
          )}
          {hasError && (
            <p className="text-red-500 font-light text-xs mt-2">
              <WarningCircle weight="fill" className="inline mr-1" />
              {fileErrorMessage}
            </p>
          )}
        </div>
        <X
          onClick={onReset}
          size={28}
          className={`my-2 mx-8 cursor-pointer ${hasError ? "text-red-500" : ""}`}
        />
      </div>
    ) : (
      <div>
        <p className="text-zinc-500 font-light text-xs">No File Uploaded</p>
      </div>
    )}
  </div>
  );
};
