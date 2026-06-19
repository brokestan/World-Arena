import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

// World Arena targets Sui mainnet only — this is a hackathon
// mainnet-listing requirement. See ARCHITECTURE.md.
const GRPC_URLS = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
} as const;

export const dAppKit = createDAppKit({
  networks: ["mainnet"],
  createClient: (network: keyof typeof GRPC_URLS) =>
    new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
  // Explicit, not relied on as a silent default: on page load, dApp Kit
  // checks the browser's own wallet-standard state and silently restores
  // the most recently used wallet account without a popup. This is what
  // prevents the user from having to reconnect on every visit/refresh.
  // There is no cookie or server-side session involved — this is purely
  // browser-side reconnection, managed internally by dApp Kit.
  autoConnect: true,
});

// Register types so dApp Kit hooks infer the right types app-wide.
declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
