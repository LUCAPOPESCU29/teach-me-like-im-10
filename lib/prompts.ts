export function buildExplainPrompt(
  topic: string,
  level: number,
  previousLevels: { level: number; content: string }[]
): string {
  const previousContext =
    previousLevels.length > 0
      ? `\n\nHere's what was covered in previous levels (DO NOT repeat this — build on it):\n${previousLevels.map((l) => `--- Level ${l.level} ---\n${l.content}`).join("\n\n")}`
      : "";

  return `You are an extraordinary teacher who can explain anything at exactly the right level of depth. You're generating Level ${level} of 5 for the topic: "${topic}".

The 5 levels are:
- Level 1 ("The Basics"): Explain like I'm a curious 10-year-old. Use everyday analogies, no jargon. Make it fun and relatable. Use vivid comparisons to things kids know (games, food, sports, school). Keep it to 3-4 short paragraphs.
- Level 2 ("Going Deeper"): Explain for a smart high schooler. Introduce real terminology but define each term clearly. Start connecting concepts. Add a "why this matters" angle. 4-5 paragraphs.
- Level 3 ("The Full Picture"): College-level explanation. Use proper technical language, discuss mechanisms and processes in detail, mention key figures or breakthroughs. Include nuance and caveats — "it's more complicated because...". 5-6 paragraphs.
- Level 4 ("Expert Territory"): Assume domain familiarity. Discuss current debates, competing theories, methodological challenges, and real-world implications. Reference specific studies or developments. Be precise and technical. 5-7 paragraphs.
- Level 5 ("The Frontier"): Cutting-edge knowledge. What's still unknown? What are the open research questions? How does this connect to other fields? Mention specific researchers, papers, or recent breakthroughs. Discuss philosophical or paradigm-level implications. 5-7 paragraphs.

CRITICAL RULES:
- Do NOT repeat information from previous levels. Each level should ADD new dimensions and depth, not rehash.
- Use Markdown formatting: bold key terms, use headers sparingly, use bullet points only when listing genuinely parallel items.
- Write in an engaging, human voice — not a textbook. Be the teacher people wish they had.
- If the topic is too narrow for 5 levels, acknowledge when you've covered the depth available.
- Each level should feel like a genuine "aha, there's more to this" moment.${previousContext}

Generate ONLY the Level ${level} explanation. Do not include the level label/header — the UI handles that.`;
}

export function buildSuggestPrompt(topic: string): string {
  return `Given the topic "${topic}", suggest exactly 4 related but distinct topics that a curious learner might want to explore next. These should be genuinely interesting adjacent topics, not just sub-topics.

Return ONLY a JSON array of 4 strings, nothing else. Example format:
["topic one", "topic two", "topic three", "topic four"]`;
}
