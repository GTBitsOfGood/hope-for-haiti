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
import type { Item } from '@prisma/client';

interface ItemsVisibleNotificationProps {
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
      <Body style={main}>
        <Preview>{previewText}</Preview>
        <Container style={container}>
          <Section>
            <Text style={heading}>
              Good news{partnerName ? `, ${partnerName}` : ''}!
            </Text>
            <Text style={text}>
              {items.length} item{items.length === 1 ? '' : 's'} ha{items.length === 1 ? 's' : 've'} just been made
              visible in your distribution.
            </Text>

            <table style={table}>
              <thead>
                <tr style={tableHeader}>
                  <td style={thCell}>ID</td>
                  <td style={thCell}>Title</td>
                  <td style={thCell}>Type</td>
                  <td style={thCell}>Qty</td>
                  <td style={thCell}>Unit</td>
                  <td style={thCell}>Qty/Unit</td>
                  <td style={thCell}>Expiration</td>
                  <td style={thCell}>NDC</td>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={tdCell}>{item.id}</td>
                    <td style={tdCell}>{item.title}</td>
                    <td style={tdCell}>{item.type}</td>
                    <td style={tdCell}>{item.quantity}</td>
                    <td style={tdCell}>{item.unitType}</td>
                    <td style={tdCell}>{item.quantityPerUnit}</td>
                    <td style={tdCell}>{formatDate(item.expirationDate)}</td>
                    <td style={tdCell}>{item.ndc || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button href={distributionUrl} style={button}>View Distribution</Button>

            <Text style={finePrint}>
              If you have questions about any item, please reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
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

// Styles - aligned to site theme colors
const main = {
  backgroundColor: '#f6f7ff', // blue.light
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '2px solid #2774AE', // blue.primary
  borderRadius: '8px',
  padding: '32px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#E63946', // mainRed
  marginBottom: '12px',
};

const text = {
  fontSize: '16px',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: 300,
  color: '#22070B', // gray.primary
  lineHeight: '26px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '16px',
  marginBottom: '20px',
};

const tableHeader = {
  backgroundColor: '#2774AE', // blue.primary
  color: '#ffffff',
};

const thCell = {
  padding: '10px',
  border: '1px solid #ced8fa', // blue.dark
  fontWeight: 600,
  fontSize: '14px',
};

const tdCell = {
  padding: '10px',
  border: '1px solid #ced8fa', // blue.dark
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
  border: '2px solid #E63946', // red accent
};

const finePrint = {
  fontSize: '13px',
  color: '#555',
  marginTop: '12px',
};
