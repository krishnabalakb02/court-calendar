"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/Header";
import CaseCalendar from "@/components/CaseCalendar";
import type { CalendarEvent, CalendarEntry } from "@/lib/calendar";

interface CaseLandingPageProps {
  onStartWizard: () => void;
}

type ViewMode = "list" | "calendar";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 bg-slate-200 rounded w-40" />
        <div className="h-5 bg-slate-200 rounded w-20" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-56" />
    </div>
  );
}

function formatHearingDate(isoDate: string): string {
  if (!isoDate) return "";
  const [yyyy, mm, dd] = isoDate.split("-");
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function CaseCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className="font-semibold text-slate-800 text-base"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          {event.caseNumber}
        </span>
        {event.stage && (
          <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
            {event.stage}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm font-medium text-orange-500 mb-1.5">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatHearingDate(event.hearingDate)}
      </div>

      <div className="text-sm text-slate-500 space-y-0.5">
        {event.courtHall && (
          <p className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {event.courtHall}
          </p>
        )}
        {event.parties && (
          <p className="truncate text-slate-400 text-xs">{event.parties}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onStartWizard }: { onStartWizard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg
        className="w-16 h-16 text-slate-300 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
      <h3
        className="text-xl font-semibold text-slate-700 mb-2"
        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
      >
        No upcoming cases yet
      </h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">
        Sync your first court ledger to get started. Your cases will appear here.
      </p>
      <button
        onClick={onStartWizard}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors duration-150 cursor-pointer shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Sync Ledger
      </button>
    </div>
  );
}

export default function CaseLandingPage({ onStartWizard }: CaseLandingPageProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // If the token refresh failed, prompt the user to re-authenticate
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn("google", { callbackUrl: "/dashboard" });
    }
  }, [session?.error]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const calRes = await fetch("/api/calendars");
        if (calRes.status === 401) {
          signIn("google", { callbackUrl: "/dashboard" });
          return;
        }
        const calData = await calRes.json();
        const calendars: CalendarEntry[] = calData.calendars ?? [];
        const primary = calendars.find((c) => c.primary) ?? calendars[0];
        if (!primary) {
          setLoading(false);
          return;
        }

        const evRes = await fetch(
          `/api/events?calendarId=${encodeURIComponent(primary.id)}`,
        );
        if (!evRes.ok) throw new Error(`HTTP ${evRes.status}`);
        const evData = await evRes.json();
        setEvents(evData.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-800"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            These are your upcoming cases
          </h1>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden self-start sm:self-auto">
            <button
              onClick={() => setViewMode("list")}
              className={[
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer",
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={[
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer",
                viewMode === "calendar"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Calendar
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={onStartWizard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors duration-150 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Sync Ledger
          </button>
          <button
            onClick={onStartWizard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors duration-150 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Case Manually
          </button>
        </div>

        {/* Content area */}
        {loading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-700">Could not load your cases</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-red-600 underline mt-1 cursor-pointer hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && viewMode === "list" && (
          events.length === 0 ? (
            <EmptyState onStartWizard={onStartWizard} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <CaseCard key={ev.id} event={ev} />
              ))}
            </div>
          )
        )}

        {!loading && !error && viewMode === "calendar" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
            <CaseCalendar events={events} />
          </div>
        )}
      </main>
    </div>
  );
}
