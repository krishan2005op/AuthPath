import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuthPath — OAuth setup, made clear",
  description: "Evidence-backed guides to OAuth app setup, approval, and integration readiness.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
