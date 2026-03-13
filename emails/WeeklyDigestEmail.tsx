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

interface TopicSummary {
  name: string;
  slug: string;
  maxLevel: number;
}

interface WeeklyDigestEmailProps {
  displayName: string;
  topicsThisWeek: TopicSummary[];
  xpEarned: number;
  totalXp: number;
  currentTitle: string;
  streakCount: number;
  suggestedTopics: string[];
  unsubscribeUrl: string;
}

const levelLabels = ["", "Kid", "Teen", "Undergrad", "Grad", "Expert"];

export default function WeeklyDigestEmail({
  displayName,
  topicsThisWeek,
  xpEarned,
  totalXp,
  currentTitle,
  streakCount,
  suggestedTopics,
  unsubscribeUrl,
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your week: ${xpEarned} XP earned, ${topicsThisWeek.length} topic${topicsThisWeek.length !== 1 ? "s" : ""} explored`}</Preview>
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
            <Text style={heading}>Your week in review</Text>
            <Text style={greeting}>Hey {displayName},</Text>
            <Text style={paragraph}>
              Here&apos;s what you accomplished this week:
            </Text>

            {/* Stats row */}
            <Section style={statsRow}>
              <Section style={statBox}>
                <Text style={statValue}>{xpEarned}</Text>
                <Text style={statLabel}>XP Earned</Text>
              </Section>
              <Section style={statBox}>
                <Text style={statValue}>{topicsThisWeek.length}</Text>
                <Text style={statLabel}>Topics</Text>
              </Section>
              <Section style={statBox}>
                <Text style={statValue}>{streakCount}</Text>
                <Text style={statLabel}>Day Streak</Text>
              </Section>
            </Section>

            {/* Current level */}
            <Text style={levelText}>
              Level: <strong style={{ color: "#4ade80" }}>{currentTitle}</strong>{" "}
              &middot; {totalXp} total XP
            </Text>

            {/* Topics explored */}
            {topicsThisWeek.length > 0 && (
              <>
                <Hr style={sectionHr} />
                <Text style={sectionHeading}>Topics Explored</Text>
                {topicsThisWeek.map((topic) => (
                  <Text key={topic.slug} style={topicItem}>
                    <span style={{ color: "#4ade80" }}>&#9679;</span>{" "}
                    <Link
                      href={`https://teachmelikeim10.xyz/learn/${topic.slug}`}
                      style={topicLink}
                    >
                      {topic.name}
                    </Link>
                    <span style={topicLevel}>
                      {" "}
                      &middot; Level {topic.maxLevel}{" "}
                      {levelLabels[topic.maxLevel] || ""}
                    </span>
                  </Text>
                ))}
              </>
            )}

            {/* Suggested topics */}
            {suggestedTopics.length > 0 && (
              <>
                <Hr style={sectionHr} />
                <Text style={sectionHeading}>Try Next</Text>
                {suggestedTopics.map((topic) => (
                  <Text key={topic} style={topicItem}>
                    <span style={{ color: "#a855f7" }}>&#9679;</span> {topic}
                  </Text>
                ))}
              </>
            )}

            <Hr style={sectionHr} />

            <Button style={button} href="https://teachmelikeim10.xyz">
              CONTINUE LEARNING
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            <Link href={unsubscribeUrl} style={unsubLink}>
              Unsubscribe from weekly digests
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
};

const heading = {
  color: "#e2e8f0",
  fontSize: "24px",
  fontWeight: "400",
  fontFamily: 'Georgia, "Times New Roman", serif',
  marginBottom: "4px",
  marginTop: "0",
};

const greeting = {
  color: "#757a82",
  fontSize: "15px",
  marginBottom: "4px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const paragraph = {
  color: "#5f636c",
  fontSize: "14px",
  marginBottom: "24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const statsRow = {
  display: "flex" as const,
  textAlign: "center" as const,
  marginBottom: "16px",
};

const statBox = {
  display: "inline-block" as const,
  width: "33%",
  textAlign: "center" as const,
};

const statValue = {
  color: "#e2e8f0",
  fontSize: "28px",
  fontWeight: "800",
  margin: "0",
  lineHeight: "1.2",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const statLabel = {
  color: "#3e424b",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "4px 0 0",
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const levelText = {
  color: "#5f636c",
  fontSize: "13px",
  textAlign: "center" as const,
  marginBottom: "8px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const sectionHr = {
  borderColor: "#131720",
  margin: "20px 0",
};

const sectionHeading = {
  color: "#5f636c",
  fontSize: "12px",
  fontWeight: "600",
  marginBottom: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const topicItem = {
  color: "#757a82",
  fontSize: "14px",
  margin: "8px 0",
  lineHeight: "1.4",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const topicLink = {
  color: "#757a82",
  textDecoration: "none",
};

const topicLevel = {
  color: "#333740",
  fontSize: "12px",
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
  color: "#333740",
  fontSize: "12px",
  textAlign: "center" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const unsubLink = {
  color: "#333740",
  textDecoration: "underline",
};
