
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';


interface CreateAccountInviteProps {
    userRole: string;
    token: string;
}

export const CreateAccountInvite = ({
  userRole,
  token,
}: CreateAccountInviteProps) => {
    const inviteLink = `/register?token=${token}`;
  return (
    <Html>
      <Head />
  <Tailwind config={{ theme: (tailwindConfig as any).theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>You&apos;re invited to create a {userRole} account</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
              <Text className="text-2xl font-bold text-mainRed mb-3">You&apos;re invited!</Text>
              <Text className="text-base font-light text-gray-primary leading-[26px]">
                You have been invited to create a <span className="text-mainRed font-bold">{userRole}</span> account. Please click the button below to get started:
              </Text>
              <Button className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3 mt-4" href={inviteLink}>
                Create Account
              </Button>
              <Text className="text-base font-light text-gray-primary leading-[26px] mt-4">
                If you did not expect this invitation, you can safely ignore this email.
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


CreateAccountInvite.PreviewProps = {
  userRole: 'Partner',
  token: 'abcdef12345',
} as CreateAccountInviteProps;

export default CreateAccountInvite;


// Tailwind via <Tailwind config={tailwindConfig}>

