/** Detect CRM rows that are QA / test fixtures, not live prospects. */

const QA_TAG = /^(qa|test|qa\s*\/\s*test|qa-test|qa-sweep)$/i

export function isQaTestProspect(p: {
  full_name?: string | null
  email?: string | null
  company?: string | null
  source?: string | null
  notes?: string | null
  tags?: string[] | null
}): boolean {
  const tags = p.tags ?? []
  if (tags.some(t => QA_TAG.test(t.trim()) || /^qa[-_\s]/i.test(t.trim()))) return true

  const name = (p.full_name ?? '').trim()
  if (/^qa[\s._-]/i.test(name) || /^test[\s._-]/i.test(name)) return true
  if (/\bqa\d{3,}\b/i.test(name)) return true

  const email = (p.email ?? '').trim().toLowerCase()
  if (email.startsWith('qa-') || email.startsWith('qa_') || email.includes('+qa@')) return true
  if (/^qa\d{3,}@/.test(email)) return true

  const source = (p.source ?? '').trim().toLowerCase()
  if (source === 'qa' || source === 'test' || source === 'qa-sweep') return true

  const company = (p.company ?? '').trim()
  if (/^qa[\s._-]/i.test(company)) return true

  const hay = [name, email, company, source, p.notes ?? ''].join(' ').toLowerCase()
  if (hay.includes('qa-sweep')) return true

  return false
}

export const CRM_TEST_MODE_KEY = 'ep-admin-crm-test-mode'
