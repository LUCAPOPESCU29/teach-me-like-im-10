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

interface StreakReminderEmailProps {
  displayName: string;
  streakCount: number;
  unsubscribeUrl: string;
}

export default function StreakReminderEmail({
  displayName,
  streakCount,
  unsubscribeUrl,
}: StreakReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Don't lose your ${streakCount}-day streak!`}</Preview>
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
            <Text style={streakBadge}>{streakCount}</Text>
            <Text style={heading}>
              Don&apos;t lose your streak, {displayName}!
            </Text>
            <Text style={paragraph}>
              You&apos;ve been learning for{" "}
              <strong style={{ color: "#e2e8f0" }}>
                {streakCount} day{streakCount !== 1 ? "s" : ""}
              </strong>{" "}
              in a row. Explore a topic today to keep it going.
            </Text>

            <Button style={button} href="https://teachmelikeim10.xyz">
              KEEP YOUR STREAK
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            <Link href={unsubscribeUrl} style={unsubLink}>
              Unsubscribe from streak reminders
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
  textAlign: "center" as const,
};

const content = {
  backgroundColor: "#0e121b",
  borderRadius: "16px",
  border: "1px solid #1b1f27",
  padding: "36px",
  textAlign: "center" as const,
};

const streakBadge = {
  fontSize: "48px",
  fontWeight: "800",
  color: "#f59e0b",
  margin: "0 0 8px",
  lineHeight: "1",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const heading = {
  color: "#e2e8f0",
  fontSize: "22px",
  fontWeight: "400",
  fontFamily: 'Georgia, "Times New Roman", serif',
  marginBottom: "12px",
  marginTop: "0",
};

const paragraph = {
  color: "#5f636c",
  fontSize: "14px",
  lineHeight: "1.7",
  marginBottom: "24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const button = {
  backgroundColor: "#2b2113",
  border: "1px solid #4e3711",
  borderRadius: "12px",
  color: "#fbbf24",
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
  color: "#333740",
  fontSize: "12px",
  textAlign: "center" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const unsubLink = {
  color: "#333740",
  textDecoration: "underline",
};
