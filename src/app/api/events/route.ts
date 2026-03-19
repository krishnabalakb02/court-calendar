import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEvents } from "@/lib/calendar";
import type { CaseData } from "@/lib/ocr";

interface EventsRequestBody {
  calendarId: string;
  cases: CaseData[];
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  let body: EventsRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.calendarId || !Array.isArray(body.cases)) {
    return NextResponse.json(
      { error: "Request body must include calendarId (string) and cases (array)" },
      { status: 400 },
    );
  }

  try {
    const results = await createEvents(
      session.accessToken,
      body.calendarId,
      body.cases,
    );
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create events: ${message}` },
      { status: 502 },
    );
  }
}
