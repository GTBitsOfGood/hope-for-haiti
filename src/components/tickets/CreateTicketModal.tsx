import { useSession } from "next-auth/react";
import GeneralModal from "@/components/AccountManagement/GeneralModal";
import { isAdmin } from "@/lib/userUtils";
import ConfiguredSelect from "@/components/ConfiguredSelect";
import { useApiClient } from "@/hooks/useApiClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "@phosphor-icons/react";

export default function CreateTicketModal() {
  const [isOpen, setIsOpen] = useState(false);

  const session = useSession();
  const user = session.data?.user;
  const admin = user ? isAdmin(user.type) : false;

  const { apiClient } = useApiClient();

  const [partners, setPartners] = useState<
    {
      name: string;
      id: number;
    }[]
  >([]);

  const [ticketName, setTicketName] = useState("");
  const [partnerId, setPartnerId] = useState<number>();

  useEffect(() => {
    if (!apiClient || !admin) return;

    apiClient
      .get<{
        partners: typeof partners;
      }>("/api/partners")
      .then((response) => setPartners(response.partners));
  }, [apiClient, admin]);

  async function createTicket() {
    if (!apiClient) {
      toast.error("API client not available");
      return;
    }

    if (!ticketName.trim()) {
      toast.error("Ticket title cannot be empty");
      return;
    }

    if (partnerId === undefined && admin) {
      toast.error("Please select a partner for the ticket");
      return;
    }

    const promise = apiClient.post("/api/tickets", {
      body: JSON.stringify({
        ticketName: ticketName.trim(),
        partnerId: partnerId,
      }),
    });

    toast.promise(promise, {
      loading: "Creating ticket...",
      success: "Ticket created successfully!",
      error: "Failed to create ticket.",
    });

    await promise;

    setTicketName("");
    setPartnerId(undefined);

    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-blue-primary text-white rounded flex items-center gap-2 justify-center"
      >
        <Pencil size={16} />
        <p>Create Ticket</p>
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
          {admin && (
            <ConfiguredSelect
              name="partner"
              placeholder="Select Partner"
              options={partners.map((partner) => ({
                label: partner.name,
                value: partner.id,
              }))}
              value={
                partnerId
                  ? {
                      value: partnerId,
                      label:
                        partners.find((partner) => partner.id === partnerId)
                          ?.name || "",
                    }
                  : undefined
              }
              onChange={(newVal) => setPartnerId(newVal?.value)}
            />
          )}
        </form>
      </GeneralModal>
    </>
  );
}
