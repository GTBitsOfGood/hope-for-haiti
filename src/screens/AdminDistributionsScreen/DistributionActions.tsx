import { DistributionItem } from "@/app/api/distributions/types";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  DotsThree,
  Eye,
  EyeSlash,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";

export default function DistributionActions({
  distribution,
  setDistributions,
}: {
  distribution: DistributionItem;
  setDistributions: Dispatch<SetStateAction<DistributionItem[]>>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleVisibility = async (distribution: DistributionItem) => {
    try {
      const res = await fetch(`/api/distributions/toggleVisibility`, {
        method: "PUT",
        body: JSON.stringify({
          visible: !distribution.visible,
          ids: [distribution.id],
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setDistributions((oldDistributions: DistributionItem[]) => {
        return oldDistributions.map((old) => {
          if (old.id === distribution.id) {
            return {
              ...old,
              visible: !old.visible,
            };
          } else {
            return old;
          }
        });
      });
    } catch (e) {
      toast.error("Error changing visibility", {
        position: "bottom-right",
      });
      console.log(e);
    }
  };

  const removeItem = async () => {
    try {
      const res = await fetch(`/api/distributions/${distribution.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error();
      }

      setDistributions((oldDistributions: DistributionItem[]) => {
        return oldDistributions.filter((old) => old.id !== distribution.id);
      });

      setIsOpen(false);
    } catch (e) {
      toast.error("Error removing item", {
        position: "bottom-right",
      });
      console.log(e);
    }
  };
  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[400px] relative max-h-[90vh] text-gray-primary">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Remove item</h2>
              <X
                onClick={() => setIsOpen(false)}
                size={24}
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-center">
              <WarningCircle color="red" fontSize="120px" />
            </div>
            <div style={{ marginTop: 20 }}>
              <b>
                Are you sure you want to remove this item from the Partner’s
                Distribution?
              </b>
            </div>
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              This action will permanently remove the item from the partner’s
              pending distribution and cannot be undone.
            </div>
            <button
              className="flex justify-center items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={() => removeItem()}
            >
              Remove Item
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}

      <div className="flex justify-end">
        <Menu as="div" className="float-right relative">
          <MenuButton>
            <DotsThree weight="bold" />
          </MenuButton>
          <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
            {distribution.visible ? (
              <MenuItem
                as="button"
                className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => toggleVisibility(distribution)}
              >
                <EyeSlash className="inline-block mr-2" size={22} />
                Hide Item from Partner
              </MenuItem>
            ) : (
              <MenuItem
                as="button"
                className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => toggleVisibility(distribution)}
              >
                <Eye className="inline-block mr-2" size={22} />
                Make Visible to Partner
              </MenuItem>
            )}
            <MenuItem
              as="button"
              className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(true)}
            >
              <Trash className="inline-block mr-2" size={22} />
              Remove item
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </>
  );
}
