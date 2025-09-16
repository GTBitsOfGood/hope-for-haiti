"use client";

import React from "react";
import CommentModal from "../CommentModal";

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
  
  const handleSave = async (value: string) => {
    setComment(value);
    
    await fetch(`/api/donorOffers/${donorOfferItemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [] }),
    });
    
    onModalSave();
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  return (
    <CommentModal
      isOpen={isOpen}
      title={`${itemName}: Comment`}
      initialValue={comment}
      onClose={onClose}
      onSave={handleSave}
      onFieldChange={handleFieldChange}
    />
  );
}
