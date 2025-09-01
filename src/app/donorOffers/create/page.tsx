"use client";

import { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import { DonorOfferState } from "@prisma/client";
import {
  FileInfoDisplay,
  ErrorDisplay,
  PreviewTable,
  DonorOfferItem,
  PartnerSearch,
  Partner,
  DonorOfferSuccessModal,
  DonorOfferErrorModal,
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useApiClient } from "@/hooks/useApiClient";

export default function CreateDonorOfferPage() {
  const { data: session } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [offerName, setOfferName] = useState("");
  const [donorName, setDonorName] = useState("");
  const [partnerRequestDeadline, setPartnerRequestDeadline] = useState("");
  const [donorRequestDeadline, setDonorRequestDeadline] = useState("");

  const [selectedPartners, setSelectedPartners] = useState<Partner[]>([]);

  const [data, setData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const {
    fileName,
    fileSize,
    fileError,
    fileUploaded,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    resetUpload: resetFileUpload,
  } = useFileUpload<{ donorOfferItems: DonorOfferItem[] }>({
    previewEndpoint: "/api/donorOffers/create?preview=true",
    onSuccess: (result) => {
      setData(result.donorOfferItems);
    },
    validateBeforeUpload: () => {
      if (
        !offerName ||
        !donorName ||
        !partnerRequestDeadline ||
        !donorRequestDeadline
      ) {
        return [
          "Please fill out all required fields (Offer Name, Donor Name, Partner Request Deadline, Donor Request Deadline) before uploading a file.",
        ];
      }
      return null;
    },
    buildFormData: (_, formData) => {
      formData.append("offerName", offerName);
      formData.append("donorName", donorName);
      formData.append("partnerRequestDeadline", partnerRequestDeadline);
      formData.append("donorRequestDeadline", donorRequestDeadline);
      formData.append("state", DonorOfferState.UNFINALIZED);

      selectedPartners.forEach((partner) => {
        formData.append("partnerIds", partner.id.toString());
      });

      return formData;
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

  if (session?.user?.type === "PARTNER") {
    redirect("/donorOffers");
  }

  const showPreview = () => {
    if (!fileUploaded || fileError) return;

    setPreview(true);
  };

  const resetUpload = () => {
    resetFileUpload();
    
    setPreview(false);
    setIsSuccess(false);
    setIsError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("offerName", offerName);
    formData.append("donorName", donorName);
    formData.append("partnerRequestDeadline", partnerRequestDeadline);
    formData.append("donorRequestDeadline", donorRequestDeadline);
    formData.append("state", DonorOfferState.UNFINALIZED);

    selectedPartners.forEach((partner) => {
      formData.append("partnerIds", partner.id.toString());
    });

    try {
      await apiClient.post("/api/donorOffers/create", {
        body: formData,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating donor offer:", error);
      setIsError(true);
    }
  };

  return (
    <div className="px-10 py-5">
      <h1 className="mb-4 text-xl font-semibold">Create Donor Offer</h1>

      <div className="mb-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor offer name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={offerName}
            onChange={(e) => setOfferName(e.target.value)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            placeholder="Offer name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            placeholder="Donor name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor Request Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={donorRequestDeadline}
            onChange={(e) => setDonorRequestDeadline(e.target.value)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Partner Request Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={partnerRequestDeadline}
            onChange={(e) => setPartnerRequestDeadline(e.target.value)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            required
          />
        </div>
        <div>
          <PartnerSearch
            selectedPartners={selectedPartners}
            onPartnersChange={setSelectedPartners}
          />
        </div>
      </div>

      {!fileUploaded && (
        <div>
          <FileUpload
            resetUpload={resetUpload}
            fileLoading={fileLoading}
            handleFileChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
      )}

      <h2 className="mt-6 mb-1 font-light text-sm">Uploaded</h2>
      <FileInfoDisplay
        fileName={fileName}
        fileSize={fileSize}
        fileError={fileError}
        onReset={resetUpload}
      />

      {errors && errors.length > 0 && <ErrorDisplay errors={errors} />}

      {preview && <PreviewTable final={false} data={data} />}

      <div className="flex justify-end mt-4">
        <button
          onClick={resetUpload}
          className="bg-white hover:bg-gray-100 w-48 text-red-500 border border-red-500 py-1 px-4 mt-1 mb-6 rounded text-sm"
        >
          Cancel Upload
        </button>
        {preview ? (
          <button
            onClick={handleSubmit}
            className="bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
          >
            Submit Offer
          </button>
        ) : (
          <button
            disabled={
              !fileUploaded ||
              fileError ||
              !offerName ||
              !donorName ||
              !partnerRequestDeadline ||
              !donorRequestDeadline
            }
            onClick={showPreview}
            className={
              fileUploaded &&
              !fileError &&
              offerName &&
              donorName &&
              partnerRequestDeadline &&
              donorRequestDeadline
                ? "bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
                : "bg-red-500 opacity-50 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
            }
          >
            Preview Offer
          </button>
        )}
      </div>

      {isSubmitting && <BulkAddLoadingModal />}

      {isSuccess && <DonorOfferSuccessModal />}

      {isError && (
        <DonorOfferErrorModal
          setErrorOpen={setIsError}
          resetUpload={resetUpload}
          errors={["An error occurred while creating the donor offer. Please try again."]}
        />
      )}
    </div>
  );
}
