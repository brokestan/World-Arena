import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import { WalletProviderClient } from "@/components/WalletProviderClient";

const Header = dynamic(
  () => import("@/components/Header").then((mod) => mod.Header),
  {
    ssr: false,
    loading: () => (
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          World Arena
        </span>
        <button
          disabled
          className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-white/40"
        >
          Loading wallet...
        </button>
      </header>
    ),
  },
);

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
          <Header />
          {children}
        </WalletProviderClient>
      </body>
    </html>
  );
}
