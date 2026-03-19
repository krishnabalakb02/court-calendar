import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaseDiary - Digitize your court diary",
  description:
    "Upload your court diary, let AI extract hearing dates, and sync them to Google Calendar with one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
