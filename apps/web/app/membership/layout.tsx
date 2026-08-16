import { SessionOptionalShell } from '@/components/layout/SessionOptionalShell'

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionOptionalShell signInHref="/login?redirect=/membership">
      {children}
    </SessionOptionalShell>
  )
}
