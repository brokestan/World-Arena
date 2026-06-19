import Link from "next/link";

const ROUTES = [
  {
    href: "/personal",
    label: "Personal Room",
    description: "Private chat with your Personal Agent.",
  },
  {
    href: "/arena",
    label: "World Arena",
    description: "Public chat with The Historian.",
  },
  {
    href: "/personal/log",
    label: "Personal Memory Log",
    description: "Everything in your private namespace.",
  },
  {
    href: "/arena/ledger",
    label: "Arena Ledger",
    description: "The public shared namespace, visible to everyone.",
  },
  {
    href: "/predictions",
    label: "Predictions Portfolio",
    description: "Your accuracy stats and match-by-match picks.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">World Arena</h1>
      <p className="mt-2 text-white/60">
        Persistent AI agent memory, two visibility scopes, one underlying
        memory system.
      </p>

      <nav className="mt-10 flex flex-col gap-3">
        {ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-lg border border-white/10 px-5 py-4 transition hover:border-white/30 hover:bg-white/5"
          >
            <div className="font-medium">{route.label}</div>
            <div className="text-sm text-white/50">{route.description}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
            }
