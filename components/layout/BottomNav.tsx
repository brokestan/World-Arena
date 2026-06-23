'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, MessageCircle, Globe, Trophy, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'

// BottomNav only uses usePathname() + Framer Motion — no wallet hooks,
// no window access at module-eval time — so no Loader wrapper is needed.
// It's imported directly into app/layout.tsx outside WalletProviderLoader.

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{
    size?: number
    strokeWidth?: number
    style?: React.CSSProperties
    className?: string
  }>
  activeColor: string   // icon + label text color when active
  glowBg: string        // background of the spring-animated glow pill
}

const tabs: Tab[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    activeColor: '#ffffff',
    glowBg: 'rgba(255, 255, 255, 0.07)',
  },
  {
    href: '/personal',
    label: 'Personal',
    icon: MessageCircle,
    // colorLight gives better contrast on dark bg than the raw violet
    activeColor: AGENT_CONFIG.personal_agent.colorLight,
    glowBg: AGENT_CONFIG.personal_agent.colorGlow,
  },
  {
    href: '/arena',
    label: 'Arena',
    icon: Globe,
    activeColor: AGENT_CONFIG.the_historian.colorLight,
    glowBg: AGENT_CONFIG.the_historian.colorGlow,
  },
  {
    href: '/predictions',
    label: 'Picks',
    icon: Trophy,
    activeColor: '#ffffff',
    glowBg: 'rgba(255, 255, 255, 0.07)',
  },
  {
    href: '/personal/log',
    label: 'Log',
    icon: BookOpen,
    activeColor: '#ffffff',
    glowBg: 'rgba(255, 255, 255, 0.07)',
  },
]

function isTabActive(href: string, pathname: string): boolean {
  // Root: exact only
  if (href === '/') return pathname === '/'
  // /personal: exact only — /personal/log has its own tab
  if (href === '/personal') return pathname === '/personal'
  // All others: exact OR any nested path (e.g. /arena/ledger → Arena active)
  return pathname === href || pathname.startsWith(href + '/')
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50',
        'flex items-stretch h-16 pb-safe',
        'border-t border-white/10',
        'bg-[#0a0a0f]/90 backdrop-blur-md',
      )}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.href, pathname)
        const Icon   = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            {/* The glow pill shares a single layoutId across all tabs.
                Framer Motion spring-animates it from whichever tab last
                owned it to the newly active tab. */}
            {active && (
              <motion.span
                layoutId="tab-glow"
                className="absolute inset-x-1.5 inset-y-1 rounded-xl"
                style={{ backgroundColor: tab.glowBg }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Icon — strokeWidth shifts to 2 when active, 1.5 at rest */}
            <span className="relative z-10">
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                style={{
                  color: active
                    ? tab.activeColor
                    : 'rgba(255, 255, 255, 0.30)',
                }}
                className="transition-colors duration-200"
              />
            </span>

            {/* Label */}
            <span
              className="relative z-10 text-[10px] font-medium leading-none transition-colors duration-200"
              style={{
                color: active
                  ? tab.activeColor
                  : 'rgba(255, 255, 255, 0.30)',
              }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
    }
