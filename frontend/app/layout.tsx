import type { ReactNode } from "react";
import "@/index.css";

export const metadata = {
  title: "ChartForge",
  description: "Unified Chart of Accounts Management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
