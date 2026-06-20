"use client";

import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// This component reads live wallet state via window/Wallet Standard,
// so it must never be server-rendered. It is dynamically imported with
// ssr:false via components/HeaderLoader.tsx.
export function Header() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <span className="text-lg font-semibold tracking-tight">
        World Arena
      </span>

      {account ? (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-mono">
            {truncateAddress(account.address)}
          </span>
          <button
            onClick={() => disconnect()}
            className="rounded-md bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <ConnectButton />
      )}
    </header>
  );
}
