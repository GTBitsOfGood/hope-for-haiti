import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
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
      <Body style={main}>
        <Preview>{previewText}</Preview>
        <Container style={container}>
          <Section>
            <Text style={heading}>New Donor Offer Available</Text>
            <Text style={text}>
              {partnerName ? `${partnerName}, ` : ''}a new donor offer has been created and you have access to view it.
            </Text>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={thCell}>Offer Name</td>
                  <td style={tdCell}>{offerName}</td>
                </tr>
                <tr>
                  <td style={thCell}>Donor</td>
                  <td style={tdCell}>{donorName}</td>
                </tr>
                <tr>
                  <td style={thCell}>Partner Response Deadline</td>
                  <td style={tdCell}>{formatDate(partnerResponseDeadline)}</td>
                </tr>
                <tr>
                  <td style={thCell}>Donor Response Deadline</td>
                  <td style={tdCell}>{formatDate(donorResponseDeadline)}</td>
                </tr>
                <tr>
                  <td style={thCell}>Status</td>
                  <td style={tdCell}>Unfinalized</td>
                </tr>
              </tbody>
            </table>

            {/* Items summary */}
            {items && items.length > 0 && (
              <>
                <Text style={{ ...text, marginTop: '8px' }}>Included items:</Text>
                <table style={table}>
                  <thead>
                    <tr>
                      <td style={thCell}>Title</td>
                      <td style={thCell}>Type</td>
                      <td style={thCell}>Qty</td>
                      <td style={thCell}>Unit</td>
                      <td style={thCell}>Qty/Unit</td>
                      <td style={thCell}>Expiration</td>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={`${it.title}-${idx}`}>
                        <td style={tdCell}>{it.title}</td>
                        <td style={tdCell}>{it.type}</td>
                        <td style={tdCell}>{it.quantity}</td>
                        <td style={tdCell}>{it.unitType}</td>
                        <td style={tdCell}>{it.quantityPerUnit}</td>
                        <td style={tdCell}>{formatDate(it.expirationDate as unknown as string | Date | null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <Button href={offerUrl} style={button}>View Donor Offer</Button>
            <Text style={finePrint}>
              Please submit your requests before the deadline. If you have questions, reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
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

// Styles aligned to site theme
const main = {
  backgroundColor: '#f6f7ff',
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '2px solid #2774AE',
  borderRadius: '8px',
  padding: '32px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#E63946',
  marginBottom: '12px',
};

const text = {
  fontSize: '16px',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: 300,
  color: '#22070B',
  lineHeight: '26px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '16px',
  marginBottom: '20px',
};

const thCell = {
  padding: '10px',
  border: '1px solid #ced8fa',
  fontWeight: 600,
  fontSize: '14px',
  backgroundColor: '#f6f7ff',
};

const tdCell = {
  padding: '10px',
  border: '1px solid #ced8fa',
  fontSize: '14px',
};

const button = {
  backgroundColor: '#2774AE',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 18px',
  border: '2px solid #E63946',
};

const finePrint = {
  fontSize: '13px',
  color: '#555',
  marginTop: '12px',
};
