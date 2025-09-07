import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Item } from '@prisma/client';


interface ExpiringItemsEmailProps {
  items: Item[];
  month: string;
}

export const ExpiringItemsEmail = ({ items, month }: ExpiringItemsEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Expiring Items Report for {month}</Preview>
        <Container style={container}>
          <Section>
            <Text style={heading}>Expiring Items This Month</Text>
            <Text style={text}>
              The following items are set to expire in {month}. Please review and take necessary action.
            </Text>
            <table style={table}>
              <thead>
                <tr style={tableHeader}>
                  <td>ID</td>
                  <td>Title</td>
                  <td>Expiration Date</td>
                  <td>Quantity</td>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.expirationDate ? item.expirationDate.toString().slice(0, 10) : '-'}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text style={text}>If you have questions about any item, please contact the admin team.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

ExpiringItemsEmail.PreviewProps = {
  month: 'September 2025',
  items: [
    {
      id: 1,
      title: 'Amoxicillin',
      expirationDate: new Date('2025-09-15'),
      quantity: 50,
    },
    {
      id: 999,
      title: 'Tylenol',
      expirationDate: new Date('2025-09-22'),
      quantity: 100,
    },
    // Add more sample items as needed
  ],
} as ExpiringItemsEmailProps;

export default ExpiringItemsEmail;

const main = {
  backgroundColor: '#f6f7ff',
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '2px solid #2774AE',
  borderRadius: '8px',
  padding: '45px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#E63946',
  marginBottom: '18px',
};

const text = {
  fontSize: '16px',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: '300',
  color: '#22070B',
  lineHeight: '26px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '20px',
  marginBottom: '20px',
};

const tableHeader = {
  backgroundColor: '#2774AE',
  color: '#fff',
  fontWeight: 'bold',
};
