import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEvents, listUpcomingEvents } from "@/lib/calendar";
import type { CaseData } from "@/lib/ocr";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId");

  if (!calendarId) {
    return NextResponse.json(
      { error: "calendarId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const events = await listUpcomingEvents(session.accessToken, calendarId);
    return NextResponse.json({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch events: ${message}` },
      { status: 502 },
    );
  }
}

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
