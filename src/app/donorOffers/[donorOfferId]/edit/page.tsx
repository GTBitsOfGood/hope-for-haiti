"use client";

import { useState } from "react";
import {
  PartnerSearch,
  Partner,
} from "@/components/DonorOffers";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { DonorOfferHeader } from "@/components/DonorOffers/DonorOfferHeader";

export default function EditDonorOfferPage() {
  const { donorOfferId } = useParams();
  const router = useRouter();

  const [offerName, setOfferName] = useState("");
  const [donorName, setDonorName] = useState("");
  const [partnerResponseDeadline, setPartnerResponseDeadline] = useState("");
  const [donorResponseDeadline, setDonorResponseDeadline] = useState("");
  const [selectedPartners, setSelectedPartners] = useState<Partner[]>([]);

  const { isLoading: isLoadingDetails } = useFetch<{
    offerName: string;
    donorName: string;
    donorResponseDeadline: string;
    partnerResponseDeadline: string;
    partners: Partner[];
  }>(`/api/donorOffers/${donorOfferId}?requests=false`, {
    onSuccess: (data) => {
      setOfferName(data.offerName);
      setDonorName(data.donorName);
      setPartnerResponseDeadline(
        new Date(data.partnerResponseDeadline).toISOString().substring(0, 10)
      );
      setDonorResponseDeadline(
        new Date(data.donorResponseDeadline).toISOString().substring(0, 10)
      );
      setSelectedPartners(data.partners);
    },
    onError: (error) => {
      console.error("Error fetching donor offer details:", error);
      toast.error("Failed to load donor offer details");
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("offerName", offerName);
      formData.append("donorName", donorName);
      formData.append("partnerResponseDeadline", partnerResponseDeadline);
      formData.append("donorResponseDeadline", donorResponseDeadline);

      selectedPartners.forEach((partner) => {
        formData.append("partners[]", partner.id.toString());
      });

      await apiClient.patch(`/api/donorOffers/${donorOfferId}`, {
        body: formData
      });
      toast.success("Successfully updated donor offer")
    } catch (error) {
      console.error("Error updating donor offer:", error);
      toast.error("An error occurred while updating the donor offer");
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
      <DonorOfferHeader donorOfferId={donorOfferId} />
      
      <h1 className="mb-4 text-xl font-semibold">Edit Donor Offer</h1>

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
            Donor Response Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={donorResponseDeadline}
            onChange={(e) => setDonorResponseDeadline(e.target.value)}
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-zinc-50 focus:outline-none focus:border-gray-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-light text-black mb-1">
            Partner Response Deadline<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={partnerResponseDeadline}
            onChange={(e) => setPartnerResponseDeadline(e.target.value)}
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

      <div className="flex justify-end mt-4">
        <button
          className="bg-white hover:bg-gray-100 w-48 text-red-500 border border-red-500 py-1 px-4 mt-1 mb-6 rounded text-sm"
          onClick={() => router.push("/donorOffers")}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-red-500 hover:bg-red-700 w-52 ml-4 text-white py-1 px-4 mt-1 mb-6 rounded text-sm"
          disabled={isSubmitting}
        >
          Save Donor Offer
        </button>
      </div>
    </div>
  );
}
