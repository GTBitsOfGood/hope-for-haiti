import React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../../../tailwind.config";

export interface SupportTicketClosedProps {
  userName: string;
  ticketName: string;
  ticketUrl: string;
}

const SupportTicketClosed = ({
  userName,
  ticketName,
  ticketUrl,
}: SupportTicketClosedProps) => {
  return (
    <Html>
      <Head />
      <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>Your support ticket &quot;{ticketName}&quot; has been closed</Preview>

          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
                <Text className="text-lg text-gray-primary mb-2">
                  Hi {userName},
                </Text>
                <Text className="text-base text-gray-primary leading-[26px]">
                  Your support ticket <strong>&quot;{ticketName}&quot;</strong> has been closed.
                </Text>
                <Text className="text-base text-gray-primary leading-[26px]">
                  If you have any additional questions or need further assistance,
                  please feel free to create a new ticket.
                </Text>
                <Button
                  href={ticketUrl}
                  className="mt-4 bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3 text-base"
                >
                  View Ticket
                </Button>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

SupportTicketClosed.PreviewProps = {
  userName: "Chris",
  ticketName: "Missing shipment paperwork",
  ticketUrl: "https://example.com/support?channel-id=missing-shipment-1234567890",
} as SupportTicketClosedProps;

export default SupportTicketClosed;