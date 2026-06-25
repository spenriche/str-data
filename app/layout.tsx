import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Revenue Intelligence",
  description:
    "Institutional-quality revenue analytics across units and cities — YoY / MoM trends, forecasting, and listing hygiene.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
