'use client'

import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

// Unsplash aerial stadium photo — swap the photo ID if you want a
// different shot. Format params keep it fast on mobile.
const STADIUM_URL =
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2' +
  '?auto=format&fit=crop&w=1400&q=75'

interface ChatShellProps {
  variant: 'personal' | 'arena'
  children: React.ReactNode
  className?: string
}

// ChatShell provides the visual background for each room.
// It does NOT set its own height — the parent page is responsible
// for giving it a sized flex context (see Sub-batch D pages).
export function ChatShell({ variant, children, className }: ChatShellProps) {
  // resolvedTheme is always defined on the client.
  // Defaults to 'dark' on server/before mount, matching defaultTheme.
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  // ── Arena ──────────────────────────────────────────────────────────
  if (variant === 'arena') {
    return (
      <div className={cn('relative flex flex-col overflow-hidden', className)}>
        {/* Background: aerial stadium photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${STADIUM_URL}')` }}
        />

        {/* Dark overlay — slightly lighter in light mode so photo shows */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'rgba(10, 10, 15, 0.82)'
              : 'rgba(10, 10, 15, 0.68)',
          }}
        />

        {/* Bottom fade — seats the ChatInput on a clean surface */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
          style={{
            background:
              'linear-gradient(to top, #0a0a0f 10%, transparent 100%)',
          }}
        />

        {/* Content above all layers */}
        <div className="relative z-10 flex flex-1 flex-col min-h-0">
          {children}
        </div>
      </div>
    )
  }

  // ── Personal ───────────────────────────────────────────────────────
  return (
    <div
      className={cn('flex flex-col', className)}
      style={{
        background: isDark
          ? 'radial-gradient(ellipse 85% 55% at 15% 12%, rgba(124,58,237,0.20) 0%, transparent 65%), #0a0a0f'
          : 'radial-gradient(ellipse 85% 55% at 15% 12%, rgba(124,58,237,0.10) 0%, transparent 65%), #f7f7fb',
      }}
    >
      {children}
    </div>
  )
        }
