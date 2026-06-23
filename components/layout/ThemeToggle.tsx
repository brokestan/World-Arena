'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Must not render until client knows the resolved theme —
  // otherwise the server renders one icon and the client renders
  // another, causing a hydration mismatch.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Placeholder: exact same dimensions as the real button so the
  // header doesn't shift when it becomes interactive.
  if (!mounted) {
    return (
      <div
        className={cn('h-8 w-8 rounded-full bg-white/5', className)}
        aria-hidden="true"
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-full',
        'bg-white/5 hover:bg-white/10 transition-colors duration-200',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0,  opacity: 1, scale: 1 }}
            exit={{   rotate:  90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="absolute flex items-center justify-center"
          >
            <Moon size={15} strokeWidth={1.5} className="text-white/70" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate:  90, opacity: 0, scale: 0.6 }}
            animate={{ rotate:   0, opacity: 1, scale: 1 }}
            exit={{   rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="absolute flex items-center justify-center"
          >
            <Sun size={15} strokeWidth={1.5} className="text-amber-400" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
      }
