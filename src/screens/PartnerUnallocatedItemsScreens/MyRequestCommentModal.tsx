import ModalTextField from "@/components/ModalTextField";
import { X } from "@phosphor-icons/react";
import { Dispatch, SetStateAction } from "react";
import { FormState, ItemRequest } from "./MyRequests";

interface MyRequestCommentModalProps {
  item: ItemRequest;
  formState: FormState;
  setFormState: Dispatch<SetStateAction<FormState>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function MyRequestCommentModal({
  formState,
  setFormState,
  item,
  open,
  setOpen,
}: MyRequestCommentModalProps) {
  const handleSubmit = async () => {
    setOpen(false);
  };

  const handleClose = () => {
    setFormState((prevValue) => {
      return { ...prevValue, comments: "" };
    });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="relative w-[700px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold">{item.title}: Comment</p>
            <X className="size-6 cursor-pointer" onClick={handleClose} />
          </div>
          <p className="font-light text-gray-600">Comments</p>
          <ModalTextField
            name="comments"
            value={formState.comments}
            onChange={(e) =>
              setFormState((prevValue) => {
                return {
                  ...prevValue,
                  [e.target.name]: e.target.value,
                };
              })
            }
          />
          <div className="flex w-full justify-between mt-4 gap-4">
            <button
              type="button"
              className="w-1/2 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
