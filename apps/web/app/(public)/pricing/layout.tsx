import { SessionOptionalShell } from '@/components/layout/SessionOptionalShell'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionOptionalShell signInHref="/login?redirect=/pricing">
      {children}
    </SessionOptionalShell>
  )
}
