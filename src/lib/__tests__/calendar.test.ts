import type { CaseData } from "@/lib/ocr";
import {
  formatEventPayload,
  listCalendars,
  createEvents,
} from "@/lib/calendar";

function mockResponse(body: object, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

let mockFetch: jest.Mock;

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

const sampleCase: CaseData = {
  previousDate: "10/01/2025",
  courtHall: "Hall 3",
  caseNumber: "CS/123/2025",
  parties: "Kumar vs State",
  stage: "Arguments",
  nextDate: "25/03/2025",
  confidence: "high",
};

const sampleCase2: CaseData = {
  previousDate: "05/02/2025",
  courtHall: "Hall 7",
  caseNumber: "CR/456/2025",
  parties: "Singh vs Sharma",
  stage: "Evidence",
  nextDate: "28/03/2025",
  confidence: "high",
};

const sampleCase3: CaseData = {
  previousDate: "12/03/2025",
  courtHall: "Hall 1",
  caseNumber: "WP/789/2025",
  parties: "Gupta vs Union of India",
  stage: "Orders",
  nextDate: "01/04/2025",
  confidence: "low",
};

describe("formatEventPayload", () => {
  it("produces correct title format {caseNumber} | {stage}", () => {
    const payload = formatEventPayload(sampleCase);
    expect(payload.summary).toBe("CS/123/2025 | Arguments");
  });

  it("sets correct all-day date from nextDate (DD/MM/YYYY -> YYYY-MM-DD)", () => {
    const payload = formatEventPayload(sampleCase);
    expect(payload.start.date).toBe("2025-03-25");
    expect(payload.end.date).toBe("2025-03-25");
  });

  it("includes court hall, parties, previous date in description", () => {
    const payload = formatEventPayload(sampleCase);
    expect(payload.description).toContain("Court: Hall 3");
    expect(payload.description).toContain("Parties: Kumar vs State");
    expect(payload.description).toContain("Previous Date: 10/01/2025");
  });
});

describe("listCalendars", () => {
  it("calls the correct Google API endpoint with auth header", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        items: [
          { id: "primary", summary: "My Calendar", primary: true },
        ],
      }),
    );

    await listCalendars("test-token-123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: "Bearer test-token-123",
        },
      },
    );
  });

  it("returns simplified calendar objects", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        items: [
          {
            id: "primary-id",
            summary: "My Calendar",
            primary: true,
            extra: "ignored",
          },
          {
            id: "work-id",
            summary: "Work Calendar",
            primary: false,
            timeZone: "Asia/Kolkata",
          },
        ],
      }),
    );

    const calendars = await listCalendars("token");

    expect(calendars).toEqual([
      { id: "primary-id", summary: "My Calendar", primary: true },
      { id: "work-id", summary: "Work Calendar", primary: false },
    ]);
  });
});

describe("createEvents", () => {
  it("with 3 cases makes 3 API calls", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "event-id" }));

    await createEvents("token", "cal-id", [sampleCase, sampleCase2, sampleCase3]);

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("returns per-event success/failure status", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "event-id" }));

    const results = await createEvents("token", "cal-id", [sampleCase]);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      caseNumber: "CS/123/2025",
      success: true,
    });
  });

  it("handles partial failures (2 succeed, 1 fails)", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ id: "ev-1" }))
      .mockResolvedValueOnce(mockResponse({ id: "ev-2" }))
      .mockResolvedValueOnce(mockResponse({ error: "quota exceeded" }, 403));

    const results = await createEvents("token", "cal-id", [
      sampleCase,
      sampleCase2,
      sampleCase3,
    ]);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ caseNumber: "CS/123/2025", success: true });
    expect(results[1]).toEqual({ caseNumber: "CR/456/2025", success: true });
    expect(results[2]).toEqual({
      caseNumber: "WP/789/2025",
      success: false,
      error: expect.any(String),
    });
  });

  it("with empty cases array returns empty results", async () => {
    const results = await createEvents("token", "cal-id", []);

    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
