'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

// ThemeProvider is SSR-safe — next-themes handles hydration without
// needing ssr:false. The mounted guard lives in ThemeToggle.tsx instead.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  )
}
