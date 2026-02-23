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
  Column,
  Row,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../../../tailwind.config";

export interface SupportTicketUnreadProps {
  userName: string;
  channels: {
    name: string;
    unreadCount: number;
    url: string;
  }[];
}

const SupportTicketUnread = ({ userName, channels }: SupportTicketUnreadProps) => {
  const previewList = channels.map((channel) => `${channel.name} (${channel.unreadCount})`).join(", ");
  return (
    <Html>
      <Head />
      <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>{previewList ? `Unread ticket updates: ${previewList}` : "Unread ticket updates"}</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
                <Text className="text-lg text-gray-primary mb-2">Hi {userName},</Text>
                <Text className="text-base text-gray-primary leading-[26px]">
                  You have unread messages waiting in the following support tickets
                </Text>
                <div className="mt-4 mb-6">
                  {channels.map((channel) => (
                    <div key={channel.url} className="border border-blue-dark/30 rounded p-4 mb-3">
                      <Row className="w-full">
                        <Column>
                          <Text className="text-lg font-semibold text-gray-primary m-0">{channel.name}</Text>
                        </Column>
                        <Column align="right">
                          <Text className="text-sm text-gray-primary/70 m-0">Unread messages</Text>
                          <Text className="text-xl font-bold text-mainRed m-0">{channel.unreadCount}</Text>
                        </Column>
                      </Row>
                      <Button href={channel.url} className="mt-3 inline-block bg-blue-primary text-white px-4 py-2 rounded text-sm no-underline">
                        View Ticket
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  href={channels[0]?.url || `${process.env.BASE_URL}/support`}
                  className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3 text-base"
                >
                  Go to Support Inbox
                </Button>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

SupportTicketUnread.PreviewProps = {
  userName: "Chris",
  channels: [
    {
      name: "Missing shipment paperwork",
      unreadCount: 3,
      url: "https://example.com/support?channel-id=missing-shipment-paperwork",
    },
    {
      name: "Requesting updated invoices",
      unreadCount: 1,
      url: "https://example.com/support?channel-id=requesting-updated-invoices",
    },
  ],
} as SupportTicketUnreadProps;

export default SupportTicketUnread;

