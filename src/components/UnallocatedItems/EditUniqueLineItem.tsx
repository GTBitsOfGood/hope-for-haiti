"use client";

import { Dialog, Transition, Switch } from "@headlessui/react";
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
          letterSpacing: "0.2px",
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

        {/* TODO: fix scrollbar */}
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
                  color: "#22070B",
                  maxHeight: "40vh",
                  letterSpacing: "0.2px",
                }}
              >
                {/* Top-right "X" close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 p-1"
                  onClick={onClose}
                  aria-label="Close"
                  style={{ color: "#22070B", letterSpacing: "0.5px" }}
                >
                  <X size={24} />
                </button>
                <Dialog.Title
                  as="h2"
                  className="text-2xl font-semibold mb-2"
                  style={{
                    fontSize: "24px",
                    letterSpacing: "0.2px",
                  }}
                >
                  Edit Unique Line Item
                </Dialog.Title>
                <p
                  className="text-sm mb-6 pt-4"
                  style={{
                    fontSize: "14px",
                    color: "#22070B",
                    letterSpacing: "0.2px",
                  }}
                >
                  Fields marked with <span style={{ color: "#EF3533" }}>*</span>{" "}
                  are required
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-base font-normal"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2px",
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
                        letterSpacing: "0.2px",
                        padding: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-base font-normal"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2px",
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
                        letterSpacing: "0.2px",
                        padding: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-base font-normal"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2px",
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
                        letterSpacing: "0.2px",
                        padding: "8px",
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-base font-normal"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.2px",
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
                          letterSpacing: "0.2px",
                          padding: "8px",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-base font-normal"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2px",
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
                        letterSpacing: "0.2px",
                        padding: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-base font-normal"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2px",
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
                        letterSpacing: "0.2px",
                        padding: "8px",
                        resize: "none",
                        height: "80px",
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="border border-[#E0E0E0] rounded-md p-4">
                      <div className="flex items-start">
                        <Switch
                          checked={visible}
                          onChange={setVisible}
                          className={`${visible ? "bg-gray-700" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                        >
                          <span className="sr-only">
                            Make Item Visible to Partners?
                          </span>
                          <span
                            className={`${visible ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                          />
                        </Switch>
                        <div className="ml-3 flex-1">
                          <label
                            className="text-base font-normal block"
                            style={{
                              color: "#22070B",
                              fontFamily: "Open Sans, sans-serif",
                            }}
                          >
                            Make Item Visible to Partners?
                          </label>
                          <p
                            className="mt-1"
                            style={{
                              color: "#71839B",
                              fontSize: "12px",
                              fontFamily: "Open Sans, sans-serif",
                              textAlign: "left",
                            }}
                          >
                            Once visible, partners can view and request this
                            item for distribution.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-[#E0E0E0] rounded-md p-4">
                      <div className="flex items-start">
                        <Switch
                          checked={allowAllocations}
                          onChange={setAllowAllocations}
                          className={`${allowAllocations ? "bg-gray-700" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                        >
                          <span className="sr-only">Allow Allocations?</span>
                          <span
                            className={`${allowAllocations ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                          />
                        </Switch>
                        <div className="ml-3 flex-1">
                          <label
                            className="text-base font-normal block"
                            style={{
                              color: "#22070B",
                              fontFamily: "Open Sans, sans-serif",
                            }}
                          >
                            Allow Allocations?
                          </label>
                          <p
                            className="mt-1"
                            style={{
                              color: "#71839B",
                              fontSize: "12px",
                              fontFamily: "Open Sans, sans-serif",
                              textAlign: "left",
                            }}
                          >
                            Once allowed, the item can be added to a partner’s
                            pending distribution.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-[#E0E0E0] rounded-md p-4">
                      <div className="flex items-start">
                        <Switch
                          checked={gik}
                          onChange={setGik}
                          className={`${gik ? "bg-gray-700" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                        >
                          <span className="sr-only">Marked item as GIK?</span>
                          <span
                            className={`${gik ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                          />
                        </Switch>
                        <div className="ml-3 flex-1">
                          <label
                            className="text-base font-normal block"
                            style={{
                              color: "#22070B",
                              fontFamily: "Open Sans, sans-serif",
                            }}
                          >
                            Marked Item as GIK?
                          </label>
                          <p
                            className="mt-1"
                            style={{
                              color: "#71839B",
                              fontSize: "12px",
                              fontFamily: "Open Sans, sans-serif",
                              textAlign: "left",
                            }}
                          >
                            Once allowed, the item will be marked as GIK and
                            added to the general unallocated items table.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex w-full space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded flex-1"
                      style={{
                        fontSize: "16px",

                        letterSpacing: "0.2px",
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
                      className="text-white rounded flex-1"
                      style={{
                        backgroundColor: "#EF3533",
                        fontSize: "16px",

                        letterSpacing: "0.2px",
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
            width: 1px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: #888;
            border-radius: 4px;
            border: 1px solid #f1f1f1;
            height: 2px;
          }
        `}</style>
      </Dialog>
    </Transition>
  );
}
