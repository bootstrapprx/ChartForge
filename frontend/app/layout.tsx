import type { ReactNode } from "react";
import "@/index.css";
import Providers from "./providers";

export const metadata = {
  title: "ChartForge",
  description: "Unified Chart of Accounts Management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
