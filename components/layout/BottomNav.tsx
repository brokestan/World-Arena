'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, MessageCircle, Globe, Trophy, BookOpen, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{
    size?: number
    strokeWidth?: number
    style?: React.CSSProperties
    className?: string
  }>
  activeColor: string
  glowBg: string
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
    href: '/arena/ledger',
    label: 'Ledger',
    icon: ScrollText,
    activeColor: AGENT_CONFIG.the_historian.colorLight,
    glowBg: AGENT_CONFIG.the_historian.colorGlow,
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
  // /arena: exact OR nested paths, but NOT /arena/ledger (that has its own tab)
  if (href === '/arena') {
    return (
      pathname === '/arena' ||
      (pathname.startsWith('/arena/') && !pathname.startsWith('/arena/ledger'))
    )
  }
  // All others: exact OR any nested path
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
            {active && (
              <motion.span
                layoutId="tab-glow"
                className="absolute inset-x-1 inset-y-1 rounded-xl"
                style={{ backgroundColor: tab.glowBg }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            <span className="relative z-10">
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.5}
                style={{
                  color: active
                    ? tab.activeColor
                    : 'rgba(255, 255, 255, 0.30)',
                }}
                className="transition-colors duration-200"
              />
            </span>

            <span
              className="relative z-10 text-[9px] font-medium leading-none transition-colors duration-200"
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
