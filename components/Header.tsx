'use client'

import {
  useCurrentAccount,
  useDAppKit,
  useWalletConnection,
} from '@mysten/dapp-kit-react'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn, truncateAddress } from '@/lib/utils'

// Globe-mark: outer circle + longitude oval + equator line.
// Pure inline SVG — no external icon dep, renders at any DPI.
function LogoMark() {
  return (
    <div
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
      style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #B45309 100%)',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="7" cy="7" r="5.5"
          stroke="white" strokeWidth="1.3" strokeOpacity="0.95"
        />
        <ellipse
          cx="7" cy="7" rx="2.4" ry="5.5"
          stroke="white" strokeWidth="1" strokeOpacity="0.7"
        />
        <line
          x1="1.5" y1="7" x2="12.5" y2="7"
          stroke="white" strokeWidth="1" strokeOpacity="0.7"
        />
      </svg>
    </div>
  )
}

// This component reads live wallet state via window/Wallet Standard,
// so it must never be server-rendered. It is dynamically imported with
// ssr:false via components/HeaderLoader.tsx.
//
// Per the official @mysten/dapp-kit-react migration guide, wallet
// actions are NOT hooks in this package — they are called directly
// off the dAppKit instance via useDAppKit():
//   dAppKit.connectWallet()
//   dAppKit.disconnectWallet()
// Connection status comes from useWalletConnection(), not a boolean.
export function Header() {
  const account    = useCurrentAccount()
  const dAppKit    = useDAppKit()
  const connection = useWalletConnection()

  const isConnected = connection.status === 'connected'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'flex items-center justify-between',
        'border-b border-white/10 px-4 py-3',
        'bg-[#0a0a0f]/80 backdrop-blur-md',
      )}
    >
      {/* Left — gradient globe mark + wordmark */}
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-sm font-semibold tracking-tight text-white/90">
          World Arena
        </span>
      </div>

      {/* Right — wallet state + theme toggle */}
      <div className="flex items-center gap-2">
        {isConnected && account ? (
          // Address pill doubles as disconnect trigger — keeps the
          // header uncluttered vs a separate "Disconnect" button.
          <button
            onClick={() => dAppKit.disconnectWallet()}
            title="Click to disconnect wallet"
            className={cn(
              'rounded-full px-3 py-1',
              'bg-white/10 hover:bg-red-500/20',
              'text-xs font-mono text-white/80 hover:text-red-300',
              'transition-colors duration-200 cursor-pointer',
            )}
          >
            {truncateAddress(account.address)}
          </button>
        ) : (
          <ConnectButton />
        )}

        <ThemeToggle />
      </div>
    </header>
  )
}
