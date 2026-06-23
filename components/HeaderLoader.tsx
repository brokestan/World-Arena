'use client'

import dynamic from 'next/dynamic'

const Header = dynamic(
  () => import('@/components/Header').then((mod) => mod.Header),
  {
    ssr: false,
    loading: () => (
      <header
        className="sticky top-0 z-40 w-full flex items-center justify-between
                   border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-md
                   px-4 py-3"
      >
        {/* Logo skeleton */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-white/10 animate-pulse" />
          <span className="text-sm font-semibold tracking-tight text-white/90">
            World Arena
          </span>
        </div>

        {/* Right skeleton: address pill + toggle placeholder */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-white/5" />
        </div>
      </header>
    ),
  },
)

export { Header as HeaderLoader }
