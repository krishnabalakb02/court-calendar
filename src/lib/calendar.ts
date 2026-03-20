/**
 * Google Calendar integration — pure functions for listing calendars
 * and creating events from court case data.
 */

import type { CaseData } from "@/lib/ocr";

// ---- Types ----

export interface CalendarEvent {
  id: string;
  caseNumber: string;
  stage: string;
  courtHall: string;
  parties: string;
  previousDate: string;
  hearingDate: string;
  calendarId: string;
}

export interface CalendarEntry {
  id: string;
  summary: string;
  primary: boolean;
}

export interface EventPayload {
  summary: string;
  description: string;
  start: { date: string };
  end: { date: string };
}

export interface EventResult {
  caseNumber: string;
  success: boolean;
  error?: string;
}

// ---- Helpers ----

/**
 * Parse a Google Calendar event item into a CalendarEvent.
 * Only call this on events whose summary contains " | " (CaseDiary fingerprint).
 */
function parseCalendarEvent(
  item: { id: string; summary?: string; description?: string; start?: { date?: string; dateTime?: string } },
  calendarId: string,
): CalendarEvent {
  const summary = item.summary ?? "";
  const pipeIdx = summary.indexOf(" | ");
  const caseNumber = pipeIdx >= 0 ? summary.slice(0, pipeIdx) : summary;
  const stage = pipeIdx >= 0 ? summary.slice(pipeIdx + 3) : "";

  const descLines = (item.description ?? "").split("\n");
  const getField = (prefix: string) => {
    const line = descLines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length) : "";
  };

  const hearingDate =
    item.start?.date ?? item.start?.dateTime?.split("T")[0] ?? "";

  return {
    id: item.id,
    caseNumber,
    stage,
    courtHall: getField("Court: "),
    parties: getField("Parties: "),
    previousDate: getField("Previous Date: "),
    hearingDate,
    calendarId,
  };
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for Google Calendar all-day events.
 */
function toIsoDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return ddmmyyyy;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

// ---- Public functions ----

/**
 * Format a single CaseData into a Google Calendar event insert payload.
 */
export function formatEventPayload(caseData: CaseData): EventPayload {
  const isoDate = toIsoDate(caseData.nextDate);
  return {
    summary: `${caseData.caseNumber} | ${caseData.stage}`,
    description: `Court: ${caseData.courtHall}\nParties: ${caseData.parties}\nPrevious Date: ${caseData.previousDate}`,
    start: { date: isoDate },
    end: { date: isoDate },
  };
}

/**
 * List the user's Google Calendars.
 */
export async function listCalendars(accessToken: string): Promise<CalendarEntry[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();
  const items: Array<{ id: string; summary: string; primary?: boolean }> =
    data.items ?? [];

  return items.map((item) => ({
    id: item.id,
    summary: item.summary,
    primary: item.primary ?? false,
  }));
}

/**
 * Fetch upcoming CaseDiary events from a Google Calendar.
 * Filters by the " | " fingerprint in the event summary.
 */
export async function listUpcomingEvents(
  accessToken: string,
  calendarId: string,
  maxResults = 50,
): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("maxResults", String(maxResults));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const items: Array<{ id: string; summary?: string; description?: string; start?: { date?: string; dateTime?: string } }> =
    data.items ?? [];

  return items
    .filter((item) => (item.summary ?? "").includes(" | "))
    .map((item) => parseCalendarEvent(item, calendarId));
}

/**
 * Create one all-day Google Calendar event per case.
 * Returns per-event success/failure.
 */
export async function createEvents(
  accessToken: string,
  calendarId: string,
  cases: CaseData[],
): Promise<EventResult[]> {
  const results: EventResult[] = [];

  for (const caseData of cases) {
    const payload = formatEventPayload(caseData);

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        results.push({ caseNumber: caseData.caseNumber, success: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        results.push({
          caseNumber: caseData.caseNumber,
          success: false,
          error: errorData.error?.message ?? `HTTP ${response.status}`,
        });
      }
    } catch (err) {
      results.push({
        caseNumber: caseData.caseNumber,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
