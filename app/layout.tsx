import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teach Me Like I'm 10",
  description:
    "Pick any topic and get layered explanations — from simple to expert. Powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-serif antialiased min-h-screen">{children}</body>
    </html>
  );
}
