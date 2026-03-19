"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CaseData } from "@/lib/ocr";

interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

interface CalendarStepProps {
  selectedCases: CaseData[];
  onBack: () => void;
  onReset: () => void;
}

interface ToastState {
  message: string;
  type: "success" | "partial" | "error" | "auth";
}

export default function CalendarStep({
  selectedCases,
  onBack,
  onReset,
}: CalendarStepProps) {
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch calendars on mount
  useEffect(() => {
    async function fetchCalendars() {
      const res = await fetch("/api/calendars");
      if (res.status === 401) {
        setToast({
          message: "Session expired. Please sign in again.",
          type: "auth",
        });
        return;
      }
      const data = await res.json();
      const cals: CalendarOption[] = data.calendars ?? [];
      setCalendars(cals);
      const primary = cals.find((c) => c.primary);
      if (primary) {
        setSelectedCalendarId(primary.id);
      } else if (cals.length > 0) {
        setSelectedCalendarId(cals[0].id);
      }
    }
    fetchCalendars();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const selectedCalendarName =
    calendars.find((c) => c.id === selectedCalendarId)?.summary ?? "";

  const handleAddToCalendar = useCallback(async () => {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: selectedCalendarId,
          cases: selectedCases,
        }),
      });

      if (res.status === 401) {
        setToast({
          message: "Session expired. Please sign in again.",
          type: "auth",
        });
        return;
      }

      const data = await res.json();
      const results: Array<{ caseNumber: string; success: boolean }> =
        data.results ?? [];

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        setToast({
          message: `${successCount} events added to ${selectedCalendarName}`,
          type: "success",
        });
        toastTimerRef.current = setTimeout(() => {
          onReset();
        }, 3000);
      } else if (successCount > 0) {
        setToast({
          message: `${successCount} of ${results.length} events added. ${failCount} failed.`,
          type: "partial",
        });
      } else {
        setToast({
          message: `${successCount} of ${results.length} events added. ${failCount} failed.`,
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "Failed to create events. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCalendarId, selectedCases, selectedCalendarName, onReset]);

  const toastColorClass =
    toast?.type === "success"
      ? "bg-green-100 border-green-400 text-green-800"
      : toast?.type === "partial"
        ? "bg-orange-100 border-orange-400 text-orange-800"
        : toast?.type === "auth"
          ? "bg-yellow-100 border-yellow-400 text-yellow-800"
          : "bg-red-100 border-red-400 text-red-800";

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Summary */}
      <p className="text-sm font-medium text-gray-700">
        {selectedCases.length} cases selected
      </p>

      {/* Calendar dropdown */}
      <div>
        <label
          htmlFor="calendar-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Choose a calendar
        </label>
        <select
          id="calendar-select"
          value={selectedCalendarId}
          onChange={(e) => setSelectedCalendarId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.summary}
            </option>
          ))}
        </select>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          data-testid="toast"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${toastColorClass}`}
        >
          {toast.message}
          {toast.type === "auth" && (
            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="ml-3 underline font-semibold"
            >
              Sign in again
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleAddToCalendar}
          disabled={loading || calendars.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <svg
              data-testid="loading-spinner"
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          Add to Calendar
        </button>
      </div>
    </div>
  );
}
