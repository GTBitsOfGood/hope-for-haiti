"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface StepTenProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepTen({
}: StepTenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sendingInvite, setSendingInvite] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  //get name and email from the params
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    const sendInvite = async () => {
      if (!name || !email) {
        setErrorMessage("Missing user details.");
        setSendingInvite(false);
        return;
      }

      try {
        const response = await fetch("/api/invites", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            email,
            name,
            userType: "PARTNER",
          }).toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(errorText || "Couldnt send invite.");
        }
      } finally {
        setSendingInvite(false);
      }
    };

    sendInvite();
  }, [name, email]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Finish
      </h3>

      {sendingInvite ? (
        <p className="text-[16px] text-[#22070B]/70 mb-4">Sending invite...</p>
      ) : errorMessage ? (
        <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
      ) : (
        <>
          <p className="text-[16px] text-[#22070B]/70 mb-4">
            An email has been sent to the other party to finalize account creation. This account is currently pending.
          </p>
          <p className="text-[16px] text-[#22070B]/70 mb-8">
            You can view the current status from the account management page.
          </p>
        </>
      )}

      <div className="flex justify-center">
        <button
          className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold w-[320px] text-center"
          onClick={() => {
            router.push("/account_management");
          }}
          disabled={sendingInvite}
        >
          {sendingInvite ? "Processing..." : "Back to account management"}
        </button>
      </div>
    </div>
  );
}
