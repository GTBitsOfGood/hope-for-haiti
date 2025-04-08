"use client";

import { useEffect, useState } from "react";
import ConfirmQuantity from "./ConfirmQuantity";
import CreateSignOff from "./CreateSignOff";
import CreateSignOffActions from "./CreateSignOffActions";
import CreateSignOffStepper from "./CreateSignOffStepper";
import FinalSignOff from "./FinalSignOff";
import { DistributionRecordWithActualQuantity } from "@/types";
import { Check } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

export type CreateSignOffStep = "create" | "confirm" | "final";

export default function CreateSignOffScreen() {
  const { partnerId } = useParams();

  const [step, setStep] = useState<CreateSignOffStep>("create");

  const [selectedDistributions, setSelectedDistributions] = useState<
    DistributionRecordWithActualQuantity[]
  >([]);
  const addToSelectedDistributions = (
    distribution: DistributionRecordWithActualQuantity,
  ) => setSelectedDistributions((prev) => [...prev, distribution]);
  const removeFromSelectedDistributions = (
    distribution: DistributionRecordWithActualQuantity,
  ) =>
    setSelectedDistributions((prev) =>
      prev.filter(
        (otherDistribution) =>
          JSON.stringify(otherDistribution) !== JSON.stringify(distribution),
      ),
    );

  const setActualQuantity = (i: number, value: number) => {
    setSelectedDistributions((prev) => {
      const newVal = [...prev];
      newVal[i].actualQuantity = value;

      return newVal;
    });
  };

  useEffect(() => {
    if (step === "confirm" || step === "final") return;

    setSelectedDistributions((prev) => {
      const newVal = [...prev];
      newVal.forEach((dist) => {
        delete dist.actualQuantity;
      });

      return newVal;
    });
  }, [step]);

  const [openSuccessModal, setOpenSuccessModal] = useState(false);

  const [staffName, setStaffName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [signatureBlob, setSignatureBlob] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!staffName) return toast.error("Must enter staff name");
    if (!partnerName) return toast.error("Must enter partner name");
    if (!date) return toast.error("Must enter date");
    if (!signatureBlob) return toast.error("Must provide signature");

    (async () => {
      const resp = await fetch("/api/signOffs", {
        method: "POST",
        body: JSON.stringify({
          partnerId,
          staffName,
          partnerName,
          date,
          signatureBlob,
          distributions: selectedDistributions.map((dist) => ({
            allocationType: dist.allocationType,
            allocationId: dist.allocationId,
            actualQuantity: dist.actualQuantity || dist.quantityAllocated,
          })),
        }),
      });

      if (resp.ok) {
        setOpenSuccessModal(true);
      } else {
        toast.error("Error occurred");
      }
    })();
  };

  return (
    <div className="flex flex-col gap-6">
      <CreateSignOffStepper step={step} />
      {step === "create" && (
        <CreateSignOff
          selectedDistributions={selectedDistributions}
          addToSelectedDistributions={addToSelectedDistributions}
          removeFromSelectedDistributions={removeFromSelectedDistributions}
        />
      )}
      {step === "confirm" && (
        <ConfirmQuantity
          selectedDistributions={selectedDistributions}
          removeFromSelectedDistributions={removeFromSelectedDistributions}
          setActualQuantity={setActualQuantity}
        />
      )}
      {step === "final" && (
        <FinalSignOff
          distributions={selectedDistributions}
          staffName={staffName}
          setStaffName={setStaffName}
          partnerName={partnerName}
          setPartnerName={setPartnerName}
          date={date}
          setDate={setDate}
          signatureBlob={signatureBlob}
          setSignatureBlob={setSignatureBlob}
        />
      )}
      <CreateSignOffActions
        step={step}
        setStep={setStep}
        hasSelections={selectedDistributions.length > 0}
        onSubmit={handleSubmit}
      />

      {openSuccessModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
            <div className="relative w-[400px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl gap-6 flex flex-col">
              <p className="text-2xl font-semibold">Sign Off Completed</p>
              <div className="size-24 bg-[#2874ae] rounded-full flex items-center justify-center m-auto">
                <Check className="text-white size-16" weight="bold" />
              </div>
              <p className="font-light text-gray-600">
                The sign off has been completed and this sign off will show up
                in the completed tab.
              </p>

              <Link href={`/distributions/${partnerId}`}>
                <button className="w-full bg-red-500 text-white py-2 rounded-md shadow-md hover:bg-red-600 transition">
                  Back to distributions
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
