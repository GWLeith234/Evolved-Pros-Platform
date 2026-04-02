import { LogoMark } from '@/components/ui/LogoMark'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 48px',
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <LogoMark variant="light" height={32} />
      </div>
      {children}
    </div>
  )
}
