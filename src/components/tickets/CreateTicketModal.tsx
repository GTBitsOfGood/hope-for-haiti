import { useSession } from "next-auth/react";
import GeneralModal from "@/components/AccountManagement/GeneralModal";
import {
  groupUsersByTagForSelect,
  hasPermission,
  isPartner,
  isStaff,
  searchByNameOrTag,
} from "@/lib/userUtils";
import ConfiguredSelect from "@/components/ConfiguredSelect";
import { useApiClient } from "@/hooks/useApiClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "@phosphor-icons/react";

const NAME_REGEX = /^[a-zA-Z0-9_ -]+$/;

interface CreateTicketModalProps {
  onTicketCreated?: (channelId: string) => void;
}

type Partner = {
  name: string;
  id: number;
  tag?: string;
};

export default function CreateTicketModal({
  onTicketCreated,
}: CreateTicketModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const session = useSession();
  const user = session.data?.user;
  // Partners can always create tickets, staff needs supportWrite permission
  const canWrite = user
    ? isPartner(user.type) || hasPermission(user, "supportWrite")
    : false;
  const isStaffUser = user ? isStaff(user.type) : false;

  const { apiClient } = useApiClient();

  const [partners, setPartners] = useState<Partner[]>([]);

  const [ticketName, setTicketName] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner>();

  useEffect(() => {
    if (!apiClient || !isStaffUser) return;

    apiClient
      .get<{
        partners: typeof partners;
      }>("/api/partners")
      .then((response) => setPartners(response.partners));
  }, [apiClient, isStaffUser]);

  async function createTicket() {
    if (!apiClient) {
      toast.error("API client not available");
      return;
    }

    if (!ticketName.trim()) {
      toast.error("Ticket title cannot be empty");
      return;
    }

    if (selectedPartner === undefined && isStaffUser) {
      toast.error("Please select a partner for the ticket");
      return;
    }

    if (!NAME_REGEX.test(ticketName.trim())) {
      toast.error("Only a-z, A-Z, 0-9 and _- are allowed for ticket names")
      return;
    }

    const promise = apiClient.post<{ channelId: string }>("/api/tickets", {
      body: JSON.stringify({
        ticketName: ticketName.trim(),
        partnerId: selectedPartner?.id,
      }),
    });

    toast.promise(promise, {
      loading: "Creating ticket...",
      success: "Ticket created successfully!",
      error: "Failed to create ticket.",
    });

    const response = await promise;

    setTicketName("");
    setSelectedPartner(undefined);
    setIsOpen(false);

    if (response.channelId && onTicketCreated) {
      onTicketCreated(response.channelId);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canWrite}
        className="p-2 bg-blue-primary/90 hover:bg-blue-primary transition-all duration-200 text-white rounded flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Pencil size={20} />
      </button>
      <GeneralModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={"Create Ticket"}
        onCancel={() => setIsOpen(false)}
        onConfirm={createTicket}
      >
        <form>
          <input
            type="text"
            name="title"
            placeholder="Ticket Title"
            className="w-full p-2 border border-gray-primary/20 rounded mb-4"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
          />
          {isStaffUser && (
            <ConfiguredSelect
              name="partner"
              placeholder="Select Partner"
              options={groupUsersByTagForSelect(partners)}
              filterOption={searchByNameOrTag}
              value={
                selectedPartner
                  ? {
                      value: selectedPartner,
                      label: selectedPartner.name,
                    }
                  : undefined
              }
              onChange={(newVal) => setSelectedPartner(newVal?.value)}
            />
          )}
        </form>
      </GeneralModal>
    </>
  );
}
