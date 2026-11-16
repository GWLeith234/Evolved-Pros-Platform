import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { memberOwnedBrandingPath, memberUploadBody } from './memberBrandingPath'

const here = dirname(fileURLToPath(import.meta.url))
const authId = '365a3ddd-1111-4111-8111-111111111111'
const profileId = '09c059f1-2222-4222-8222-222222222222'

describe('memberOwnedBrandingPath', () => {
  it('puts an onboarding avatar under the auth uid with the file extension', () => {
    expect(memberOwnedBrandingPath('avatars', authId, 1784692053472, 'image/jpeg')).toEqual({
      path: `avatars/${authId}/1784692053472.jpg`,
      contentType: 'image/jpeg',
    })
    expect(memberOwnedBrandingPath('avatars', authId, 1784692053472, 'image/png')).toEqual({
      path: `avatars/${authId}/1784692053472.png`,
      contentType: 'image/png',
    })
    expect(memberOwnedBrandingPath('avatars', authId, 10, 'image/webp; charset=binary')).toEqual({
      path: `avatars/${authId}/10.webp`,
      contentType: 'image/webp',
    })
    expect(memberOwnedBrandingPath('banners', authId, 20, 'image/gif')).toEqual({
      path: `banners/${authId}/20.gif`,
      contentType: 'image/gif',
    })
    for (const declared of ['image/jpg', 'image/pjpeg', 'image/jpg; charset=binary']) {
      expect(memberOwnedBrandingPath('avatars', authId, 11, declared), declared).toEqual({
        path: `avatars/${authId}/11.jpg`,
        contentType: 'image/jpeg',
      })
    }
  })

  it('uploads image/jpg and image/pjpeg bytes as image/jpeg', () => {
    const jpeg = new File([Uint8Array.from([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' })
    expect(memberUploadBody(jpeg, 'image/jpeg')).toBe(jpeg)
    for (const declared of ['image/jpg', 'image/pjpeg']) {
      const file = new File([Uint8Array.from([1, 2, 3])], 'a.jpg', { type: declared })
      const body = memberUploadBody(file, 'image/jpeg')
      expect(body.type, declared).toBe('image/jpeg')
      expect(body).not.toBe(file)
    }
  })

  it('does not build the old flat onboarding key or use a different profile id', () => {
    const owned = memberOwnedBrandingPath('avatars', authId, 1784692053472, 'image/jpeg')
    expect(owned?.path).not.toBe(`avatars/${authId}-1784692053472.jpg`)
    expect(owned?.path).not.toBe(`avatars/${profileId}/1784692053472.jpg`)
    expect(owned?.path.startsWith(`avatars/${authId}/`)).toBe(true)
  })

  it('rejects a profile-shaped path injection, an unknown type, and a non-integer time', () => {
    expect(memberOwnedBrandingPath('avatars', `${authId}/../../banners`, 1, 'image/jpeg')).toBeNull()
    expect(memberOwnedBrandingPath('avatars', profileId, 1, 'image/svg+xml')).toBeNull()
    expect(memberOwnedBrandingPath('avatars', authId, 1, 'application/pdf')).toBeNull()
    expect(memberOwnedBrandingPath('avatars', authId, 1, 'text/plain')).toBeNull()
    expect(memberOwnedBrandingPath('avatars', authId, 1.5, 'image/jpeg')).toBeNull()
    expect(memberOwnedBrandingPath('avatars', 'not-a-uuid', 1, 'image/jpeg')).toBeNull()
  })
})

describe('onboarding and banner picker use the auth uid folder', () => {
  const webRoot = resolve(here, '../..')
  const onboarding = readFileSync(resolve(webRoot, 'components/onboarding/OnboardingProfile.tsx'), 'utf8')
  const banner = readFileSync(resolve(webRoot, 'components/profile/BannerPickerModal.tsx'), 'utf8')

  it('onboarding uploads avatars/<auth uid>/<ms>.<ext> from auth.getUser()', () => {
    expect(onboarding).toContain('auth.getUser()')
    expect(onboarding).toContain("memberOwnedBrandingPath('avatars', user.id, Date.now(), file.type)")
    expect(onboarding).toMatch(/\.upload\(\s*owned\.path\b/)
    expect(onboarding).not.toMatch(/avatars\/\$\{[^}]+\}-/)
    const owned = memberOwnedBrandingPath('avatars', authId, 1784692053472, 'image/jpeg')
    expect(owned?.path).toMatch(new RegExp(`^avatars/${authId}/1784692053472\\.jpg$`))
    expect(owned?.path).not.toBe(`avatars/${authId}-1784692053472.jpg`)
  })

  it('the banner picker uploads banners/<auth uid>/... and does not use a profile id prop', () => {
    expect(banner).toContain('auth.getUser()')
    expect(banner).toContain("memberOwnedBrandingPath('banners', user.id, Date.now(), file.type)")
    expect(banner).not.toContain('userId')
    expect(banner).not.toMatch(/banners\/\$\{userId\}/)
  })
})
