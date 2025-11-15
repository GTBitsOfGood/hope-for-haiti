import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../../../tailwind.config";

export interface ResetPasswordProps {
  token: string;
}

export const ResetPassword = ({ token }: ResetPasswordProps) => {
  const resetLink = `${process.env.BASE_URL}/reset-password/change?token=${token}`;
  return (
    <Html>
      <Head />
      <Tailwind config={{ theme: tailwindConfig.theme }}>
        <Body className="bg-blue-light py-2 font-sans">
          <Preview>Reset your password</Preview>
          <Container className="w-[600px] mx-auto text-left">
            <Section>
              <div className="bg-white border-2 border-blue-primary rounded-lg p-8">
                <Text className="text-2xl font-bold text-mainRed mb-3">
                  Reset Your Password
                </Text>
                <Text className="text-base font-light text-gray-primary leading-[26px]">
                  We received a request to reset your password. Click the button
                  below to create a new password:
                </Text>
                <Button
                  className="bg-blue-primary border-2 border-mainRed text-white no-underline text-center inline-block rounded px-5 py-3 mt-4"
                  href={resetLink}
                >
                  Reset Password
                </Button>
                <Text className="text-base font-light text-gray-primary leading-[26px] mt-4">
                  This link will expire in 20 minutes for security reasons.
                </Text>
                <Text className="text-base font-light text-gray-primary leading-[26px]">
                  If you did not request a password reset, you can safely ignore
                  this email.
                </Text>
                <Text className="text-base font-light text-gray-primary leading-[26px]">
                  Thank you!
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ResetPassword.PreviewProps = {
  token: "abcdef12345token67890",
} as ResetPasswordProps;

export default ResetPassword;
