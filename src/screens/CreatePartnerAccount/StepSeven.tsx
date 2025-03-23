"use client";

import React, { useState } from "react";

interface StepSevenProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepSeven({
  prevStep,
  nextStep,
  handleCancelClick,
}: StepSevenProps) {
  const [patientCounts, setPatientCounts] = useState<Record<string, boolean>>({
    men: false,
    women: false,
    boys: false,
    girls: false,
    babyBoys: false,
    babyGirls: false,
  });

  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Finances
      </h3>

      <label className="block text-[16px] text-[#22070B] mb-2">
        What happens with patients who cannot pay?
      </label>
      <textarea
        className="w-full h-[160px] p-3 border border-[#22070B]/10 bg-[#F9F9F9] 
        text-[16px] text-[#22070B] placeholder:text-[#22070B]/50 
        font-[Open_Sans] rounded-[4px] resize-none mb-8"
        placeholder="Paragraph"
      />

      <label className="block text-[16px] text-[#22070B] mb-2">
        Percentage of patients needing financial aid
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Percentage"
      />

      <label className="block text-[16px] text-[#22070B] mb-2">
        Percentage of patients receiving free treatment
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Percentage"
      />

      <p className="text-[16px] text-[#22070B] mb-2">
        Annual spending on medications and medical supplies (select a range in
        USD)
      </p>
      <div className="space-y-2 mb-8">
        {[
          "$1 - $5,000",
          "$5,001 - $10,000",
          "$10,001 - $25,000",
          "$25,001 - $50,000",
          "$50,001 - $100,000",
          "$100,001+",
        ].map((range) => (
          <label
            key={range}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input type="radio" name="annualSpending" className="mr-2" />
            {range}
          </label>
        ))}
      </div>

      <p className="text-[16px] text-[#22070B] mb-2">
        Does your organization track the number of prescriptions prescribed each
        year?
      </p>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="trackPrescriptions" className="mr-2" /> Yes
        </label>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="trackPrescriptions" className="mr-2" /> No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Total number of course treatments prescribed annually
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="List"
      />

      <p className="text-[16px] text-[#22070B] mb-2">
        Number of patients served last year. Select all that apply
      </p>
      <div className="space-y-2 mb-8">
        {[
          { label: "Men (18+)", key: "men" },
          { label: "Women (18+)", key: "women" },
          { label: "Boys (1-17)", key: "boys" },
          { label: "Girls (1-17)", key: "girls" },
          { label: "Baby boys (<1)", key: "babyBoys" },
          { label: "Baby girls (<1)", key: "babyGirls" },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) =>
                  setPatientCounts((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
              />
              <span className="text-[16px] text-[#22070B]">{label}</span>
            </div>
            {patientCounts[key] && (
              <input
                className="w-3/5 p-2 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
                text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] 
                rounded-[4px] ml-auto"
                placeholder="Number"
              />
            )}
          </div>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Total number of patients served
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="List"
      />

      <div className="flex justify-between mt-6">
        <button
          className="text-mainRed font-semibold font-[Open_Sans]"
          onClick={handleCancelClick}
        >
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
