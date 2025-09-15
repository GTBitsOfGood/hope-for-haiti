import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';
import type { DonorOfferItem } from '@prisma/client';

interface DonorOfferCreatedEmailProps {
  partnerName?: string;
  offerName: string;
  donorName: string;
  partnerResponseDeadline: string | Date;
  donorResponseDeadline: string | Date;
  offerUrl: string; // link for the partner to view the donor offer details
  items: Array<
    Pick<
      DonorOfferItem,
      'title' | 'type' | 'expirationDate' | 'unitType' | 'quantityPerUnit' | 'quantity'
    >
  >;
}

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toISOString().slice(0, 10);
};

export const DonorOfferCreatedEmail = ({
  partnerName,
  offerName,
  donorName,
  partnerResponseDeadline,
  donorResponseDeadline,
  offerUrl,
  items,
}: DonorOfferCreatedEmailProps) => {
  const previewText = `New donor offer: ${offerName} (respond by ${formatDate(partnerResponseDeadline)})`;
  return (
    <Html>
      <Head />
  <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
              <Text className="text-2xl font-bold text-mainRed mb-3">New Donor Offer Available</Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">
                {partnerName ? `${partnerName}, ` : ''}a new donor offer has been created and you have access to view it.
              </Text>
              <table className="w-full border-collapse mt-4 mb-5">
              <tbody>
                <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Offer Name</td>
                    <td className="p-2 border border-blue-dark text-sm">{offerName}</td>
                </tr>
                <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Donor</td>
                    <td className="p-2 border border-blue-dark text-sm">{donorName}</td>
                </tr>
                <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Partner Response Deadline</td>
                    <td className="p-2 border border-blue-dark text-sm">{formatDate(partnerResponseDeadline)}</td>
                </tr>
                <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Donor Response Deadline</td>
                    <td className="p-2 border border-blue-dark text-sm">{formatDate(donorResponseDeadline)}</td>
                </tr>
                <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Status</td>
                    <td className="p-2 border border-blue-dark text-sm">Unfinalized</td>
                </tr>
              </tbody>
              </table>

            {/* Items summary */}
            {items && items.length > 0 && (
              <>
                <Text className="text-base font-light text-gray-primary leading-[26px] mt-2">Included items:</Text>
                <table className="w-full border-collapse mt-4 mb-5">
                  <thead>
                    <tr>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Title</td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Type</td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Qty</td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Unit</td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Qty/Unit</td>
                      <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Expiration</td>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={`${it.title}-${idx}`}>
                        <td className="p-2 border border-blue-dark text-sm">{it.title}</td>
                        <td className="p-2 border border-blue-dark text-sm">{it.type}</td>
                        <td className="p-2 border border-blue-dark text-sm">{it.quantity}</td>
                        <td className="p-2 border border-blue-dark text-sm">{it.unitType}</td>
                        <td className="p-2 border border-blue-dark text-sm">{it.quantityPerUnit}</td>
                        <td className="p-2 border border-blue-dark text-sm">{formatDate(it.expirationDate as unknown as string | Date | null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <Button href={offerUrl} className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3">View Donor Offer</Button>
            <Text className="text-[13px] text-[#555] mt-3">
              Please submit your requests before the deadline. If you have questions, contact yvette@hopeforhaiti.com.
            </Text>
              </div>
          </Section>
        </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DonorOfferCreatedEmail.PreviewProps = {
  partnerName: 'Hope Partner Clinic',
  offerName: 'Spring Medical Supplies 2026',
  donorName: 'Global Health Donor Org',
  partnerResponseDeadline: '2026-03-31',
  donorResponseDeadline: '2026-04-15',
  offerUrl: '/donorOffers',
  items: [
    {
      title: 'Acetaminophen 500mg',
      type: 'Medication',
      quantity: 200,
      unitType: 'Bottle',
      quantityPerUnit: 100,
      expirationDate: '2026-10-01',
    },
    {
      title: 'Surgical Gloves (M)',
      type: 'Medical Supply',
      quantity: 1000,
      unitType: 'Box',
      quantityPerUnit: 100,
      expirationDate: null,
    },
  ],
} as DonorOfferCreatedEmailProps;

export default DonorOfferCreatedEmail;
