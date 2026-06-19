"use client";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { dAppKit } from "@/lib/dapp-kit";

// This component shell is safe to render on the server — it does not
// itself read wallet state, it only establishes the provider context.
// The component that actually reads wallet state (Header) is the one
// that must be dynamically imported with ssr:false. See ARCHITECTURE.md
// and PROGRESS.md for why this split exists.
export function WalletProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>;
}

export { ConnectButton };
