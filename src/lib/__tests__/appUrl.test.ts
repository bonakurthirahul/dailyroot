import { describe, expect, it } from 'vitest'
import { buildTableUrl, isLocalhostUrl, resolveAppBaseUrl } from '../appUrl'

describe('isLocalhostUrl', () => {
  it('detects local hosts', () => {
    expect(isLocalhostUrl('http://localhost:5173')).toBe(true)
    expect(isLocalhostUrl('http://127.0.0.1:5173')).toBe(true)
    expect(isLocalhostUrl('http://my-pc.local')).toBe(true)
  })

  it('treats public hosts as non-local', () => {
    expect(isLocalhostUrl('https://order.brewbean.com')).toBe(false)
  })

  it('fails safe on invalid input', () => {
    expect(isLocalhostUrl('not a url')).toBe(false)
  })
})

describe('resolveAppBaseUrl', () => {
  it('prefers the configured public URL and strips trailing slashes', () => {
    expect(
      resolveAppBaseUrl('http://localhost:5173', 'https://order.brewbean.com/'),
    ).toBe('https://order.brewbean.com')
  })

  it('falls back to the current origin when unset', () => {
    expect(resolveAppBaseUrl('http://localhost:5173', null)).toBe(
      'http://localhost:5173',
    )
  })
})

describe('buildTableUrl', () => {
  it('builds a table URL from the configured base', () => {
    expect(
      buildTableUrl('ABCDEF0123456789ABCDEF', 'http://localhost:5173', 'https://order.brewbean.com'),
    ).toBe('https://order.brewbean.com/t/ABCDEF0123456789ABCDEF')
  })

  it('builds a table URL from the origin when unset', () => {
    expect(buildTableUrl('ABCDEF0123456789ABCDEF', 'http://localhost:5173', null)).toBe(
      'http://localhost:5173/t/ABCDEF0123456789ABCDEF',
    )
  })

  it('encodes unsafe token characters', () => {
    expect(buildTableUrl('a/b c', 'http://localhost:5173', null)).toBe(
      'http://localhost:5173/t/a%2Fb%20c',
    )
  })
})
