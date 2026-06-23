import type { Metadata } from 'next'
import './globals.css'
import { WalletProviderLoader } from '@/components/WalletProviderLoader'
import { HeaderLoader } from '@/components/HeaderLoader'
import { Providers } from './providers'
import { BottomNav } from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'World Arena',
  description: 'AI-agent-memory football predictions for the World Cup.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: required on <html> only — next-themes
    // injects the resolved class name after hydration, which React would
    // otherwise warn about. Do not copy this to any other element.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {/* WalletProviderLoader: dynamic(ssr:false) wrapping DAppKit.
              Header lives inside because it reads wallet state. */}
          <WalletProviderLoader>
            <HeaderLoader />
            {/* pb-20 clears the fixed BottomNav (64px + safe area) */}
            <div className="pb-20">
              {children}
            </div>
          </WalletProviderLoader>

          {/* BottomNav lives outside WalletProviderLoader — it uses only
              usePathname(), has no wallet dependency, and doesn't need
              the dynamic(ssr:false) boundary. Providers gives it
              ThemeProvider context if ever needed. */}
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
