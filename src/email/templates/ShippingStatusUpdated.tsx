import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../../../tailwind.config";

export interface ShippingStatusUpdatedProps {
  notificationId: number;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  previousStatus: string;
  newStatus: string;
}

export const ShippingStatusUpdated = (
  { notificationId, donorShippingNumber, hfhShippingNumber, previousStatus, newStatus }: ShippingStatusUpdatedProps
) => {
  const url = `${process.env.BASE_URL}/api/notifications/${notificationId}/open`;
  const previewText = "A shipment label has just changed";

  return (
    <Html>
      <Head />
      <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
                <Text className="text-2xl font-bold text-mainRed mb-3">
                  Shipment Status Updated
                </Text>
                <Text className="text-base font-light text-gray-primary leading-[26px]">
                  A shipment you are receiving items on has a new label. Review the change below.
                </Text>

                <table className="w-full border-collapse mt-4 mb-5">
                  <thead>
                    <tr>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">
                        Donor Shipment #
                      </td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">
                        HFH Shipment #
                      </td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">
                        Previous Label
                      </td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">
                        New Label
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-blue-dark text-sm">
                        {donorShippingNumber}
                      </td>
                      <td className="p-2 border border-blue-dark text-sm">
                        {hfhShippingNumber}
                      </td>
                      <td className="p-2 border border-blue-dark text-sm">
                        {previousStatus}
                      </td>
                      <td className="p-2 border border-blue-dark text-sm">
                        {newStatus}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <Button
                  href={url}
                  className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3"
                >
                  View Shipment
                </Button>
                <Text className="text-[13px] text-[#555] mt-3">
                  If you have questions about this shipment, please contact yvette@hopeforhaiti.com.
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ShippingStatusUpdated.PreviewProps = {
  notificationId: 1,
  donorShippingNumber: "DSN-1001",
  hfhShippingNumber: "HFH-900",
  previousStatus: "Awaiting Arrival from Donor",
  newStatus: "Arrived at Depot",
} as ShippingStatusUpdatedProps;

export default ShippingStatusUpdated;
