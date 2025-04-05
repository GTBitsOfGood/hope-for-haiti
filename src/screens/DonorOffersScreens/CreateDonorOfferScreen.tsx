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
  DonorOfferErrorModal
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";

export default function CreateDonorOfferScreen() {
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
  const [offerName, setOfferName] = useState("");
  const [donorName, setDonorName] = useState("");
  const [partnerRequestDeadline, setPartnerRequestDeadline] = useState("");
  const [donorRequestDeadline, setDonorRequestDeadline] = useState("");
  // State is automatically set to UNFINALIZED
  const [selectedPartners, setSelectedPartners] = useState<Partner[]>([]);
  
  // Data and UI state
  const [data, setData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate form fields before processing the file
    if (!offerName || !donorName || !partnerRequestDeadline || !donorRequestDeadline) {
      setErrors(["Please fill out all required fields (Offer Name, Donor Name, Partner Request Deadline, Donor Request Deadline) before uploading a file."]);
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
      formData.append("donorName", donorName);
      formData.append("partnerRequestDeadline", partnerRequestDeadline);
      formData.append("donorRequestDeadline", donorRequestDeadline);
      formData.append("state", DonorOfferState.UNFINALIZED);
      
      // Add partner IDs to form data
      selectedPartners.forEach(partner => {
        formData.append("partnerIds", partner.id.toString());
      });

      // Sending file to the server for validation and preview
      const response = await fetch("/api/donorOffers/create?preview=true", {
        method: "POST",
        body: formData,
      });

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
      setErrors(["An error occurred while processing the file. Please try again."]);
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
    if (!uploadedFile) return;
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("offerName", offerName);
      formData.append("donorName", donorName);
      formData.append("partnerRequestDeadline", partnerRequestDeadline);
      formData.append("donorRequestDeadline", donorRequestDeadline);
      formData.append("state", DonorOfferState.UNFINALIZED);
      
      // Add partner IDs to form data
      selectedPartners.forEach(partner => {
        formData.append("partnerIds", partner.id.toString());
      });

      const response = await fetch("/api/donorOffers/create", {
        method: "POST",
        body: formData,
      });

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
      console.error("Error creating donor offer:", error);
      setErrors(["An error occurred while creating the donor offer. Please try again."]);
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
            Submit Offer
          </button>
        ) : (
          <button
            disabled={!fileUploaded || fileError || !offerName || !donorName || !partnerRequestDeadline || !donorRequestDeadline}
            onClick={showPreview}
            className={
              fileUploaded && !fileError && offerName && donorName && partnerRequestDeadline && donorRequestDeadline
                ? "bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
                : "bg-red-500 opacity-50 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
            }
          >
            Preview Offer
          </button>
        )}
      </div>
      
      {isLoading && (
        <BulkAddLoadingModal />
      )}
      
      {isSuccess && (
        <DonorOfferSuccessModal 
          setIsOpen={setIsSuccess}
          resetUpload={resetUpload}
        />
      )}
      
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