import { Dispatch, Fragment, SetStateAction, useState } from "react";
import FinalSignOffTable from "@/components/CreateSignOff/FinalSignOffTable";
import SignatureModal from "@/components/CreateSignOff/SignatureModal";
import Image from "next/image";
import { DistributionRecordWithActualQuantity } from "@/types";

export default function FinalSignOff({
  distributions,
  staffName,
  setStaffName,
  partnerName,
  setPartnerName,
  date,
  setDate,
  signatureBlob,
  setSignatureBlob,
}: {
  distributions: DistributionRecordWithActualQuantity[];
  staffName: string;
  setStaffName: Dispatch<SetStateAction<string>>;
  partnerName: string;
  setPartnerName: Dispatch<SetStateAction<string>>;
  date: string | null;
  setDate: Dispatch<SetStateAction<string | null>>;
  signatureBlob: string | null;
  setSignatureBlob: Dispatch<SetStateAction<string | null>>;
}) {
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  return (
    <Fragment>
      <h1 className="text-2xl font-semibold">Final Sign Off</h1>
      <p>
        Filling in the below information signififes that this item is ready to
        be sign offed on.
      </p>
      <div className="flex flex-col">
        <label className="block text-[#22070B] mb-1">Staff Member Name *</label>
        <input
          type="text"
          className="w-1/2 p-2 border-gray-100 bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
          value={staffName}
          onChange={(e) => setStaffName(e.currentTarget.value)}
        />
        <label className="block text-[#22070B] mb-1">Parter Name *</label>
        <input
          type="text"
          className="w-1/2 p-2 border-gray-100 bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
          value={partnerName}
          onChange={(e) => setPartnerName(e.currentTarget.value)}
        />
        <label className="block text-[#22070B] mb-1">Date *</label>
        <input
          type="date"
          className="w-1/2 p-2 border-gray-100 bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          value={date ? date : undefined}
          onChange={(e) => setDate(e.currentTarget.value)}
        />
      </div>
      <FinalSignOffTable distributions={distributions} />
      <div>
        <label className="block text-[#22070B] mb-1">Signature *</label>
        <div
          className="mb-2 h-[42px] bg-[#f4f8fb] border border-[#2874ae] rounded-[4px] w-1/2 flex items-center justify-center cursor-pointer"
          onClick={handleOpenSignatureModal}
        >
          <p className="text-[#2874ae]">
            {signatureBlob ? "Click here to sign again" : "Click here to sign"}
          </p>
        </div>
        {signatureBlob && (
          <div className="border border-dashed border-[#4b5563] rounded-[4px] w-1/2 flex items-center justify-center cursor-pointer">
            <Image
              src={signatureBlob}
              alt="signature"
              width={300}
              height={300}
            />
          </div>
        )}
      </div>
      <SignatureModal
        open={openSignatureModal}
        setOpen={setOpenSignatureModal}
        onSubmit={setSignatureBlob}
      />
    </Fragment>
  );
}
