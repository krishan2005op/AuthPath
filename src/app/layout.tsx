import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuthPath — OAuth setup, made clear",
  description: "Evidence-backed guides to OAuth app setup, approval, and integration readiness.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("authpath-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch{document.documentElement.dataset.theme="dark"}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
