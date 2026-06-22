"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useDAppKit, useWalletConnection } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { buildSignInMessage } from "@/lib/auth/sign-in-message";

type Status = "idle" | "signing" | "verifying" | "error";

export default function PersonalActivation() {
  const account = useCurrentAccount();
  const connection = useWalletConnection();
  const dAppKit = useDAppKit();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConnected = connection.status === "connected" && !!account;

  async function handleVerify() {
    if (!account) return;
    setStatus("signing");
    setErrorMessage(null);

    try {
      // Free, off-chain — no gas, no transaction. This signature is
      // the entire identity proof for this app; see ARCHITECTURE.md.
      const timestamp = new Date().toISOString();
      const message = buildSignInMessage(account.address, timestamp);
      const messageBytes = new TextEncoder().encode(message);

      const { signature } = await dAppKit.signPersonalMessage({ message: messageBytes });

      setStatus("verifying");

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account.address, signature, timestamp }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "verification_failed");
      }

      // Re-runs app/personal/page.tsx's Server Component with the
      // session cookie now set, switching it to the activated state.
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error && err.message === "expired_timestamp"
          ? "That took too long — try again."
          : "Couldn't verify that signature. Try again.",
      );
    }
  }

  if (!isConnected) {
    return (
      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-5">
        <p className="text-sm text-white/70">Connect your wallet to activate your memory.</p>
        <div className="mt-3">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-5">
      <p className="text-sm text-white/70">
        Connected as <span className="font-mono">{account.address}</span>. Sign a free message to
        verify you own this wallet — no gas, no blockchain transaction.
      </p>
      <button
        type="button"
        onClick={handleVerify}
        disabled={status === "signing" || status === "verifying"}
        className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {status === "signing"
          ? "Check your wallet…"
          : status === "verifying"
            ? "Verifying…"
            : "Verify ownership"}
      </button>
      {status === "error" && errorMessage && (
        <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  );
                }
