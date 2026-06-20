"use client";

import dynamic from "next/dynamic";

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

export { Header as HeaderLoader };
