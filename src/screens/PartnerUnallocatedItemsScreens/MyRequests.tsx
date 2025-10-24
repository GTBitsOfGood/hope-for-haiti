import ModalDropDown from "@/components/ModalDropDown";
import ModalTextField from "@/components/ModalTextField";
import PriorityTag from "@/components/tags/PriorityTag";
import { formatTableValue } from "@/util/format";
import {
  ChatTeardropText,
  Check,
  MagnifyingGlass,
  PencilSimple,
  X,
} from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import { priorityOptions } from "./UnallocatedItems";
import MyRequestCommentModal from "./MyRequestCommentModal";
import { cn } from "@/util/util";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { RequestPriority } from "@prisma/client";
import { renderHeaders } from "@/components/baseTable/BaseTable";

export type ItemRequest = {
  id: number;
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: string;
  priority: RequestPriority;
  quantity: string;
  comments: string;
  createdAt: string;
};

export default function MyRequests() {
  const { data, refetch: refetchRequests } = useFetch<ItemRequest[]>(
    "/api/unallocatedItemRequest",
    {
      cache: "no-store",
      onError: (error) => {
        console.error("Error fetching requests:", error);
        toast.error("Failed to fetch requests");
      },
    }
  );

  const requestsData = data || [];

  return (
    <>
      <div className="mt-7 relative w-1/3">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          className="pl-10 pr-4 py-2 w-full border border-gray-primary border-opacity-10 rounded-lg bg-gray-100 text-gray-primary focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {tabs.map(({ value, label }) => {
          return (
            <button
              key={value}
              data-active={activeTab === value}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => setActiveTab(value)}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{label}</div>
            </button>
          );
        })}
      </div> */}

      <table className="mt-4 rounded-t-lg table-fixed w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2 text-left">
            {renderHeaders([
              "Title",
              "Type",
              "Priority",
              "Quantity Requested",
              "Expiration",
              "Unit Type",
              "Qty/Unit",
              "Date Requested",
              "Comments",
              "",
            ])}
          </tr>
        </thead>
        <tbody>
          {requestsData.map((item, index) => (
            <MyRequestRow
              key={index}
              item={item}
              index={index}
              refetch={refetchRequests}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

interface Props {
  item: ItemRequest;
  index: number;
  refetch: () => void;
}

function capitalizeFirstLetter(val: string) {
  return (
    String(val).charAt(0).toUpperCase() + String(val).slice(1).toLowerCase()
  );
}

export type FormState = {
  priority: RequestPriority;
  quantity: number;
  comments: string;
};

function MyRequestRow({ item, index, refetch }: Props) {
  const [open, setOpen] = useState(false);
  const [editting, setEditting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    priority: item.priority,
    quantity: parseInt(item.quantity),
    comments: item.comments,
  });

  const { isLoading: isUpdating, apiClient } = useApiClient();

  const handleSubmit = async () => {
    const itemStr = `${item.title} (${item.expirationDate})`;

    if (!formState.priority)
      return toast.error(`Must set priority for ${itemStr}`);
    if (formState.quantity < 1)
      return toast.error(`Must request at least one of ${itemStr}`);

    try {
      await apiClient.post("/api/updateUnallocatedItemRequest", {
        body: JSON.stringify({
          id: item.id,
          priority: formState.priority,
          quantity: formState.quantity,
          comments: formState.comments,
        }),
      });
      toast.success("Request submitted");
      refetch();
      setEditting(false);
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <tr
      data-odd={index % 2 !== 0}
      className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
    >
      <td className="px-4 py-2">{formatTableValue(item.title)}</td>
      <td className="px-4 py-2">{formatTableValue(item.type)}</td>
      <td className="px-4 py-2">
        {editting ? (
          <ModalDropDown
            name="priority"
            options={priorityOptions}
            placeholder="Priority"
            required
            onSelect={(value: string) => {
              setFormState((prevValue) => {
                return {
                  ...prevValue,
                  priority: value as RequestPriority,
                };
              });
            }}
            defaultSelected={{
              label: capitalizeFirstLetter(item.priority),
              value: item.priority,
            }}
          />
        ) : (
          <PriorityTag priority={item.priority} />
        )}
      </td>
      <td className="px-4 py-2">
        {editting ? (
          <ModalTextField
            name="quantity"
            placeholder="Quantity"
            type="number"
            required
            inputProps={{
              defaultValue: formState.quantity,
              min: 0,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setFormState((prevValue) => {
                  return {
                    ...prevValue,
                    [e.target.name]: e.target.value,
                  };
                });
              },
            }}
          />
        ) : (
          formatTableValue(item.quantity)
        )}
      </td>
      <td className="px-4 py-2">{formatTableValue(item.expirationDate)}</td>
      <td className="px-4 py-2">{formatTableValue(item.unitType)}</td>
      <td className="px-4 py-2">{formatTableValue(item.quantityPerUnit)}</td>
      <td className="px-4 py-2">{formatTableValue(item.createdAt)}</td>
      <td className="px-4 py-2">
        <Fragment>
          <ChatTeardropText
            className={cn((item.comments || editting) && "cursor-pointer")}
            data-tooltip-id={`comment-tooltip-${item.id}`}
            size={30}
            color={editting ? "#4aa6eb" : item.comments ? "black" : "lightgray"}
            onClick={() => {
              if (!editting) return;
              setOpen(true);
            }}
          />
          {item.comments && (
            <Tooltip id={`comment-tooltip-${item.id}`} className="max-w-40">
              {item.comments}
            </Tooltip>
          )}
          {editting && (
            <MyRequestCommentModal
              item={item}
              open={open}
              setOpen={setOpen}
              formState={formState}
              setFormState={setFormState}
            />
          )}
        </Fragment>
      </td>
      <td className="px-4 py-2">
        {editting ? (
          <div className="flex gap-2">
            <div
              className="border border-red-primary rounded-md size-7 flex items-center justify-center cursor-pointer"
              onClick={() => setEditting(false)}
            >
              <X className="text-red-primary" size={20} />
            </div>
            <div
              className={`bg-blue-primary rounded-md size-7 flex items-center justify-center cursor-pointer ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={isUpdating ? undefined : handleSubmit}
            >
              <Check className="text-white" size={20} />
            </div>
          </div>
        ) : (
          <PencilSimple
            className="cursor-pointer"
            size={30}
            onClick={() => setEditting(true)}
          />
        )}
      </td>
    </tr>
  );
}
