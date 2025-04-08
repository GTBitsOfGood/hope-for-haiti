"use client";

import React, { ChangeEvent } from "react";

interface CommentModalDonorOffersProps {
  isOpen: boolean;
  onClose: () => void;
  donorOfferItemId: number;
  itemName: string;
  comment: string;
  setComment: (value: string) => void;
  onModalSave: () => void;
}

export default function CommentModalDonorOffers({
  isOpen,
  onClose,
  donorOfferItemId,
  itemName,
  comment,
  setComment,
  onModalSave,
}: CommentModalDonorOffersProps) {
  if (!isOpen) return null;
  const mainRed = "#EF3340";
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };
  const handleSaveClick = async () => {
      await fetch(`/api/donorOffers/${donorOfferItemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [] }),
      });
      onModalSave();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-[Open_Sans]">
      <div className="relative bg-white rounded-[12px] p-8 w-full max-w-lg shadow-lg text-[#22070B]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        <h2 className="text-[20px] font-semibold leading-[28px] mb-4">
          {itemName}: Comment
        </h2>
        <p className="text-[16px] leading-[24px] mb-2">Comments</p>
        <textarea
          value={comment}
          onChange={handleTextChange}
          placeholder="Comment about this item here..."
          className="w-full min-h-[150px] rounded-[4px] border border-[rgba(34,7,11,0.05)] bg-[rgba(34,7,11,0.05)] text-[16px] p-3 focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)] resize-none"
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className={`bg-white hover:bg-gray-100 text-[${mainRed}] border-2 border-[${mainRed}] font-semibold py-2 px-4 rounded-md`}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className={`bg-[${mainRed}] hover:bg-[#a32027] text-white font-semibold py-2 px-4 rounded-md`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
