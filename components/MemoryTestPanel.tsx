"use client";

import { useState } from "react";

type TestResult = {
  namespaces: { private: string; shared: string };
  writes: {
    private: { id: string; blobId: string };
    shared: { id: string; blobId: string };
  };
  isolation: {
    privateRecallSawSharedEntry: boolean;
    sharedRecallSawPrivateEntry: boolean;
    pass: boolean;
  };
  broadSharedDryRun: {
    query: string;
    limit: number;
    resultCount: number;
    results: { text: string; distance: number }[];
  };
};

export default function MemoryTestPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [result, setResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runTest() {
    setStatus("running");
    setErrorMessage(null);
    setResult(null);
    try {
      const response = await fetch("/api/dev/memory-test", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : `request_failed_${response.status}`);
      }
      setResult(body as TestResult);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "unknown_error");
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={runTest}
        disabled={status === "running"}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {status === "running" ? "Running…" : "Run isolation test"}
      </button>

      {status === "error" && <p className="mt-3 text-sm text-red-400">Failed: {errorMessage}</p>}

      {result && (
        <div className="mt-4 space-y-3 text-sm">
          <p className={result.isolation.pass ? "text-green-400" : "text-red-400"}>
            Isolation check: {result.isolation.pass ? "PASS" : "FAIL"}
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-white/70">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
    }
