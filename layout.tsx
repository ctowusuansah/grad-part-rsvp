import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class of 2026 Grad Party — RSVP",
  description: "RSVP for the Class of 2026 Grad Party at Number 5 Bar and Grill.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body">{children}</body>
    </html>
  );
}
