import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';
import type { Item } from '@prisma/client';

export interface ItemsVisibleNotificationProps {
  partnerName?: string;
  distributionUrl: string;
  items: Item[];
}

const formatDate = (d?: string | Date | null) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
};

export const ItemsVisibleNotification = ({
  partnerName,
  distributionUrl,
  items,
}: ItemsVisibleNotificationProps) => {
  const previewText = `${items.length} item${items.length === 1 ? '' : 's'} made visible in your distribution`;
  return (
    <Html>
      <Head />
  <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
              <Text className="text-2xl font-bold text-mainRed mb-3">Good news{partnerName ? `, ${partnerName}` : ''}!</Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">
                {items.length} item{items.length === 1 ? '' : 's'} ha{items.length === 1 ? 's' : 've'} just been made
                visible in your distribution.
              </Text>

              <table className="w-full border-collapse mt-4 mb-5">
                <thead>
                  <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">ID</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Title</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Type</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Qty</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Unit</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Qty/Unit</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Expiration</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">NDC</td>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border border-blue-dark text-sm">{item.id}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.title}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.type}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.quantity}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.unitType}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.quantityPerUnit}</td>
                      <td className="p-2 border border-blue-dark text-sm">{formatDate(item.expirationDate)}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.ndc || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button href={distributionUrl} className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3">View Distribution</Button>

              <Text className="text-[13px] text-[#555] mt-3">
                If you have questions about any item, please contact yvette@hopeforhaiti.com.
              </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ItemsVisibleNotification.PreviewProps = {
  partnerName: 'Hope Partner Clinic',
  distributionUrl: '/distributions',
  items: [
    {
      id: 101,
      title: 'Acetaminophen 500mg',
      type: 'Medication',
      quantity: 200,
      unitType: 'Bottle',
      quantityPerUnit: 100,
  expirationDate: new Date('2026-02-01'),
      ndc: '12345-6789',
    },
    {
      id: 102,
      title: 'Surgical Gloves (M)',
      type: 'Medical Supply',
      quantity: 1000,
      unitType: 'Box',
      quantityPerUnit: 100,
      expirationDate: null,
  ndc: null,
    },
  ],
} as ItemsVisibleNotificationProps;

export default ItemsVisibleNotification;
