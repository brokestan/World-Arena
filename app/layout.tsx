import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderLoader } from "@/components/WalletProviderLoader";
import { HeaderLoader } from "@/components/HeaderLoader";
import { Providers } from "./providers";

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
    // suppressHydrationWarning required — next-themes injects the
    // resolved theme class onto <html> after hydration. Without this,
    // React warns on the class attribute mismatch.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <WalletProviderLoader>
            <HeaderLoader />
            {/* pb-20 clears the fixed BottomNav (added Sub-batch B) */}
            <div className="pb-20">
              {children}
            </div>
            {/* BottomNav inserted here in Sub-batch B */}
          </WalletProviderLoader>
        </Providers>
      </body>
    </html>
  );
}
