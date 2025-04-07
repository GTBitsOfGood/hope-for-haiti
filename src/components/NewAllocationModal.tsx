"use client";

import React, { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";

interface AddAllocationModalProps {
  onClose: () => void;
  unallocatedItemRequestId: string;
  title: string;
  type: string;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  searchResults: {
    donorNames: string[];
    lotNumbers: number[];
    palletNumbers: number[];
    boxNumbers: number[];
  };
}

export default function AddAllocationModal({
  onClose,
  unallocatedItemRequestId,
  title,
  type,
  expirationDate,
  unitType,
  quantityPerUnit,
  searchResults: initialSearchResults,
}: AddAllocationModalProps) {
  const [allDonorNames, setAllDonorNames] = useState<string[]>([]);
  const [lotNumbers, setLotNumbers] = useState<number[]>([]);
  const [palletNumbers, setPalletNumbers] = useState<number[]>([]);
  const [boxNumbers, setBoxNumbers] = useState<number[]>([]);
  const [selectedDonor, setSelectedDonor] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [selectedPallet, setSelectedPallet] = useState("");
  const [selectedBox, setSelectedBox] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showDonorList, setShowDonorList] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  useEffect(() => {
    console.log(
      "[NewAllocationModal] Mounted with initialSearchResults:",
      initialSearchResults
    );
    setAllDonorNames(initialSearchResults.donorNames);
    setLotNumbers(initialSearchResults.lotNumbers);
    setPalletNumbers(initialSearchResults.palletNumbers);
    setBoxNumbers(initialSearchResults.boxNumbers);
  }, [initialSearchResults]);

  useEffect(() => {
    (async () => {
      const query = new URLSearchParams({
        title,
        type,
        unitType,
        quantityPerUnit: quantityPerUnit.toString(),
        ...(expirationDate ? { expirationDate } : {}),
      });

      if (selectedDonor) query.append("donorName", selectedDonor);
      if (selectedLot) query.append("lotNumber", selectedLot);
      if (selectedPallet) query.append("palletNumber", selectedPallet);
      if (selectedBox) query.append("boxNumber", selectedBox);

      const url = "/api/allocations/itemSearch?" + query.toString();
      console.log("[NewAllocationModal] GET", url);

      try {
        const res = await fetch(url);
        console.log(
          "[NewAllocationModal] fetchFilteredByDonor status:",
          res.status
        );
        if (!res.ok) {
          console.error(
            "[NewAllocationModal] Item search filter by donor failed:",
            res.status
          );
          return;
        }
        const data = await res.json();
        console.log(
          "[NewAllocationModal] Server returned data for donor filter:",
          data
        );

        setLotNumbers(data.lotNumbers);
        setPalletNumbers(data.palletNumbers);
        setBoxNumbers(data.boxNumbers);
      } catch (err) {
        console.error(
          "[NewAllocationModal] Error in fetchFilteredByDonor:",
          err
        );
      }
    })();
  }, [
    expirationDate,
    quantityPerUnit,
    selectedBox,
    selectedDonor,
    selectedLot,
    selectedPallet,
    title,
    type,
    unitType,
  ]);

  // filter donor options using the full lis
  const displayedDonors = donorSearch
    ? allDonorNames.filter((dn) =>
        dn.toLowerCase().includes(donorSearch.toLowerCase())
      )
    : allDonorNames;

  function handleSelectDonor(donor: string) {
    console.log("[NewAllocationModal] handleSelectDonor picking:", donor);
    setSelectedDonor(donor);
    setShowDonorList(false);
  }

  function handleSelectLot(newLot: string) {
    console.log("[NewAllocationModal] handleSelectLot picking:", newLot);
    setSelectedLot(newLot);
  }

  function handleSelectPallet(newPal: string) {
    console.log("[NewAllocationModal] handleSelectPallet picking:", newPal);
    setSelectedPallet(newPal);
  }

  function handleSelectBox(newBox: string) {
    console.log("[NewAllocationModal] handleSelectBox picking:", newBox);
    setSelectedBox(newBox);
  }

  function handleConfirm() {
    console.log("[NewAllocationModal] handleConfirm picks:", {
      donor: selectedDonor,
      lot: selectedLot,
      pallet: selectedPallet,
      box: selectedBox,
      quantity,
    });

    if (
      !unallocatedItemRequestId ||
      !title ||
      !type ||
      !expirationDate ||
      !unitType ||
      !selectedDonor ||
      !selectedLot ||
      !selectedPallet ||
      !selectedBox ||
      !quantity
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("unallocatedItemRequestId", unallocatedItemRequestId);
    formData.append("title", title);
    formData.append("type", type);
    formData.append("expirationDate", expirationDate);
    formData.append("unitType", unitType);
    formData.append("quantityPerUnit", quantityPerUnit.toString());
    formData.append("donorName", selectedDonor);
    formData.append("lotNumber", selectedLot);
    formData.append("palletNumber", selectedPallet);
    formData.append("boxNumber", selectedBox);
    formData.append("quantity", quantity);

    fetch("/api/allocations", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        console.log(
          "[NewAllocationModal] POST /api/allocations status:",
          res.status
        );

        if (res.status === 400) {
          const text = await res.text();
          alert(`Missing or invalid fields: ${text}`);
        } else if (res.status === 404) {
          alert("No matching item found with the provided fields.");
        } else if (!res.ok) {
          const text = await res.text();
          alert(`Unexpected error: ${text}`);
        } else {
          onClose();
        }
      })
      .catch((err) => {
        console.error("[NewAllocationModal] Error confirming allocation:", err);
        alert(`Error in confirm: ${err.message}`);
      });
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-md p-6 font-[Open_Sans] text-[#22070B]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#22070B] hover:text-mainRed"
        >
          <X size={20} weight="bold" />
        </button>

        <h1 className="text-[24px] leading-[32px] font-bold text-[#22070B] mb-1">
          Add allocation
        </h1>
        <p className="text-sm mb-5">
          Fields marked with <span className="text-mainRed">*</span> are
          required
        </p>

        <div className="space-y-5">
          <div className="relative">
            <label className="block text-[16px] font-normal mb-2">
              Donor name <span className="text-mainRed">*</span>
            </label>
            <div
              className="w-full rounded border border-[#22070B1A] bg-[#F9F9F9] p-2 text-[16px] text-[#22070B] cursor-pointer relative"
              onClick={() => setShowDonorList(!showDonorList)}
            >
              <span className="text-[#22070B80] select-none">
                {selectedDonor || "Donor name"}
              </span>
            </div>

            {showDonorList && (
              <div className="absolute left-0 w-full bg-white border border-gray-200 shadow rounded p-2 mt-1 z-20">
                <input
                  type="text"
                  placeholder=""
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="w-full border-0 border-b border-gray-300 focus:border-mainRed focus:outline-none pb-1 mb-2"
                  style={{ boxShadow: "none" }}
                />
                <div className="flex flex-col items-center gap-2">
                  {displayedDonors.length === 0 && donorSearch && (
                    <p className="text-center text-sm text-gray-400">
                      No donors found
                    </p>
                  )}
                  {displayedDonors.map((dn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectDonor(dn)}
                      className="bg-mainRed text-white py-1.5 px-4 rounded-lg hover:opacity-90 transition inline-flex"
                    >
                      {dn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[16px] font-normal mb-2">
              Lot number <span className="text-mainRed">*</span>
            </label>
            <select
              className="w-full rounded border border-[#22070B1A] bg-[#F9F9F9] p-2 text-[16px] text-[#22070B] focus:outline-none"
              value={selectedLot}
              onChange={(e) => handleSelectLot(e.target.value)}
            >
              <option value="" className="text-[#22070B80]">
                Select lot
              </option>
              {lotNumbers.map((lot) => (
                <option key={lot} value={String(lot)}>
                  {lot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[16px] font-normal mb-2">
              Pallet <span className="text-mainRed">*</span>
            </label>
            <select
              className="w-full rounded border border-[#22070B1A] bg-[#F9F9F9] p-2 text-[16px] text-[#22070B] focus:outline-none"
              value={selectedPallet}
              onChange={(e) => handleSelectPallet(e.target.value)}
            >
              <option value="" className="text-[#22070B80]">
                Select pallet
              </option>
              {palletNumbers.map((pal) => (
                <option key={pal} value={String(pal)}>
                  {pal}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[16px] font-normal mb-2">
              Box number <span className="text-mainRed">*</span>
            </label>
            <select
              className="w-full rounded border border-[#22070B1A] bg-[#F9F9F9] p-2 text-[16px] text-[#22070B] focus:outline-none"
              value={selectedBox}
              onChange={(e) => handleSelectBox(e.target.value)}
            >
              <option value="" className="text-[#22070B80]">
                Select box
              </option>
              {boxNumbers.map((box) => (
                <option key={box} value={String(box)}>
                  {box}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[16px] font-normal mb-2">
              Quantity <span className="text-mainRed">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                className="w-3/5 rounded border border-[#22070B1A] bg-white p-2 text-[16px] text-[#22070B] placeholder:text-[#22070B80] focus:outline-none"
                placeholder="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <span className="text-[16px] text-[#22070B]">/ 20</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            className="border border-mainRed text-mainRed px-4 py-2 rounded hover:bg-[#22070B0A] transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-mainRed text-white px-4 py-2 rounded hover:bg-red-600 transition"
            onClick={handleConfirm}
          >
            Add to Partner&apos;s Distribution
          </button>
        </div>
      </div>
    </div>
  );
}
