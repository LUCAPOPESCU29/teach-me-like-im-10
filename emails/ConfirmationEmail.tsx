import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface ConfirmationEmailProps {
  displayName: string;
  confirmUrl: string;
}

export default function ConfirmationEmail({
  displayName,
  confirmUrl,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to start learning</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandDots}>
              <span style={{ color: "#4ade80" }}>&#9679;</span>{" "}
              <span style={{ color: "#fbbf24" }}>&#9679;</span>{" "}
              <span style={{ color: "#f97316" }}>&#9679;</span>{" "}
              <span style={{ color: "#f43f5e" }}>&#9679;</span>{" "}
              <span style={{ color: "#a855f7" }}>&#9679;</span>
            </Text>
            <Text style={brandName}>Teach Me Like I&apos;m 10</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Confirm your email</Text>
            <Text style={paragraph}>
              Hey {displayName}, click the button below to confirm your email
              and start your learning journey.
            </Text>

            <Button style={button} href={confirmUrl}>
              Confirm Email
            </Button>

            <Text style={smallText}>
              This link expires in 24 hours. If you didn&apos;t create an
              account, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Teach Me Like I&apos;m 10 &middot; teachmelikeim10.xyz
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "500px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const brandDots = {
  fontSize: "10px",
  letterSpacing: "4px",
  marginBottom: "8px",
};

const brandName = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const content = {
  backgroundColor: "#111111",
  borderRadius: "12px",
  border: "1px solid #222222",
  padding: "32px",
  textAlign: "center" as const,
};

const heading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "12px",
  marginTop: "0",
};

const paragraph = {
  color: "#999999",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const smallText = {
  color: "#555555",
  fontSize: "12px",
  marginTop: "20px",
  lineHeight: "1.5",
};

const hr = {
  borderColor: "#222222",
  margin: "32px 0 16px",
};

const footer = {
  color: "#555555",
  fontSize: "12px",
  textAlign: "center" as const,
};
