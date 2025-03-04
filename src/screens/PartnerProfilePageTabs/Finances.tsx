"use client";

import React from "react";

interface FinancesData {
  whatHappensPatientsCannotPay: string;
  percentageNeedingFinancialAid: string;
  percentageReceivingFreeTreatment: string;
  annualSpendingMedications: string;
  trackPrescriptionsEachYear: string;
  totalNumberOfTreatmentsAnnually: string;
  numberOfPatientsServedLastYear: string;
}

interface FinancesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  financesData: FinancesData;
  setFinancesData: React.Dispatch<React.SetStateAction<FinancesData>>;
}

export default function Finances({
  isEditingOrg,
  setIsEditingOrg,
  financesData,
  setFinancesData,
}: FinancesProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">Finances</h3>
        <button
          onClick={() => setIsEditingOrg(!isEditingOrg)}
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
        >
          {isEditingOrg ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          What happens with patients who cannot pay?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.whatHappensPatientsCannotPay}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                whatHappensPatientsCannotPay: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.whatHappensPatientsCannotPay}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Percentage of patients needing financial aid
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.percentageNeedingFinancialAid}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                percentageNeedingFinancialAid: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.percentageNeedingFinancialAid}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Percentage of patients receiving free treatment
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.percentageReceivingFreeTreatment}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                percentageReceivingFreeTreatment: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.percentageReceivingFreeTreatment}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Annual spending on medications and medical supplies
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.annualSpendingMedications}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                annualSpendingMedications: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.annualSpendingMedications}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Does your organization track the number of prescriptions prescribed
          each year?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.trackPrescriptionsEachYear}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                trackPrescriptionsEachYear: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.trackPrescriptionsEachYear}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Total number of treatments prescribed annually
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.totalNumberOfTreatmentsAnnually}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                totalNumberOfTreatmentsAnnually: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.totalNumberOfTreatmentsAnnually}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of patients served last year
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={financesData.numberOfPatientsServedLastYear}
            onChange={(e) =>
              setFinancesData({
                ...financesData,
                numberOfPatientsServedLastYear: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {financesData.numberOfPatientsServedLastYear}
          </p>
        )}
      </div>
    </div>
  );
}
