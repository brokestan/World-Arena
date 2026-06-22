"use client";

import dynamic from "next/dynamic";

// Same Loader pattern as WalletProviderLoader.tsx / HeaderLoader.tsx —
// see HANDOFF_BATCH_1.md, Section 4. PersonalActivation reads wallet
// state (useCurrentAccount/useDAppKit/useWalletConnection), which
// transitively touches `window` at module-evaluation time. A plain
// "use client" directive on PersonalActivation itself is not enough:
// it's reachable from app/personal/page.tsx, a Server Component, and
// without this wrapper Next could still attempt to evaluate that
// module server-side and fail with "window is not defined" — the
// exact failure this project already hit once in Batch 1.
const PersonalActivation = dynamic(() => import("./PersonalActivation"), {
  ssr: false,
});

export default function PersonalActivationLoader() {
  return <PersonalActivation />;
}
