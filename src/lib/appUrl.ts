import { publicAppUrl } from './env'

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '0.0.0.0']

export function isLocalhostUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return LOCAL_HOSTNAMES.includes(host) || host.endsWith('.local')
  } catch {
    return false
  }
}

/**
 * Resolve the base URL to embed in a table QR code.
 * Prefers an explicitly configured public URL; otherwise the current origin.
 */
export function resolveAppBaseUrl(
  origin: string,
  configured: string | null = publicAppUrl,
): string {
  const base = (configured ?? origin).replace(/\/+$/, '')
  return base
}

export function buildTableUrl(
  token: string,
  origin: string,
  configured: string | null = publicAppUrl,
): string {
  const base = resolveAppBaseUrl(origin, configured)
  return `${base}/t/${encodeURIComponent(token)}`
}
