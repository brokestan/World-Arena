"use client";

import dynamic from "next/dynamic";

// WalletProviderClient wraps the dApp Kit instance (lib/dapp-kit.ts),
// which touches window/Wallet Standard APIs as soon as its module is
// evaluated — not just when rendered. Next.js prerenders the
// auto-generated /_not-found page using the root layout, which would
// otherwise import this provider on the server and crash with
// "window is not defined". ssr:false keeps the entire dApp Kit instance
// out of the server render path, not just Header.
const WalletProviderClient = dynamic(
  () =>
    import("@/components/WalletProviderClient").then(
      (mod) => mod.WalletProviderClient,
    ),
  { ssr: false },
);

export { WalletProviderClient as WalletProviderLoader };
