import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listCalendars } from "@/lib/calendar";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const calendars = await listCalendars(session.accessToken);
    return NextResponse.json({ calendars });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to list calendars: ${message}` },
      { status: 502 },
    );
  }
}
