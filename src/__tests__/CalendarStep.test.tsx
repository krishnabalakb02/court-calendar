import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarStep from "@/components/CalendarStep";
import type { CaseData } from "@/lib/ocr";

// ---- Test data ----

const mockCases: CaseData[] = [
  {
    previousDate: "01/01/2024",
    courtHall: "Hall 3",
    caseNumber: "CS/123/2024",
    parties: "Kumar vs State",
    stage: "Arguments",
    nextDate: "15/01/2024",
    confidence: "high",
  },
  {
    previousDate: "02/01/2024",
    courtHall: "Hall 5",
    caseNumber: "CR/456/2024",
    parties: "Singh vs Sharma",
    stage: "Evidence",
    nextDate: "20/01/2024",
    confidence: "low",
  },
];

const mockCalendars = {
  calendars: [
    { id: "primary-id", summary: "My Calendar", primary: true },
    { id: "work-id", summary: "Work Calendar", primary: false },
  ],
};

const mockOnBack = jest.fn();
const mockOnReset = jest.fn();

// ---- Helpers ----

function mockFetchCalendars() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockCalendars),
  });
}

function mockFetchEventsAllSuccess() {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        results: mockCases.map((c) => ({
          caseNumber: c.caseNumber,
          success: true,
        })),
      }),
  });
}

function mockFetchEventsPartialFailure() {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        results: [
          { caseNumber: "CS/123/2024", success: true },
          { caseNumber: "CR/456/2024", success: false, error: "Quota exceeded" },
        ],
      }),
  });
}

function mockFetchEventsAllFail() {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        results: mockCases.map((c) => ({
          caseNumber: c.caseNumber,
          success: false,
          error: "Server error",
        })),
      }),
  });
}

function renderCalendarStep() {
  return render(
    <CalendarStep
      selectedCases={mockCases}
      onBack={mockOnBack}
      onReset={mockOnReset}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("CalendarStep", () => {
  it("fetches calendars on mount and renders dropdown", async () => {
    global.fetch = jest.fn().mockImplementation(() => mockFetchCalendars());

    await act(async () => {
      renderCalendarStep();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/calendars");

    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("My Calendar");
    expect(options[1]).toHaveTextContent("Work Calendar");
  });

  it("pre-selects the primary calendar", async () => {
    global.fetch = jest.fn().mockImplementation(() => mockFetchCalendars());

    await act(async () => {
      renderCalendarStep();
    });

    const dropdown = screen.getByRole("combobox") as HTMLSelectElement;
    expect(dropdown.value).toBe("primary-id");
  });

  it("shows selected case count", async () => {
    global.fetch = jest.fn().mockImplementation(() => mockFetchCalendars());

    await act(async () => {
      renderCalendarStep();
    });

    expect(screen.getByText("2 cases selected")).toBeInTheDocument();
  });

  it("Add to Calendar button calls POST /api/events with correct payload", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return mockFetchEventsAllSuccess();
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    expect(global.fetch).toHaveBeenCalledWith("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId: "primary-id", cases: mockCases }),
    });
  });

  it("shows loading spinner while creating events", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    let resolveEvents: (value: unknown) => void;
    const eventsPromise = new Promise((resolve) => {
      resolveEvents = resolve;
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return eventsPromise;
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Resolve to clean up
    await act(async () => {
      resolveEvents!({
        ok: true,
        json: () =>
          Promise.resolve({
            results: mockCases.map((c) => ({
              caseNumber: c.caseNumber,
              success: true,
            })),
          }),
      });
    });
  });

  it("button is disabled while loading", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    let resolveEvents: (value: unknown) => void;
    const eventsPromise = new Promise((resolve) => {
      resolveEvents = resolve;
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return eventsPromise;
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    expect(button).not.toBeDisabled();

    await user.click(button);
    expect(button).toBeDisabled();

    await act(async () => {
      resolveEvents!({
        ok: true,
        json: () =>
          Promise.resolve({
            results: mockCases.map((c) => ({
              caseNumber: c.caseNumber,
              success: true,
            })),
          }),
      });
    });
  });

  it("shows success toast with event count on success", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return mockFetchEventsAllSuccess();
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("2 events added to My Calendar")
      ).toBeInTheDocument();
    });

    // Toast should have green styling
    const toast = screen.getByTestId("toast");
    expect(toast.className).toContain("green");
  });

  it("calls onReset after success toast auto-dismisses", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return mockFetchEventsAllSuccess();
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
    });

    // Advance past 3-second auto-dismiss
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it("shows error toast when some events fail", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return mockFetchEventsPartialFailure();
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("1 of 2 events added. 1 failed.")
      ).toBeInTheDocument();
    });

    const toast = screen.getByTestId("toast");
    expect(toast.className).toContain("orange");
  });

  it("shows error toast when all events fail", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/calendars") return mockFetchCalendars();
      if (url === "/api/events") return mockFetchEventsAllFail();
      return Promise.reject(new Error("Unexpected fetch"));
    });

    await act(async () => {
      renderCalendarStep();
    });

    const button = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("0 of 2 events added. 2 failed.")
      ).toBeInTheDocument();
    });

    const toast = screen.getByTestId("toast");
    expect(toast.className).toContain("red");
  });

  it("Back button calls onBack", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockImplementation(() => mockFetchCalendars());

    await act(async () => {
      renderCalendarStep();
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
