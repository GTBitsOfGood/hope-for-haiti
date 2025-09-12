"use client";

import { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import { DonorOfferState } from "@prisma/client";
import {
  FileInfoDisplay,
  ErrorDisplay,
  PreviewTable,
  DonorOfferItem,
  DonorOfferSuccessModal,
  DonorOfferErrorModal,
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import { PartnerSearch as NewPartnerSearch } from "@/components/DonorOffers/PartnerSearch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";

export default function FinalizeDonorOfferPage() {
  const { data: session } = useSession();
  const params = useParams();
  const donorOfferId = params.donorOfferId as string;

  if (session?.user?.type === "PARTNER") {
    redirect("/donorOffers");
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [donorOfferForm, setDonorOfferForm] = useState<{
    partnerRequestDeadline: string;
    donorRequestDeadline: string;
  }>({
    partnerRequestDeadline: "",
    donorRequestDeadline: "",
  });

  const [selectedPartners, setSelectedPartners] = useState<
    { id: number; name: string }[]
  >([]);

  const [offerName, setOfferName] = useState("");

  const [data, setData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const { isLoading: isLoadingDetails } = useFetch<{
    offerName: string;
    partnerRequestDeadline: string;
    donorRequestDeadline: string;
    partners: { id: number; name: string }[];
  }>(`/api/donorOffers/${donorOfferId}/finalize`, {
    cache: "no-store",
    onSuccess: (donorOfferDetails) => {
      setOfferName(donorOfferDetails.offerName);
      setDonorOfferForm({
        partnerRequestDeadline: donorOfferDetails.partnerRequestDeadline,
        donorRequestDeadline: donorOfferDetails.donorRequestDeadline,
      });
      setSelectedPartners(donorOfferDetails.partners || []);
    },
    onError: (error) => {
      if (error.includes("404")) {
        redirect("/donorOffers");
      } else {
        console.error("Error fetching donor offer details:", error);
      }
    },
  });

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
    previewEndpoint: `/api/donorOffers/${donorOfferId}/finalize?preview=true`,
    onSuccess: (result) => {
      setData(result.donorOfferItems);
    },
    validateBeforeUpload: () => {
      if (
        !donorOfferForm.partnerRequestDeadline ||
        !donorOfferForm.donorRequestDeadline
      ) {
        return [
          "Please fill out all required fields (Partner Request Deadline, Donor Request Deadline) before uploading a file.",
        ];
      }
      return null;
    },
    buildFormData: (_, formData) => {
      formData.append("offerName", offerName);
      formData.append(
        "partnerRequestDeadline",
        donorOfferForm.partnerRequestDeadline
      );
      formData.append(
        "donorRequestDeadline",
        donorOfferForm.donorRequestDeadline
      );
      formData.append("state", DonorOfferState.FINALIZED);
      formData.append("donorOfferId", donorOfferId);

      return formData;
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

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
    if (!uploadedFile) {
      return;
    }

    if (!donorOfferForm.partnerRequestDeadline) {
      return;
    }

    if (!donorOfferForm.donorRequestDeadline) {
      return;
    }

    if (selectedPartners.length === 0) {
      return;
    }

    // Format dates to ensure they're in the correct format (YYYY-MM-DD)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("offerName", offerName);
    formData.append(
      "partnerRequestDeadline",
      formatDate(donorOfferForm.partnerRequestDeadline)
    );
    formData.append(
      "donorRequestDeadline",
      formatDate(donorOfferForm.donorRequestDeadline)
    );
    formData.append("state", DonorOfferState.FINALIZED);

    // Add partner IDs
    selectedPartners.forEach((partner) => {
      formData.append("partnerIds", partner.id.toString());
    });

    try {
      await apiClient.post(`/api/donorOffers/${donorOfferId}/finalize`, {
        body: formData,
      });
      setIsSuccess(true);
    } catch {
      setIsError(true);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="px-10 py-5">
      <h1 className="mb-4 text-xl font-semibold">
        {offerName}: Finalize Donor Offer
      </h1>

      <div className="mb-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Partner Request Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={donorOfferForm.partnerRequestDeadline}
            onChange={(e) =>
              setDonorOfferForm({
                ...donorOfferForm,
                partnerRequestDeadline: e.target.value,
              })
            }
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor Request Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={donorOfferForm.donorRequestDeadline}
            onChange={(e) =>
              setDonorOfferForm({
                ...donorOfferForm,
                donorRequestDeadline: e.target.value,
              })
            }
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            required
          />
        </div>
        <div>
          <NewPartnerSearch
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

      {preview && <PreviewTable final={true} data={data} />}

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
            Finalize Offer
          </button>
        ) : (
          <button
            disabled={
              !fileUploaded ||
              fileError ||
              !donorOfferForm.partnerRequestDeadline ||
              !donorOfferForm.donorRequestDeadline
            }
            onClick={showPreview}
            className={
              fileUploaded &&
              !fileError &&
              donorOfferForm.partnerRequestDeadline &&
              donorOfferForm.donorRequestDeadline
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
          errors={[
            "An error occurred while finalizing the donor offer. Please try again.",
          ]}
        />
      )}
    </div>
  );
}
