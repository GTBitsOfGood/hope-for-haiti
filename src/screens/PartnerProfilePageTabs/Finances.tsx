"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface FinancesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function Finances({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: FinancesProps) {
  const [formData, setFormData] = useState({
    patientsWhoCannotPay: partnerDetails.patientsWhoCannotPay,
    percentageOfPatientsNeedingFinancialAid:
      partnerDetails.percentageOfPatientsNeedingFinancialAid,
    percentageOfPatientsReceivingFreeTreatment:
      partnerDetails.percentageOfPatientsReceivingFreeTreatment,
    annualSpendingOnMedicationsAndMedicalSupplies:
      partnerDetails.annualSpendingOnMedicationsAndMedicalSupplies,
    numberOfPrescriptionsPrescribedAnnuallyTracked:
      partnerDetails.numberOfPrescriptionsPrescribedAnnuallyTracked,
    numberOfTreatmentsPrescribedAnnually:
      partnerDetails.numberOfTreatmentsPrescribedAnnually,
    totalPatientsServedLastYear: partnerDetails.totalPatientsServedLastYear,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      patientsWhoCannotPay: partnerDetails.patientsWhoCannotPay,
      percentageOfPatientsNeedingFinancialAid:
        partnerDetails.percentageOfPatientsNeedingFinancialAid,
      percentageOfPatientsReceivingFreeTreatment:
        partnerDetails.percentageOfPatientsReceivingFreeTreatment,
      annualSpendingOnMedicationsAndMedicalSupplies:
        partnerDetails.annualSpendingOnMedicationsAndMedicalSupplies,
      numberOfPrescriptionsPrescribedAnnuallyTracked:
        partnerDetails.numberOfPrescriptionsPrescribedAnnuallyTracked,
      numberOfTreatmentsPrescribedAnnually:
        partnerDetails.numberOfTreatmentsPrescribedAnnually,
      totalPatientsServedLastYear: partnerDetails.totalPatientsServedLastYear,
    });
    setIsEditingOrg(false);
  };

  const spendingOptions = [
    { value: "1_to_5000", label: "$1 - $5,000" },
    { value: "5001_to_10000", label: "$5,001 - $10,000" },
    { value: "10001_to_25000", label: "$10,001 - $25,000" },
    { value: "25001_to_50000", label: "$25,001 - $50,000" },
    { value: "50001_to_100000", label: "$50,001 - $100,000" },
    { value: "100001+", label: "$100,001+" },
  ];

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">Finances</h3>
        <div className="flex gap-2">
          {isEditingOrg && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="border border-gray-400 text-gray-600 px-4 py-2 rounded-[4px] font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditingOrg ? handleSave : () => setIsEditingOrg(true)}
            disabled={isSaving}
            className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditingOrg ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          What happens to patients who cannot pay?
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.patientsWhoCannotPay}
            onChange={(e) =>
              setFormData({ ...formData, patientsWhoCannotPay: e.target.value })
            }
            className="border p-1 min-h-[100px]"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.patientsWhoCannotPay}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Percentage needing financial aid
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            max="100"
            value={formData.percentageOfPatientsNeedingFinancialAid}
            onChange={(e) =>
              setFormData({
                ...formData,
                percentageOfPatientsNeedingFinancialAid:
                  parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.percentageOfPatientsNeedingFinancialAid}%
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Annual spending on medications
        </p>
        {isEditingOrg ? (
          <select
            value={formData.annualSpendingOnMedicationsAndMedicalSupplies}
            onChange={(e) =>
              setFormData({
                ...formData,
                annualSpendingOnMedicationsAndMedicalSupplies: e.target
                  .value as
                  | "1_to_5000"
                  | "5001_to_10000"
                  | "10001_to_25000"
                  | "25001_to_50000"
                  | "50001_to_100000"
                  | "100001+",
              })
            }
            className="border p-1"
          >
            {spendingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {
              spendingOptions.find(
                (opt) =>
                  opt.value ===
                  partnerDetails.annualSpendingOnMedicationsAndMedicalSupplies
              )?.label
            }
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Total patients served last year
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.totalPatientsServedLastYear}
            onChange={(e) =>
              setFormData({
                ...formData,
                totalPatientsServedLastYear: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.totalPatientsServedLastYear}
          </p>
        )}
      </div>
    </div>
  );
}
