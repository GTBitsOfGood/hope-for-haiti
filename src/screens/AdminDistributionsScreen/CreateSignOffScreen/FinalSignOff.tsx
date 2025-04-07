import { Fragment, useState } from "react";
import FinalSignOffTable from "./FinalSignOffTable";
import SignatureModal from "./SignatureModal";
import Image from "next/image";

export default function FinalSignOff() {
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  console.log(localStorage.getItem("signature"));

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
        />
        <label className="block text-[#22070B] mb-1">Parter Name *</label>
        <input
          type="text"
          className="w-1/2 p-2 border-gray-100 bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
        <label className="block text-[#22070B] mb-1">Date *</label>
        <input
          type="text"
          className="w-1/2 p-2 border-gray-100 bg-[#F9F9F9] text-[#22070B] rounded-[4px] mb-4"
          placeholder="Insert"
        />
        <label className="block text-[#22070B] mb-1">Signature *</label>
        <div
          className="h-[42px] bg-[#f4f8fb] border border-[#2874ae] rounded-[4px] w-1/2 flex items-center justify-center cursor-pointer"
          onClick={handleOpenSignatureModal}
        >
          <p className="text-[#2874ae]">Click here to sign</p>
        </div>
      </div>
      <FinalSignOffTable />
      <div>
        <label className="block text-[#22070B] mb-1">Signature *</label>
        <div className="border border-dashed border-[#4b5563] rounded-[4px] w-1/2 flex items-center justify-center cursor-pointer">
          <Image
            src={localStorage.getItem("signature") ?? ""}
            alt="signature"
            width={300}
            height={300}
          />
        </div>
      </div>
      <SignatureModal
        open={openSignatureModal}
        setOpen={setOpenSignatureModal}
      />
    </Fragment>
  );
}
