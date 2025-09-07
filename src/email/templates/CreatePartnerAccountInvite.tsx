
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


interface CreatePartnerAccountInviteProps {
    userRole: string;
    token: string;
}

export const CreatePartnerAccountInvite = ({
  userRole,
  token,
}: CreatePartnerAccountInviteProps) => {
    const inviteLink = `/register?token=${token}`;
  return (
    <Html>
      <Head />
      <Body style={main}>
    <Preview>You&apos;re invited to create a {userRole} account</Preview>
        <Container style={container}>
          <Section>
            <Text style={heading}>
      You&apos;re invited!
            </Text>
            <Text style={text}>
              You have been invited to create a <span style={{ color: '#E63946', fontWeight: 'bold' }}>{userRole}</span> account. Please click the button below to get started:
            </Text>
            <Button style={button} href={inviteLink}>
              Create Account
            </Button>
            <Text style={text}>
              If you did not expect this invitation, you can safely ignore this email.
            </Text>
            <Text style={text}>Thank you!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};


CreatePartnerAccountInvite.PreviewProps = {
  userRole: 'Partner',
  token: 'abcdef12345',
} as CreatePartnerAccountInviteProps;

export default CreatePartnerAccountInvite;


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


const button = {
  backgroundColor: '#2774AE', 
  borderRadius: '4px',
  color: '#fff',
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '210px',
  padding: '14px 7px',
  border: '2px solid #ac268bff', 
  boxShadow: '0 2px 8px rgba(39, 116, 174, 0.08)',
};

