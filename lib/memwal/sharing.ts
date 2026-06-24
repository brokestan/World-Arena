import "server-only"
import { memwal } from './client'
import { memoryNamespace, NAMESPACE } from './namespace'

/**
 * The four categories permitted to cross from private → shared namespace.
 * This is an exhaustive list — no other data ever leaves the private namespace.
 */
export type MirrorCategory =
  | 'prediction'
  | 'opinion'
  | 'favorite_team'
  | 'favorite_player'

/**
 * mirrorToShared — the ONLY controlled pathway from private → shared.
 *
 * Only call site: lib/ai/extraction.ts → runPersonalExtraction.
 * The Historian route must never call this — it has no access to private data.
 * import "server-only" prevents client components from importing this at build time.
 *
 * Caller responsibility:
 *   - For 'prediction': pass the SHARED format string (formatSharedPrediction),
 *     which has the Rationale field stripped.
 *   - For all other categories: text is identical in private and shared.
 */
export async function mirrorToShared(
  walletAddress: string,
  category: MirrorCategory,
  text: string,
): Promise<void> {
  // Belt-and-suspenders category guard even though TypeScript already enforces it
  const allowed: MirrorCategory[] = [
    'prediction',
    'opinion',
    'favorite_team',
    'favorite_player',
  ]
  if (!allowed.includes(category)) {
    console.error(
      `[mirrorToShared] Blocked attempt to mirror unknown category: "${category}"`,
    )
    return
  }

  const sharedNs = memoryNamespace(walletAddress, NAMESPACE.SHARED)
  await memwal.remember(text, sharedNs)
    }
