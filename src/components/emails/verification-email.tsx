import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  userEmail: string;
  verificationLink: string;
}

export const VerificationEmail = ({
  userEmail,
  verificationLink,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to access LocaToGo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to LocaToGo!</Heading>
          <Text style={text}>
            Hello {userEmail},
          </Text>
          <Text style={text}>
            Thank you for signing up. To complete your registration and unlock all the tech discovery features, please verify your email address by clicking the button below:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationLink}>
              Verify My Account
            </Button>
          </Section>
          <Text style={text}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "40px auto",
  padding: "20px",
  maxWidth: "600px",
  border: "1px solid #eaeaea",
  borderRadius: "10px",
};

const h1 = {
  color: "#1d1c1d",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  marginBottom: "24px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const buttonContainer = {
  padding: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
