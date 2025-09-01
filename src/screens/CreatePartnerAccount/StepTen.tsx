"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";

interface StepTenProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  partnerDetails: object;
}

export default function StepTen({ partnerDetails }: StepTenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  const { data, isLoading: sendingInvite, error } = useFetch(
    "/api/invites",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email,
        name,
        userType: "PARTNER",
        partnerDetails: JSON.stringify(partnerDetails || {}),
      }).toString(),
      onError: (error: string) => {
        console.error("Failed to send invite:", error);
      },
    }
  );

  const isSuccess = data && !error && !sendingInvite;
  const hasError = error && !sendingInvite;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5">
        Finish
      </h3>

      {sendingInvite ? (
        <p className="text-[16px] text-[#22070B]/70 mb-4">Sending invite...</p>
      ) : hasError ? (
        <p className="text-red-500 text-sm mb-4">Error: {error}</p>
      ) : isSuccess ? (
        <>
          <p className="text-[16px] text-[#22070B]/70 mb-4">
            An email has been sent to the other party to finalize account
            creation. This account is currently pending.
          </p>
          <p className="text-[16px] text-[#22070B]/70 mb-8">
            You can view the current status from the account management page.
          </p>
        </>
      ) : (
        <p className="text-[16px] text-[#22070B]/70 mb-4">
          Preparing to send invite...
        </p>
      )}

      <div className="flex justify-center">
        <button
          className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold w-[320px] text-center"
          onClick={() => {
            router.push("/accountManagement");
          }}
          disabled={sendingInvite}
        >
          {sendingInvite ? "Processing..." : "Back to account management"}
        </button>
      </div>
    </div>
  );
}
