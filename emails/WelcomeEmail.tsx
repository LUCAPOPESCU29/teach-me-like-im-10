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

interface WelcomeEmailProps {
  displayName: string;
}

export default function WelcomeEmail({ displayName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Teach Me Like I&apos;m 10!</Preview>
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
            <Text style={heading}>Welcome, {displayName}!</Text>
            <Text style={paragraph}>
              You&apos;re all set to start learning. Pick any topic and
              we&apos;ll explain it in 5 levels — from simple to expert.
            </Text>

            <Section style={featureList}>
              <Text style={feature}>
                <span style={featureIcon}>&#9679;</span> 5 difficulty levels
                for every topic
              </Text>
              <Text style={feature}>
                <span style={featureIcon}>&#9679;</span> Quizzes to test your
                understanding
              </Text>
              <Text style={feature}>
                <span style={featureIcon}>&#9679;</span> Earn XP and build
                learning streaks
              </Text>
              <Text style={feature}>
                <span style={featureIcon}>&#9679;</span> Flashcards for quick
                revision
              </Text>
            </Section>

            <Button style={button} href="https://teachmelikeim10.xyz">
              START LEARNING
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>teachmelikeim10.xyz</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#070b14",
  fontFamily:
    'Georgia, "Times New Roman", serif',
};

const container = {
  margin: "0 auto",
  padding: "48px 20px",
  maxWidth: "480px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "40px",
};

const brandDots = {
  fontSize: "10px",
  letterSpacing: "4px",
  marginBottom: "10px",
};

const brandName = {
  color: "#e2e8f0",
  fontSize: "20px",
  fontWeight: "400",
  fontStyle: "italic",
  margin: "0",
};

const content = {
  backgroundColor: "#0e121b",
  borderRadius: "16px",
  border: "1px solid #1b1f27",
  padding: "36px",
};

const heading = {
  color: "#e2e8f0",
  fontSize: "26px",
  fontWeight: "400",
  fontFamily: 'Georgia, "Times New Roman", serif',
  marginBottom: "16px",
  marginTop: "0",
};

const paragraph = {
  color: "#5f636c",
  fontSize: "14px",
  lineHeight: "1.7",
  marginBottom: "24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const featureList = {
  marginBottom: "28px",
};

const feature = {
  color: "#757a82",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "8px 0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const featureIcon = {
  color: "#4ade80",
  fontSize: "8px",
  marginRight: "8px",
};

const button = {
  backgroundColor: "#082524",
  border: "1px solid #0a3f35",
  borderRadius: "12px",
  color: "#6ee7b7",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  letterSpacing: "1.5px",
};

const hr = {
  borderColor: "#131720",
  margin: "32px 0 16px",
};

const footer = {
  color: "#282c35",
  fontSize: "12px",
  textAlign: "center" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};
