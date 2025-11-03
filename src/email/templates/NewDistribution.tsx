import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '../../../tailwind.config';

export interface NewDistributionProps {
  partnerName?: string;
  distributionUrl: string;
}

export const NewDistribution = ({
  partnerName,
  distributionUrl,
}: NewDistributionProps) => {
  const previewText = "A new distribution of items have been assigned to you";
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
                A new distribution of items have been assigned to you.
              </Text>

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

NewDistribution.PreviewProps = {
  partnerName: 'Hope Partner Clinic',
  distributionUrl: '/distributions',
} as NewDistributionProps;

export default NewDistribution;
