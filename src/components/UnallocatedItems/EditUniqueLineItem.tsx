"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";
import { X } from "@phosphor-icons/react";

interface EditUniqueLineItemProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUniqueLineItemModal({
  isOpen,
  onClose,
}: EditUniqueLineItemProps) {
  const [itemTitle, setItemTitle] = useState("");
  const [donorName, setDonorName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemType, setItemType] = useState("");
  const [unitType, setUnitType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [ndc, setNdc] = useState("");
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [unitPrice, setUnitPrice] = useState("");
  const [quantityPerUnit, setQuantityPerUnit] = useState("");
  const [palletNumber, setPalletNumber] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [donorShippingNumber, setDonorShippingNumber] = useState("");
  const [hfhShippingNumber, setHfhShippingNumber] = useState("");
  const [maxRequestLimit, setMaxRequestLimit] = useState<number | undefined>(
    undefined,
  );
  const [notes, setNotes] = useState("");
  const [visible, setVisible] = useState(true);
  const [allowAllocations, setAllowAllocations] = useState(true);
  const [gik, setGik] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({
      itemTitle,
      donorName,
      itemCategory,
      itemType,
      unitType,
      expirationDate,
      ndc,
      quantity,
      unitPrice,
      quantityPerUnit,
      palletNumber,
      boxNumber,
      lotNumber,
      donorShippingNumber,
      hfhShippingNumber,
      maxRequestLimit,
      notes,
      visible,
      allowAllocations,
      gik,
    });

    toast.success("Item updated successfully!");
    onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        onClose={onClose}
        className="relative z-50 font-sans"
        style={{
          fontFamily: "Open Sans, sans-serif", // Explicitly using Open Sans
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        {/* Centered container with custom scrollbar */}
        <div className="fixed inset-0 custom-scroll overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Modal Panel */}
              <Dialog.Panel
                className="w-full max-w-xl transform overflow-y-auto rounded-md bg-white p-8 text-left align-middle shadow-xl transition-all relative"
                style={{
                  fontFamily: "Open Sans, sans-serif",
                  color: "#22070B",
                  maxHeight: "50vh",
                }}
              >
                {/* Top-right "X" close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 p-1"
                  onClick={onClose}
                  aria-label="Close"
                  style={{ color: "#22070B" }}
                >
                  <X size={24} />
                </button>

                <Dialog.Title
                  as="h2"
                  className="text-2xl font-semibold mb-2"
                  style={{
                    fontSize: "24px",
                    fontFamily: "Open Sans, sans-serif",
                  }}
                >
                  Edit Unique Line Item
                </Dialog.Title>
                <p
                  className="text-sm mb-6"
                  style={{
                    fontSize: "14px",
                    color: "#22070B",
                    fontFamily: "Open Sans, sans-serif",
                  }}
                >
                  Fields marked with <span style={{ color: "#EF3533" }}>*</span>{" "}
                  are required
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Item title <span style={{ color: "#EF3533" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Item title"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Donor name
                      </label>
                      <input
                        type="text"
                        placeholder="Donor name"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Item category
                      </label>
                      <input
                        type="text"
                        placeholder="Item category"
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Item type
                      </label>
                      <input
                        type="text"
                        placeholder="Item type"
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-base font-medium"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                      }}
                    >
                      Lot Number
                    </label>
                    <input
                      type="text"
                      placeholder="Lot #"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                      style={{
                        backgroundColor: "#cebabd1a",
                        border: "1px solid #22070B1A",
                        borderRadius: "4px",
                        color: "#22070B",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-base font-medium"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                      }}
                    >
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      placeholder="Expiration Date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                      style={{
                        backgroundColor: "#cebabd1a",
                        border: "1px solid #22070B1A",
                        borderRadius: "4px",
                        color: "#22070B",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-base font-medium"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                      }}
                    >
                      NDC
                    </label>
                    <input
                      type="text"
                      placeholder="NDC"
                      value={ndc}
                      onChange={(e) => setNdc(e.target.value)}
                      className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                      style={{
                        backgroundColor: "#cebabd1a",
                        border: "1px solid #22070B1A",
                        borderRadius: "4px",
                        color: "#22070B",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Quantity <span style={{ color: "#EF3533" }}>*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Quantity"
                        required
                        value={quantity !== undefined ? quantity : ""}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Unit Type
                      </label>
                      <input
                        type="text"
                        placeholder="Unit Type"
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Unit Price
                      </label>
                      <input
                        type="text"
                        placeholder="Unit Price"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Quantity Per Unit
                      </label>
                      <input
                        type="number"
                        placeholder="Quantity Per Unit"
                        value={quantityPerUnit}
                        onChange={(e) => setQuantityPerUnit(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Pallet #
                      </label>
                      <input
                        type="text"
                        placeholder="Pallet #"
                        value={palletNumber}
                        onChange={(e) => setPalletNumber(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Box #
                      </label>
                      <input
                        type="text"
                        placeholder="Box #"
                        value={boxNumber}
                        onChange={(e) => setBoxNumber(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Donor shipping number
                      </label>
                      <input
                        type="text"
                        placeholder="Donor shipping number"
                        value={donorShippingNumber}
                        onChange={(e) => setDonorShippingNumber(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-medium"
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        HfH shipping number
                      </label>
                      <input
                        type="text"
                        placeholder="HfH shipping number"
                        value={hfhShippingNumber}
                        onChange={(e) => setHfhShippingNumber(e.target.value)}
                        className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                        style={{
                          backgroundColor: "#cebabd1a",
                          border: "1px solid #22070B1A",
                          borderRadius: "4px",
                          color: "#22070B",
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-base font-medium"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                      }}
                    >
                      Maximum limit requested{" "}
                      <span style={{ color: "#EF3533" }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Maximum limit requested"
                      value={
                        maxRequestLimit !== undefined ? maxRequestLimit : ""
                      }
                      onChange={(e) =>
                        setMaxRequestLimit(Number(e.target.value))
                      }
                      className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                      style={{
                        backgroundColor: "#cebabd1a",
                        border: "1px solid #22070B1A",
                        borderRadius: "4px",
                        color: "#22070B",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-base font-medium"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      placeholder="Notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 block w-full focus:outline-none placeholder:text-gray-400"
                      style={{
                        backgroundColor: "#cebabd1a",
                        border: "1px solid #22070B1A",
                        borderRadius: "4px",
                        color: "#22070B",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px",
                        resize: "none",
                        height: "80px",
                      }}
                    />
                  </div>

                  {/* TODO: Fix Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                        className="mr-2 h-4 w-4 border rounded focus:outline-none"
                        style={{
                          borderColor: "#EF3533",
                          accentColor: "#EF3533",
                        }}
                      />
                      <label
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Make item Visible to Partners?
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allowAllocations}
                        onChange={(e) => setAllowAllocations(e.target.checked)}
                        className="mr-2 h-4 w-4 border rounded focus:outline-none"
                        style={{
                          borderColor: "#EF3533",
                          accentColor: "#EF3533",
                        }}
                      />
                      <label
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Allow Allocations?
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gik}
                        onChange={(e) => setGik(e.target.checked)}
                        className="mr-2 h-4 w-4 border rounded focus:outline-none"
                        style={{
                          borderColor: "#EF3533",
                          accentColor: "#EF3533",
                        }}
                      />
                      <label
                        style={{
                          fontSize: "16px",
                          fontFamily: "Open Sans, sans-serif",
                        }}
                      >
                        Marked item as GIK?
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="mr-4 rounded"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        border: "1px solid #EF3533",
                        color: "#EF3533",
                        backgroundColor: "transparent",
                        padding: "8px 16px",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-white rounded"
                      style={{
                        backgroundColor: "#EF3533",
                        fontSize: "16px",
                        fontFamily: "Open Sans, sans-serif",
                        padding: "8px 16px",
                      }}
                    >
                      Add item
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <style jsx>{`
          .custom-scroll::-webkit-scrollbar {
            width: 3px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: #888;
            border-radius: 4px;
            border: 1px solid #f1f1f1;
          }
        `}</style>
      </Dialog>
    </Transition>
  );
}
