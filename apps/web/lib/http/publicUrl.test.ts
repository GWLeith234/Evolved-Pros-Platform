import { describe, expect, it } from 'vitest'
import { blockedAddressReason, publicUrlBlockReason } from './publicUrl'

describe('blockedAddressReason', () => {
  it('blocks loopback, private, link-local, metadata, and CGNAT ranges', () => {
    const blocked = [
      '0.0.0.0',
      '0.255.255.255',
      '10.0.0.0',
      '10.1.2.3',
      '10.255.255.255',
      '100.64.0.0',
      '100.127.255.255',
      '127.0.0.1',
      '127.255.255.255',
      '169.254.0.1',
      '169.254.169.254',
      '169.254.255.255',
      '172.16.0.0',
      '172.31.255.255',
      '192.0.0.1',
      '192.168.0.1',
      '192.168.255.255',
      '198.18.0.1',
      '198.19.255.255',
      '224.0.0.1',
      '255.255.255.255',
      '::',
      '::1',
      'fe80::1',
      'fc00::1',
      'fd00::1',
      'ff02::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      '::ffff:a9fe:a9fe',
      '64:ff9b::a9fe:a9fe',
    ]
    for (const address of blocked) {
      expect(blockedAddressReason(address), address).toBe('non-public address')
    }
  })

  it('allows ordinary public addresses', () => {
    for (const address of [
      '1.1.1.1',
      '8.8.8.8',
      '9.255.255.255',
      '11.0.0.1',
      '100.63.255.255',
      '100.128.0.1',
      '126.0.0.1',
      '128.0.0.1',
      '169.253.1.1',
      '169.255.1.1',
      '172.15.255.255',
      '172.32.0.1',
      '192.167.0.1',
      '192.169.0.1',
      '198.17.255.255',
      '198.20.0.1',
      '223.255.255.255',
      '2001:4860:4860::8888',
      '::ffff:8.8.8.8',
      '64:ff9b::808:808',
    ]) {
      expect(blockedAddressReason(address), address).toBeNull()
    }
  })
})

describe('publicUrlBlockReason', () => {
  it('blocks literal private targets, including rewritten IP forms', () => {
    const blocked = [
      'http://127.0.0.1/',
      'http://127.0.0.1:8080/latest/meta-data/',
      'http://2130706433/',
      'http://0x7f000001/',
      'http://0177.0.0.1/',
      'http://127.1/',
      'http://0/',
      'http://169.254.169.254/latest/meta-data/',
      'http://10.1.2.3/',
      'http://192.168.1.20/admin',
      'http://172.16.0.5/',
      'http://[::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:169.254.169.254]/',
      'http://[fd00::1]/',
      'http://[fe80::1]/',
      'http://localhost/',
      'http://localhost./',
      'http://foo.localhost/',
      'http://metadata.google.internal/computeMetadata/v1/',
      'http://printer.local/',
      'http://db.internal/',
      'file:///etc/passwd',
      'gopher://127.0.0.1/',
      'http://user:pass@example.com/',
    ]
    for (const url of blocked) {
      expect(publicUrlBlockReason(url), url).not.toBeNull()
    }
  })

  it('allows public http(s) hosts that still need a DNS check', () => {
    expect(publicUrlBlockReason('https://brand.example/about')).toBeNull()
    expect(publicUrlBlockReason('http://127.0.0.1.example.com/')).toBeNull()
    expect(publicUrlBlockReason('https://8.8.8.8/')).toBeNull()
  })
})
