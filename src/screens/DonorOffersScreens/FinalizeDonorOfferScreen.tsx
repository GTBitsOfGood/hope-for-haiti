import { useState, useRef, useEffect } from "react";
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
import { useRouter, useParams } from "next/navigation";
import { PartnerSearch as NewPartnerSearch } from "@/components/DonorOffers/PartnerSearch";

export default function FinalizeDonorOfferScreen() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const donorOfferId = params.donorOfferId as string;

  // Add file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileError, setFileError] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File>();

  // Donor offer form state
  const [donorOfferForm, setDonorOfferForm] = useState<{
    partnerRequestDeadline: string;
    donorRequestDeadline: string;
  }>({
    partnerRequestDeadline: "",
    donorRequestDeadline: "",
  });

  // State is automatically set to FINALIZED
  const [selectedPartners, setSelectedPartners] = useState<
    { id: number; name: string }[]
  >([]);

  // Store offer name separately since it's display-only
  const [offerName, setOfferName] = useState("");

  // Data and UI state
  const [data, setData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Redirect partners to donor offers page
  useEffect(() => {
    if (session?.user?.type === "PARTNER") {
      router.replace("/donorOffers");
    }
  }, [session, router]);

  // Fetch donor offer details
  useEffect(() => {
    const fetchDonorOfferDetails = async () => {
      if (!donorOfferId) return;

      try {
        setIsLoadingDetails(true);
        const response = await fetch(
          `/api/donorOffers/${donorOfferId}/finalize`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            router.replace("/donorOffers");
            return;
          }
          const errorData = await response.json();
          throw new Error(
            errorData.errors?.[0] || "Failed to fetch donor offer details"
          );
        }

        const donorOfferDetails = await response.json();

        // Set form values from the fetched data
        setOfferName(donorOfferDetails.offerName);
        setDonorOfferForm({
          partnerRequestDeadline: donorOfferDetails.partnerRequestDeadline,
          donorRequestDeadline: donorOfferDetails.donorRequestDeadline,
        });
        setSelectedPartners(donorOfferDetails.partners || []);
      } catch (error) {
        console.error("Error fetching donor offer details:", error);
        setErrors(["Failed to load donor offer details. Please try again."]);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDonorOfferDetails();
  }, [donorOfferId, router]);

  // If user is a partner, don't render the create screen
  if (session?.user?.type === "PARTNER") {
    return null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate form fields before processing the file
    if (
      !donorOfferForm.partnerRequestDeadline ||
      !donorOfferForm.donorRequestDeadline
    ) {
      setErrors([
        "Please fill out all required fields (Partner Request Deadline, Donor Request Deadline) before uploading a file.",
      ]);
      // Reset file input when validation fails
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploadedFile(file);
    setFileLoading(true);
    setFileName(file.name);
    setFileSize(file.size);
    setFileError(false);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
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

      // Sending file to the server for validation and preview
      const response = await fetch(
        `/api/donorOffers/${donorOfferId}/finalize?preview=true`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const { errors } = await response.json();
        setErrors(errors);
        setFileUploaded(false);
        setFileError(true);
        setFileLoading(false);
        return;
      }

      // File is valid and preview data is received
      const { donorOfferItems } = await response.json();
      setData(donorOfferItems);
      setFileUploaded(true);
      setFileLoading(false);
    } catch (error) {
      console.error("File processing error:", error);
      setFileError(true);
      setFileLoading(false);
      setErrors([
        "An error occurred while processing the file. Please try again.",
      ]);
    }
  };

  const showPreview = () => {
    if (!fileUploaded || fileError) return;

    setPreview(true);
  };

  const resetUpload = () => {
    // Reset file states
    setPreview(false);
    setFileUploaded(false);
    setFileError(false);
    setFileName("");
    setFileSize(0);
    setFileLoading(false);
    setUploadedFile(undefined);

    // Reset UI states
    setIsSuccess(false);
    setIsError(false);
    setErrors([]);

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      setErrors(["Please upload a file"]);
      return;
    }

    if (!donorOfferForm.partnerRequestDeadline) {
      setErrors(["Please enter a partner request deadline"]);
      return;
    }

    if (!donorOfferForm.donorRequestDeadline) {
      setErrors(["Please enter a donor request deadline"]);
      return;
    }

    if (selectedPartners.length === 0) {
      setErrors(["Please select at least one partner"]);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
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

      // Sending file to the server for finalization
      const response = await fetch(
        `/api/donorOffers/${donorOfferId}/finalize`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setIsLoading(false);
        setIsSuccess(true);
      } else {
        setIsLoading(false);
        setIsError(true);
        const { errors } = await response.json();
        setErrors(errors);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error finalizing donor offer:", error);
      setErrors([
        "An error occurred while finalizing the donor offer. Please try again.",
      ]);
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
        {" "}
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

      {preview && <PreviewTable data={data} />}

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

      {isLoading && <BulkAddLoadingModal />}

      {isSuccess && <DonorOfferSuccessModal />}

      {isError && (
        <DonorOfferErrorModal
          setErrorOpen={setIsError}
          resetUpload={resetUpload}
          errors={errors}
        />
      )}
    </div>
  );
}
