import type { Metadata } from "next";
import { SettingsProvider } from "@/components/settings-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendGrove",
  description: "Privacy-first Australian personal finance, powered by user-controlled CSV imports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
