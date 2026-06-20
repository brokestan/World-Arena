import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderClient } from "@/components/WalletProviderClient";
import { HeaderLoader } from "@/components/HeaderLoader";

export const metadata: Metadata = {
  title: "World Arena",
  description: "AI-agent-memory football predictions for the World Cup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProviderClient>
          <HeaderLoader />
          {children}
        </WalletProviderClient>
      </body>
    </html>
  );
}
