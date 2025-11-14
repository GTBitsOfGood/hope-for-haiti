"use client";

import { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import { DonorOffer, GeneralItem, GeneralItemRequest } from "@prisma/client";
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
import { PartnerSearch as NewPartnerSearch, Partner } from "@/components/DonorOffers/PartnerSearch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { DonorOfferHeader } from "@/components/DonorOffers/DonorOfferHeader";

export default function FinalizeDonorOfferPage() {
  const { data: session } = useSession();
  const params = useParams();
  const donorOfferId = params.donorOfferId as string;

  if (session?.user?.type === "PARTNER") {
    redirect("/donorOffers");
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const { data, isLoading: isLoadingDetails } = useFetch<{
    donorOffer: DonorOffer
    partners: Partner[];
    items: GeneralItem[] | (GeneralItem & {
      requests?: (GeneralItemRequest & {
        partner: { id: number; name: string };
      })[];
    })[];
  }>(`/api/donorOffers/${donorOfferId}?requests=true`, {
    cache: "no-store",
    onError: (error) => {
      if (error.includes("404")) {
        redirect("/donorOffers");
      } else {
        console.error("Error fetching donor offer details:", error);
      }
    },
  });

  // Redirect if the donor offer is not unfinalized
  if (data?.donorOffer && data.donorOffer.state !== "UNFINALIZED") {
    redirect(`/donorOffers/${donorOfferId}`);
  }

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
    previewEndpoint: `/api/donorOffers/${donorOfferId}?preview=true`,
    previewEndpointMethod: "PATCH",
    onSuccess: (result) => {
      setPreviewData(result.donorOfferItems);
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

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      await apiClient.patch(`/api/donorOffers/${donorOfferId}`, {
        body: formData,
      });
      setIsSuccess(true);
    } catch {
      setIsError(true);
    }
  };

  if (isLoadingDetails || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const formatDate = (str: Date | string) => {
    const date = new Date(str);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="px-10 py-5">
      <DonorOfferHeader donorOfferId={donorOfferId} />

      <div className="mb-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor offer name
          </label>
          <input
            type="text"
            value={data?.donorOffer.offerName}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            placeholder="Offer name"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor name
          </label>
          <input
            type="text"
            value={data?.donorOffer.donorName}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            placeholder="Donor name"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Partner Request Deadline
          </label>
          <input
            type="date"
            value={formatDate(data?.donorOffer.partnerResponseDeadline)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Donor Request Deadline
          </label>
          <input
            type="date"
            value={formatDate(data?.donorOffer.donorResponseDeadline)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            disabled
          />
        </div>
        <div>
          <NewPartnerSearch
            selectedPartners={data?.partners ?? []}
            disabled
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

      {preview && <PreviewTable final={true} data={previewData} />}

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
              fileError
            }
            onClick={showPreview}
            className={
              fileUploaded &&
              !fileError
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
