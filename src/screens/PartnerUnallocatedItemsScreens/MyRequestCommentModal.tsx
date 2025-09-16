import CommentModal from "@/components/CommentModal";
import { Dispatch, SetStateAction, useState } from "react";
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
  const [initialComment] = useState(formState.comments);
  
  const handleSubmit = async (value: string) => {
    setOpen(false);
  };

  const handleClose = () => {
    setFormState((prevValue) => {
      return { ...prevValue, comments: initialComment };
    });
    setOpen(false);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prevValue) => {
      return {
        ...prevValue,
        [e.target.name]: e.target.value,
      };
    });
  };

  return (
    <CommentModal
      isOpen={open}
      title={`${item.title}: Comment`}
      initialValue={formState.comments}
      onClose={handleClose}
      onSave={handleSubmit}
      useModalTextField={true}
      width="max-w-[700px]"
      fieldName="comments"
      onFieldChange={handleFieldChange}
    />
  );
}
