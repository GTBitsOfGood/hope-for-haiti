"use client";

import React from "react";

interface StepTwoProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepTwo({ prevStep, nextStep, handleCancelClick }: StepTwoProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Contact information
      </h3>

      {["Regional Contact", "Medical Contact", "Admin Director", "Pharmacy"].map((section, index) => (
        <div key={section} className={`mb-8 ${index > 0 ? "border-t border-[#22070B]/10 mt-6 pt-6" : ""}`}>
          <h4 className="text-[18px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
            {section}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "First name", placeholder: "First name" },
              { label: "Last name", placeholder: "Last name" },
              { label: "Org title", placeholder: "Org title" },
              { label: "Primary telephone", placeholder: "000-000-0000" },
              { label: "Secondary telephone", placeholder: "000-000-0000" },
              { label: "Email", placeholder: "example@gmail.com" },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
                  {label}
                </label>
                <input
                  className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
                  text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
                  border-solid border-[1px]"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-[#22070B]/10 mt-6 pt-6 mb-8">
        <h4 className="text-[18px] text-[#22070B] mb-2 font-[Open_Sans]">
          WhatsApp Contact
        </h4>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
          text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
          border-solid border-[1px]"
          placeholder="WhatsApp contact"
        />
      </div>

      <div className="mb-8">
        <h4 className="text-[18px] text-[#22070B] mb-2 font-[Open_Sans]">
          WhatsApp Number
        </h4>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
          text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
          border-solid border-[1px]"
          placeholder="000-000-0000"
        />
      </div>
      <div className="flex justify-between mt-6">
        <button className="text-mainRed font-semibold font-[Open_Sans]" onClick={handleCancelClick}>
          Cancel account creation
        </button>
        <div>
          <button
            className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold mr-4 font-[Open_Sans]"
            onClick={prevStep}
          >
            Previous
          </button>
          <button
            className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold font-[Open_Sans]"
            onClick={nextStep}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
