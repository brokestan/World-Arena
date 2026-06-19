"use client";

import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// This component reads live wallet state via window/Wallet Standard,
// so it must never be server-rendered. It is dynamically imported with
// ssr:false inside app/layout.tsx.
export function Header() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();

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
            onClick={() => dAppKit.disconnectWallet()}
            className="rounded-md bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => dAppKit.openConnectModal()}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-white/90 transition"
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
      }
