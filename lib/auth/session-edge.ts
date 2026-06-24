/**
 * Edge-Runtime-compatible session verification.
 *
 * lib/auth/session.ts uses node:crypto (createHmac, timingSafeEqual) which is
 * unavailable in the Edge Runtime. This file reimplements HMAC-SHA256
 * verification using the Web Crypto API (crypto.subtle), which is available
 * in both Edge Runtime and modern Node.js.
 *
 * Both files produce and verify the SAME cookie format:
 *   {base64url(JSON payload)}.{base64url(HMAC-SHA256)}
 * — so session cookies minted by lib/auth/session.ts (in the Node.js
 * /api/auth/verify route) are verifiable here without any migration.
 */
import "server-only"
import type { NextRequest } from 'next/server'
import type { Session } from '@/lib/types'

export const SESSION_COOKIE_NAME = 'world_arena_session'

async function hmacSha256Base64url(key: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
  // Convert ArrayBuffer → base64url (same output as Node's .digest("base64url"))
  let binary = ''
  for (const byte of new Uint8Array(sigBuffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Read and verify the session cookie from a NextRequest (Edge-safe).
 * Returns the decoded Session on success, null on any failure.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return null

  const signingKey = process.env.SESSION_SIGNING_KEY
  if (!signingKey) return null

  // Verify HMAC — constant-time comparison to avoid timing attacks
  const expected = await hmacSha256Base64url(signingKey, payloadB64)
  const enc = new TextEncoder()
  const expectedBytes = enc.encode(expected)
  const actualBytes = enc.encode(signature)
  if (expectedBytes.length !== actualBytes.length) return null
  let diff = 0
  for (let i = 0; i < expectedBytes.length; i++) diff |= expectedBytes[i] ^ actualBytes[i]
  if (diff !== 0) return null

  // Decode payload (base64url → JSON)
  let session: Session
  try {
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    session = JSON.parse(json)
  } catch {
    return null
  }

  if (!session.walletAddress || !session.expiresAt) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null

  return session
    }
