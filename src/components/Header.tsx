"use client";

import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-indigo-600">CaseDiary</h1>
        <div className="flex items-center gap-4">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User avatar"}
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="hidden text-sm text-gray-700 sm:inline">
            {session.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
