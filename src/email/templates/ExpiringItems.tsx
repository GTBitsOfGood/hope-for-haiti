import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';
import { Item } from '@prisma/client';


interface ExpiringItemsEmailProps {
  items: Item[];
  month: string;
}

export const ExpiringItemsEmail = ({ items, month }: ExpiringItemsEmailProps) => {
  return (
    <Html>
      <Head />
  <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>Expiring Items Report for {month}</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
              <Text className="text-2xl font-bold text-mainRed mb-3">Expiring Items This Month</Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">
                The following items are set to expire in {month}. Please review and take necessary action.
              </Text>
              <table className="w-full border-collapse mt-4 mb-5">
                <thead>
                  <tr>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">ID</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Title</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Expiration Date</td>
                    <td className="p-2 border border-blue-dark font-semibold text-sm bg-blue-light">Quantity</td>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border border-blue-dark text-sm">{item.id}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.title}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.expirationDate ? item.expirationDate.toString().slice(0, 10) : '-'}</td>
                      <td className="p-2 border border-blue-dark text-sm">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Text className="text-base font-light text-gray-primary leading-[26px]">If you have questions about any item, please contact yvette@hopeforhaiti.com.</Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
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
