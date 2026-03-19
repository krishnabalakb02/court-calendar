/**
 * Google Calendar integration — pure functions for listing calendars
 * and creating events from court case data.
 */

import type { CaseData } from "@/lib/ocr";

// ---- Types ----

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
