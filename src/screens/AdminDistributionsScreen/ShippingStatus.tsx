import ShippingStatusTable from "@/components/ShippingStatusTable";
import ShippingItemsModal from "@/components/ShippingItemsModal";
import { useState } from "react";

export interface ItemEntry {
  title: string;
  quantityAllocated: number;
  quantityAvailable: number;
  quantityTotal: number;
  donorName: string;
  palletNumber: number;
  boxNumber: number;
  lotNumber: number;
  unitPrice: number;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  comment: string;
}

export default function ShippingStatus() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [hfhShippingNumber, setHfhShippingNumber] = useState("");
  const [donorShippingNumber, setDonorShippingNumber] = useState("");
  const [items, setItems] = useState<ItemEntry[]>([]);

  const openModal = (
    hfhShippingNumber: string,
    donorShippingNumber: string,
    items: ItemEntry[]
  ) => {
    setModalIsOpen(true);
    setHfhShippingNumber(hfhShippingNumber);
    setDonorShippingNumber(donorShippingNumber);
    setItems(items);
  };
  return (
    <>
      {modalIsOpen && (
        <ShippingItemsModal
          setIsOpen={setModalIsOpen}
          hfhShippingNumber={hfhShippingNumber}
          donorShippingNumber={donorShippingNumber}
          items={items}
        />
      )}
      <ShippingStatusTable openModal={openModal} />
    </>
  );
}
