/**
 * Decide whether a URL is safe to fetch from the server.
 *
 * Sponsor-page import (and any similar unfurl) takes a URL from an admin
 * form. Checking only `http:` / `https:` still allows loopback, RFC1918,
 * link-local, and cloud metadata addresses, including the forms the WHATWG
 * parser rewrites (decimal, hex, octal, and IPv4-mapped IPv6). Hostnames are
 * checked separately, after DNS, by the caller.
 */

import { isIP } from 'node:net'

export function normalizeHost(hostname: string): string {
  let host = hostname.trim().toLowerCase()
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  if (host.endsWith('.')) host = host.slice(0, -1)
  const zone = host.indexOf('%')
  if (zone !== -1) host = host.slice(0, zone)
  return host
}

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
])

/** Names that never belong on a public sponsor fetch, before DNS. */
export function blockedHostname(hostname: string): string | null {
  const host = normalizeHost(hostname)
  if (!host) return 'missing host'
  if (BLOCKED_HOSTS.has(host)) return 'blocked host'
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return 'blocked host'
  }
  return null
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = (value * 256 + octet) >>> 0
  }
  return value
}

function inCidr(ip: number, base: number, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return (ip & mask) === (base & mask)
}

/** True for loopback, private, link-local, CGNAT, and the rest of 224/4+. */
export function ipv4Blocked(ip: number): boolean {
  const n = ip >>> 0
  if (inCidr(n, 0x00000000, 8)) return true // 0.0.0.0/8
  if (inCidr(n, 0x0a000000, 8)) return true // 10.0.0.0/8
  if (inCidr(n, 0x64400000, 10)) return true // 100.64.0.0/10
  if (inCidr(n, 0x7f000000, 8)) return true // 127.0.0.0/8
  if (inCidr(n, 0xa9fe0000, 16)) return true // 169.254.0.0/16
  if (inCidr(n, 0xac100000, 12)) return true // 172.16.0.0/12
  if (inCidr(n, 0xc0000000, 24)) return true // 192.0.0.0/24
  if (inCidr(n, 0xc0a80000, 16)) return true // 192.168.0.0/16
  if (inCidr(n, 0xc6120000, 15)) return true // 198.18.0.0/15
  if (n >= 0xe0000000) return true // multicast, reserved, broadcast
  return false
}

function expandIpv6(input: string): bigint | null {
  let address = normalizeHost(input)
  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':')
    if (lastColon === -1) return null
    const v4 = ipv4ToInt(address.slice(lastColon + 1))
    if (v4 == null) return null
    const hi = ((v4 >>> 16) & 0xffff).toString(16)
    const lo = (v4 & 0xffff).toString(16)
    address = `${address.slice(0, lastColon + 1)}${hi}:${lo}`
  }

  const halves = address.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 ? (halves[1] ? halves[1].split(':') : []) : []
  if (halves.length === 1 && head.length !== 8) return null
  const missing = 8 - (head.length + tail.length)
  if (missing < 0) return null
  const groups = halves.length === 2
    ? [...head, ...Array.from({ length: missing }, () => '0'), ...tail]
    : head
  if (groups.length !== 8) return null

  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null
    value = (value << 16n) + BigInt(parseInt(group, 16))
  }
  return value
}

function ipv6Blocked(address: string): boolean {
  const value = expandIpv6(address)
  if (value == null) return true
  if (value === 0n || value === 1n) return true
  if (Number(value >> 118n) === 0x3fa) return true // fe80::/10
  if (Number(value >> 121n) === 0x7e) return true // fc00::/7
  if (Number(value >> 120n) === 0xff) return true // ff00::/8
  const high96 = value >> 32n
  const embedded = Number(value & 0xffffffffn)
  // IPv4-mapped (::ffff:0:0/96) and NAT64 (64:ff9b::/96).
  if (high96 === 0xffffn || high96 === 0x0064ff9b0000000000000000n) {
    return ipv4Blocked(embedded)
  }
  return false
}

/**
 * `null` when the address is a public unicast target.
 * Anything we cannot parse is blocked.
 */
export function blockedAddressReason(address: string): string | null {
  const bare = normalizeHost(address)
  const kind = isIP(bare)
  if (kind === 4) {
    const value = ipv4ToInt(bare)
    if (value == null || ipv4Blocked(value)) return 'non-public address'
    return null
  }
  if (kind === 6) {
    return ipv6Blocked(bare) ? 'non-public address' : null
  }
  return 'unrecognized address'
}

/**
 * Synchronous gate: scheme, userinfo, blocked names, and literal IPs.
 * A hostname that still needs DNS returns null (not blocked yet).
 */
export function publicUrlBlockReason(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'invalid url'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'unsupported scheme'
  if (url.username || url.password) return 'credentials not allowed'
  const host = normalizeHost(url.hostname)
  if (!host) return 'missing host'
  const nameBlock = blockedHostname(host)
  if (nameBlock) return nameBlock
  if (isIP(host)) return blockedAddressReason(host)
  return null
}
