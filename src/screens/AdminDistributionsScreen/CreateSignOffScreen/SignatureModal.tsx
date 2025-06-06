import { X } from "@phosphor-icons/react";
import { Dispatch, Ref, SetStateAction, useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

interface SignatureModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: Dispatch<SetStateAction<string | null>>;
}

export default function SignatureModal({
  open,
  setOpen,
  onSubmit,
}: SignatureModalProps) {
  const canvasRef: Ref<ReactSketchCanvasRef> = useRef(null);

  const handleSubmit = async () => {
    if (!canvasRef?.current) return;

    const image = await canvasRef.current.exportImage("png");
    onSubmit(image);

    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="relative w-[700px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold">Sign to complete</p>
            <X className="size-6 cursor-pointer" onClick={handleClose} />
          </div>
          <p className="font-light text-gray-600">Draw your signature below</p>
          <ReactSketchCanvas
            ref={canvasRef}
            className="aspect-[8/5] rounded-[4px] my-2"
            style={{
              border: "1px dashed #4b5563",
              backgroundColor: "#f9f9f9",
            }}
            strokeWidth={4}
            strokeColor="black"
          />
          <p className="font-light text-gray-600">
            By signing this document with an electronic signature, I agree that
            such signature will be valid as handwritten signatures to the extent
            allowed by local law.
          </p>
          <div className="flex w-full justify-between mt-4 gap-4">
            <button
              type="button"
              className="w-1/2 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              className="w-1/2 bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={handleSubmit}
            >
              Confirm Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
