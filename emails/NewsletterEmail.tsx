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
  Link,
} from "@react-email/components";

interface NewsletterEmailProps {
  displayName: string;
  topicName: string;
  topicSlug: string;
  unsubscribeUrl: string;
}

export default function NewsletterEmail({
  displayName,
  topicName,
  topicSlug,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`This week's topic: ${topicName}`}</Preview>
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
            <Text style={heading}>Hey {displayName},</Text>
            <Text style={paragraph}>
              We picked a topic we think you&apos;ll love exploring this week:
            </Text>

            <Section style={topicCard}>
              <Text style={topicTitle}>{topicName}</Text>
              <Text style={topicSubtitle}>
                5 levels from simple to expert
              </Text>
            </Section>

            <Button
              style={button}
              href={`https://teachmelikeim10.xyz/learn/${topicSlug}`}
            >
              START LEARNING
            </Button>

            <Text style={tipText}>
              Each level builds on the last. Start at Level 1 and see how deep
              you can go!
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            teachmelikeim10.xyz
            <br />
            <Link href={unsubscribeUrl} style={unsubLink}>
              Unsubscribe from the newsletter
            </Link>
          </Text>
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
  fontSize: "22px",
  fontWeight: "400",
  fontFamily: 'Georgia, "Times New Roman", serif',
  marginBottom: "8px",
  marginTop: "0",
};

const paragraph = {
  color: "#5f636c",
  fontSize: "14px",
  lineHeight: "1.7",
  marginBottom: "24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const topicCard = {
  backgroundColor: "#0e121b",
  borderRadius: "12px",
  border: "1px solid #161a22",
  padding: "24px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const topicTitle = {
  color: "#4ade80",
  fontSize: "22px",
  fontWeight: "400",
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: "0 0 6px",
};

const topicSubtitle = {
  color: "#3e424b",
  fontSize: "13px",
  margin: "0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const tipText = {
  color: "#3e424b",
  fontSize: "13px",
  lineHeight: "1.5",
  marginTop: "20px",
  marginBottom: "0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const hr = {
  borderColor: "#131720",
  margin: "32px 0 16px",
};

const footer = {
  color: "#282c35",
  fontSize: "12px",
  textAlign: "center" as const,
  lineHeight: "1.8",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const unsubLink = {
  color: "#333740",
  textDecoration: "underline",
};
