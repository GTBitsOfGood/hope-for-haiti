
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';


interface CreateAccountReminderProps {
    userRole: string;
    token: string;
}


export const CreateAccountReminder = ({
  userRole,
  token,
}: CreateAccountReminderProps) => {
  const inviteLink = `/register?token=${token}`;
  return (
    <Html>
      <Head />
  <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>Reminder: Complete your {userRole} account registration</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
              <Text className="text-2xl font-bold text-mainRed mb-3">Friendly Reminder</Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">
                You were invited to create a <span className="text-mainRed font-bold">{userRole}</span> account, but it looks like you haven&apos;t completed your registration yet.
              </Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">Please click the button below to finish setting up your account:</Text>
              <Button className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3 mt-4" href={inviteLink}>
                Complete Registration
              </Button>
              <Text className="text-base font-light text-gray-primary leading-[26px] mt-4">
                If you have any questions or need assistance, contact yvette@hopeforhaiti.com.
              </Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">Thank you!</Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};



CreateAccountReminder.PreviewProps = {
  userRole: 'Partner',
  token: 'abcdef12345',
} as CreateAccountReminderProps;

export default CreateAccountReminder;


// Tailwind via <Tailwind config={tailwindConfig}>

