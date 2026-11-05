"use client";

import { useState, useRef, type ChangeEvent } from "react";
import FileUpload from "@/components/FileUpload";
import { DonorOffer, GeneralItem, GeneralItemRequest } from "@prisma/client";
import {
  FileInfoDisplay,
  ErrorDisplay,
  PreviewTable,
  DonorOfferItem,
  DonorOfferSuccessModal,
  DonorOfferErrorModal,
  PriceCheckSummary,
  PriceCheckStepperModal,
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import { useSession } from "next-auth/react";
import { redirect, useParams, useRouter } from "next/navigation";
import { PartnerSearch as NewPartnerSearch, Partner } from "@/components/DonorOffers/PartnerSearch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient, extractErrorMessages } from "@/hooks/useApiClient";
import { DonorOfferHeader } from "@/components/DonorOffers/DonorOfferHeader";
import { hasPermission } from "@/lib/userUtils";
import type { PriceCheckedItem } from "@/types/api/donorOffer.types";
import {
  canFinalize as derivePriceCheckCanFinalize,
  codesNeedingPrice,
  itemsNeedingPrice,
  summarize as summarizePriceCheck,
  validateCodeOverride,
} from "@/util/priceCheck";
import Papa from "papaparse";

function serializeCodeOverrides(overrides: Record<number, string>): string {
  return JSON.stringify(
    Object.entries(overrides)
      .map(([row, code]) => ({ row: Number(row), code }))
      .sort((left, right) => left.row - right.row)
  );
}

export default function FinalizeDonorOfferPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const donorOfferId = params.donorOfferId as string;
  const canManageOffers = hasPermission(session?.user, "offerWrite");

  if (session?.user?.type === "PARTNER") {
    redirect("/donorOffers");
  }

  if (!canManageOffers) {
    redirect(`/donorOffers/${donorOfferId}`);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeOverridesRef = useRef<Record<number, string>>({});
  const checkInFlightRef = useRef(false);

  const [previewData, setPreviewData] = useState<DonorOfferItem[]>([]);
  const [preview, setPreview] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [backendCanFinalize, setBackendCanFinalize] = useState<boolean | undefined>(undefined);
  const [stepperItems, setStepperItems] = useState<PriceCheckedItem[] | null>(null);

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

  if (data?.donorOffer && data.donorOffer.state !== "UNFINALIZED") {
    redirect(`/donorOffers/${donorOfferId}`);
  }

  const {
    fileName,
    fileSize,
    fileErrorMessage,
    fileUploaded,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    rerunPreview,
    resetUpload: resetFileUpload,
  } = useFileUpload<{ donorOfferItems: DonorOfferItem[]; canFinalize?: boolean }>({
    previewEndpoint: `/api/donorOffers/${donorOfferId}?preview=true`,
    previewEndpointMethod: "PATCH",
    onSuccess: (result) => {
      setPreviewData(result.donorOfferItems);
      setBackendCanFinalize(result.canFinalize);
    },
    buildFormData: (_, formData) => {
      const overrides = codeOverridesRef.current;
      if (Object.keys(overrides).length > 0) {
        formData.append("codeOverrides", serializeCodeOverrides(overrides));
      }
      return formData;
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

  // TEMP (#380): priceCheck is only present once the backend ticket attaches
  // it to every Preview row. Rows without it are simply excluded here, so
  // the summary/lock logic degrades to "nothing to check" until it lands.
  const priceCheckedItems: PriceCheckedItem[] = previewData
    .map((item, index) => ({ item, index }))
    .filter(
      (entry): entry is { item: DonorOfferItem & { priceCheck: NonNullable<DonorOfferItem["priceCheck"]> }; index: number } =>
        !!entry.item.priceCheck
    )
    .map(({ item, index }) => ({
      row: item.row ?? index + 1,
      title: item.title,
      priceCheck: item.priceCheck,
    }));
  const blockingItems = itemsNeedingPrice(priceCheckedItems);
  const canFinalizeNow = backendCanFinalize ?? derivePriceCheckCanFinalize(priceCheckedItems);
  const priceCheckSummary = summarizePriceCheck(priceCheckedItems);

  const openPriceAction = (item: DonorOfferItem) => {
    if (!item.priceCheck) return;
    setStepperItems([{ row: item.row ?? 0, title: item.title, priceCheck: item.priceCheck }]);
  };

  const handleStepperSaved = async () => {
    if (uploadedFile) await rerunPreview();
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    codeOverridesRef.current = {};
    await handleFileChange(event);
  };

  const handleCodeCheck = async (row: number, code: string): Promise<string | null> => {
    if (checkInFlightRef.current) {
      return "Please wait for the current check to finish.";
    }

    const item = previewData.find((entry, index) => (entry.row ?? index + 1) === row);
    if (!item?.priceCheck) {
      return "This row is no longer available. Refresh Preview and try again.";
    }
    if (!uploadedFile) {
      return "Upload a file before checking a code.";
    }

    const validation = validateCodeOverride(item.priceCheck.code, code);
    if (validation.status === "error") {
      return validation.message;
    }

    checkInFlightRef.current = true;
    const previousValue = codeOverridesRef.current[row];
    codeOverridesRef.current = { ...codeOverridesRef.current, [row]: validation.value };
    try {
      const checked = await rerunPreview();
      if (checked === "error") {
        const current = codeOverridesRef.current;
        if (current[row] === validation.value) {
          const next = { ...current };
          if (previousValue === undefined) delete next[row];
          else next[row] = previousValue;
          codeOverridesRef.current = next;
        }
        return "Unable to check this code. Please try again.";
      }
      // "superseded" means a newer Preview already owns the result. Keep the
      // row override instead of restoring a stale snapshot.
      return null;
    } finally {
      checkInFlightRef.current = false;
    }
  };

  const downloadPriceList = () => {
    const rows = codesNeedingPrice(priceCheckedItems).map((r) => ({
      Code: r.code,
      Name: r.name,
      Price: r.price,
      "Old price": r.oldPrice,
    }));
    // BOM prefix so Excel detects UTF-8 correctly (same as donorOfferService.ts's CSV export).
    const csv = String.fromCharCode(0xfeff) + Papa.unparse(rows, { columns: ["Code", "Name", "Price", "Old price"] });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "prices-needed.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const showPreview = () => {
    if (!fileUploaded || fileErrorMessage) return;
    setPreview(true);
  };

  // fileErrorMessage duplicates errors[0] only when they were set together (API/network failures);
  // don't assume that invariant holds for every errors-setting path.
  const additionalErrors =
    fileErrorMessage && errors[0] === fileErrorMessage ? errors.slice(1) : errors;

  const resetUpload = () => {
    resetFileUpload();
    codeOverridesRef.current = {};
    setPreview(false);
    setPreviewData([]);
    setBackendCanFinalize(undefined);
    setStepperItems(null);
    setIsSuccess(false);
    setIsError(false);
    setSubmitErrors([]);

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
    if (Object.keys(codeOverridesRef.current).length > 0) {
      formData.append("codeOverrides", serializeCodeOverrides(codeOverridesRef.current));
    }

    try {
      await apiClient.patch(`/api/donorOffers/${donorOfferId}`, {
        body: formData,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error finalizing donor offer:", error);
      setSubmitErrors(
        extractErrorMessages(
          error,
          "An error occurred while finalizing the donor offer. Please try again."
        )
      );
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
            handleFileChange={handleFileSelection}
            ref={fileInputRef}
          />
        </div>
      )}

      <h2 className="mt-6 mb-1 font-light text-sm">Uploaded</h2>
      <FileInfoDisplay
        fileName={fileName}
        fileSize={fileSize}
        fileErrorMessage={fileErrorMessage}
        onReset={resetUpload}
      />

      {additionalErrors.length > 0 && <ErrorDisplay errors={additionalErrors} />}

      {preview && (
        <>
          <PriceCheckSummary items={priceCheckedItems} />
          <div className="flex gap-3 mt-3">
            {blockingItems.length > 0 && (
              <button
                type="button"
                onClick={() => setStepperItems(blockingItems)}
                className="bg-red-500 hover:bg-red-700 text-white py-1 px-4 rounded text-sm"
              >
                Add prices
              </button>
            )}
            {codesNeedingPrice(priceCheckedItems).length > 0 && (
              <button
                type="button"
                onClick={downloadPriceList}
                className="bg-white hover:bg-gray-100 text-red-500 border border-red-500 py-1 px-4 rounded text-sm"
              >
                Download list
              </button>
            )}
          </div>
          <PreviewTable
            final={true}
            data={previewData}
            onPriceAction={openPriceAction}
            onCodeCheck={handleCodeCheck}
            checking={fileLoading}
          />
        </>
      )}

      <div className="flex flex-col items-end mt-4">
        {preview && !canFinalizeNow && (
          <p className="text-sm text-red-600 mb-1">
            {priceCheckSummary.needsPriceCount} row
            {priceCheckSummary.needsPriceCount === 1 ? " needs" : "s need"} a price before you can finalize
          </p>
        )}
        <div className="flex">
        <button
          onClick={() => router.push("/donorOffers")}
          className="bg-white hover:bg-gray-100 w-48 text-red-500 border border-red-500 py-1 px-4 mt-1 mb-6 rounded text-sm"
        >
          Cancel
        </button>
        {preview ? (
          <button
            disabled={!canFinalizeNow}
            onClick={handleSubmit}
            className={
              canFinalizeNow
                ? "bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
                : "bg-red-500 opacity-50 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
            }
          >
            Finalize Offer
          </button>
        ) : (
          <button
            disabled={
              !fileUploaded ||
              !!fileErrorMessage
            }
            onClick={showPreview}
            className={
              fileUploaded &&
              !fileErrorMessage
                ? "bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
                : "bg-red-500 opacity-50 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
            }
          >
            Preview Offer
          </button>
        )}
        </div>
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

      {stepperItems && (
        <PriceCheckStepperModal
          items={stepperItems}
          onClose={() => setStepperItems(null)}
          onSaved={handleStepperSaved}
        />
      )}
    </div>
  );
}
