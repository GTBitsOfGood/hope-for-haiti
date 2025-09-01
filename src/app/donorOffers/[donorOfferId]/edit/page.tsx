"use client";

import { useState } from "react";
import { DonorOfferState } from "@prisma/client";
import {
  ErrorDisplay,
  PartnerSearch,
  Partner,
  DonorOfferSuccessModal,
} from "@/components/DonorOffers";
import BulkAddLoadingModal from "@/components/BulkAdd/BulkAddLoadingModal";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { Check, Pencil, Plus, Trash } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";

interface DonorOfferItem {
  id?: number;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: number;
  editing?: boolean;
}

export default function EditDonorOfferPage() {
  const { donorOfferId } = useParams();
  const router = useRouter();

  const [offerName, setOfferName] = useState("");
  const [donorName, setDonorName] = useState("");
  const [partnerRequestDeadline, setPartnerRequestDeadline] = useState("");
  const [donorRequestDeadline, setDonorRequestDeadline] = useState("");
  const [selectedPartners, setSelectedPartners] = useState<Partner[]>([]);

  const [items, setData] = useState<DonorOfferItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isLoading: isLoadingDetails } = useFetch<{
    offerName: string;
    donorName: string;
    donorResponseDeadline: string;
    partnerResponseDeadline: string;
    partners: [Partner];
    items: DonorOfferItem[];
  }>(`/api/donorOffers/${donorOfferId}/edit`, {
    onSuccess: (data) => {
      setOfferName(data.offerName);
      setDonorName(data.donorName);
      setPartnerRequestDeadline(
        new Date(data.partnerResponseDeadline).toISOString().substring(0, 10)
      );
      setDonorRequestDeadline(
        new Date(data.donorResponseDeadline).toISOString().substring(0, 10)
      );
      setSelectedPartners(data.partners);
      setData(data.items);
    },
    onError: (error) => {
      console.error("Error fetching donor offer details:", error);
      setErrors(["Failed to load donor offer details. Please try again."]);
    },
  });

  const { isLoading: isSubmitting, apiClient } = useApiClient();

  const handleAddItem = () => {
    const newItem: DonorOfferItem = {
      title: "",
      type: "",
      quantity: 0,
      expirationDate: "",
      unitType: "",
      quantityPerUnit: 0,
      editing: true,
    };
    setData([...items, newItem]);
  };

  const handleSaveItem = (index: number) => {
    const item = items[index];
    if (item.title === "") return toast.error("Item must have a title");
    if (item.type === "") return toast.error("Item must have a type");
    if (item.quantity === 0)
      return toast.error("Item quantity must be greater than 0");
    if (item.unitType === "") return toast.error("Item must have a unit type");
    if (item.quantityPerUnit === 0)
      return toast.error("Item quantity per unit must be greater than 0");

    const newItems = [...items];
    newItems[index] = { ...newItems[index], editing: false };
    setData(newItems);
  };

  const handleToggleEdit = (index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], editing: !newItems[index].editing };
    setData(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof DonorOfferItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData(newItems);
  };

  const handleSubmit = async () => {
    if (items.some((i) => i.editing)) {
      return toast.error("Finish editing items before submitting");
    }

    const formData = new FormData();
    formData.append("offerName", offerName);
    formData.append("donorName", donorName);
    formData.append("partnerRequestDeadline", partnerRequestDeadline);
    formData.append("donorRequestDeadline", donorRequestDeadline);
    formData.append("state", DonorOfferState.UNFINALIZED);

    selectedPartners.forEach((partner) => {
      formData.append("partnerIds", partner.id.toString());
    });

    items.forEach((item) => {
      formData.append("items", JSON.stringify(item));
    });

    try {
      await apiClient.put(`/api/donorOffers/${donorOfferId}/edit`, { body: formData });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error updating donor offer:", error);
      setErrors(["An error occurred while updating the donor offer. Please try again."]);
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

      <div className="overflow-x-scroll">
        <table className="mt-4 min-w-full">
          <thead>
            <tr className="bg-blue-primary opacity-80 text-white border-b-2">
              <th className="px-4 py-2 rounded-tl-lg text-left">Item Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Expiration</th>
              <th className="px-4 py-2 text-left">Unit Type</th>
              <th className="px-4 py-2 text-left">Qty/Unit</th>
              <th className="px-4 py-2 text-left rounded-tr-lg"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <tr
                  data-odd={index % 2 !== 0}
                  className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
                >
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handleItemChange(index, "title", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.title
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) =>
                          handleItemChange(index, "type", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.type
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="date"
                        value={item.expirationDate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "expirationDate",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : item.expirationDate ? (
                      new Date(item.expirationDate).toLocaleDateString()
                    ) : (
                      "None"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="text"
                        value={item.unitType}
                        onChange={(e) =>
                          handleItemChange(index, "unitType", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.unitType
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.editing ? (
                      <input
                        type="number"
                        min={0}
                        value={item.quantityPerUnit}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantityPerUnit",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      item.quantityPerUnit
                    )}
                  </td>
                  {!item.editing ? (
                    <td className="px-4 py-2">
                      <button onClick={() => handleToggleEdit(index)}>
                        <Pencil size={20} />
                      </button>
                    </td>
                  ) : (
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => handleSaveItem(index)}>
                        <Check size={20} />
                      </button>
                      {!item.id && (
                        <button
                          onClick={() => {
                            const newItems = items.filter(
                              (_, i) => i !== index
                            );
                            setData(newItems);
                          }}
                        >
                          <Trash size={20} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAddItem}
        className="mt-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
      >
        <Plus size={18} /> Add Item
      </button>

      {errors && errors.length > 0 && <ErrorDisplay errors={errors} />}

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
        >
          Save Donor Offer
        </button>
      </div>

      {isSubmitting && <BulkAddLoadingModal />}

      {isSuccess && <DonorOfferSuccessModal />}
    </div>
  );
}
