"use client";

import { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import { DonorOfferState } from "@prisma/client";
import {
  FileInfoDisplay,
  PreviewTable,
  DonorOfferItem,
  PartnerSearch,
  Partner,
  DonorOfferSuccessModal,
  DonorOfferErrorModal,
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useApiClient, extractErrorMessages } from "@/hooks/useApiClient";
import { hasPermission } from "@/lib/userUtils";

export default function CreateDonorOfferPage() {
  const { data: session } = useSession();
  const router = useRouter();

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
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  const getTodayDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const {
    fileName,
    fileSize,
    fileErrorMessage,
    fileUploaded,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    clearErrors,
    resetUpload: resetFileUpload,
  } = useFileUpload<{ donorOfferItems: DonorOfferItem[] }>({
    previewEndpoint: "/api/donorOffers?preview=true",
    previewEndpointMethod: "POST",
    onSuccess: (result) => {
      setData(result.donorOfferItems);
    },
    validateBeforeUpload: () => {
      const today = getTodayDateString();
      const validationErrors: string[] = [];

      if (!offerName) validationErrors.push("Donor offer name is required.");
      if (!donorName) validationErrors.push("Donor name is required.");
      if (!partnerRequestDeadline)
        validationErrors.push("Partner request deadline is required.");
      if (!donorRequestDeadline)
        validationErrors.push("Donor request deadline is required.");

      if (donorRequestDeadline && donorRequestDeadline < today) {
        validationErrors.push("Donor Request Deadline cannot be in the past.");
      }

      if (partnerRequestDeadline && partnerRequestDeadline < today) {
        validationErrors.push("Partner Request Deadline cannot be in the past.");
      }
      return validationErrors.length > 0 ? validationErrors : null;
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

  // Upload-validation errors name the missing fields, so drop them as soon as
  // the user edits a field and no file was kept. A kept file with a failed
  // preview (uploadedFile set, fileUploaded false) keeps its file-level error
  // so the reason the file was rejected stays visible.
  const handleFieldChange = (
    setter: (value: string) => void,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setter(event.target.value);
    if (!fileUploaded && !uploadedFile) clearErrors();
  };

  if (session?.user?.type === "PARTNER") {
    redirect("/donorOffers");
  }

  if (session?.user && !hasPermission(session.user, "offerWrite")) {
    redirect("/donorOffers");
  }

  const showPreview = () => {
    if (!fileUploaded || fileErrorMessage) return;

    setPreview(true);
  };

  // Every preview/validation error is rendered inside the file card, one line
  // each. Validation errors set errors without fileErrorMessage; API/network
  // failures set both, so fileErrorMessage is covered by the array. Nothing is
  // sliced or dropped.
  const uploadErrors = errors;

  const resetUpload = () => {
    resetFileUpload();

    setPreview(false);
    setIsSuccess(false);
    setIsError(false);
    setSubmitErrors([]);

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
      await apiClient.post("/api/donorOffers", {
        body: formData,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating donor offer:", error);
      setSubmitErrors(
        extractErrorMessages(
          error,
          "An error occurred while creating the donor offer. Please try again."
        )
      );
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
            onChange={(e) => handleFieldChange(setOfferName, e)}
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
            onChange={(e) => handleFieldChange(setDonorName, e)}
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
            onChange={(e) => handleFieldChange(setDonorRequestDeadline, e)}
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
            onChange={(e) => handleFieldChange(setPartnerRequestDeadline, e)}
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
        fileErrorMessage={fileErrorMessage}
        errorMessages={uploadErrors}
        onReset={resetUpload}
      />

      {preview && <PreviewTable final={false} data={data} />}

      <div className="flex justify-end mt-4">
        <button
          onClick={() => router.push("/donorOffers")}
          className="bg-white hover:bg-gray-100 w-48 text-red-500 border border-red-500 py-1 px-4 mt-1 mb-6 rounded text-sm"
        >
          Cancel Upload
        </button>
        {preview ? (
          <button
            onClick={handleSubmit}
            className="bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
          >
            Create Offer
          </button>
        ) : (
          <button
            disabled={
              !fileUploaded ||
              !!fileErrorMessage ||
              !offerName ||
              !donorName ||
              !partnerRequestDeadline ||
              !donorRequestDeadline
            }
            onClick={showPreview}
            className={
              fileUploaded &&
              !fileErrorMessage &&
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
          errors={submitErrors}
        />
      )}
    </div>
  );
}
