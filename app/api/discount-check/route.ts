import { NextRequest, NextResponse } from "next/server";

// DISCOUNT_CODES env var format: "CODE1:50,CODE2:100,CODE3:25"
// Each entry is CODE:PERCENTAGE_OFF
function getCodes(): Record<string, number> {
  const raw = process.env.DISCOUNT_CODES ?? "";
  const codes: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const [code, pct] = entry.trim().split(":");
    if (code && pct) codes[code.toUpperCase()] = parseInt(pct, 10);
  }
  return codes;
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "No code provided" });
    }

    const codes = getCodes();
    const pct = codes[code.toUpperCase().trim()];

    if (pct === undefined) {
      return NextResponse.json({ valid: false, error: "Invalid code" });
    }

    return NextResponse.json({ valid: true, discount: pct }); // discount = % off
  } catch {
    return NextResponse.json({ valid: false, error: "Server error" });
  }
}
