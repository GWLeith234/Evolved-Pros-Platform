'use client'

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Badge,
  Avatar,
  Input,
  Textarea,
  SidebarItem,
  ProgressCircle,
  ProgressBar,
  AchievementBanner,
  colors,
  spacing,
  radii,
  gradients,
  pillarColors,
} from '@evolved-pros/ui'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useToast, ToastProvider } from '@/lib/toast'
import { StreakBadge } from '@/components/ui/StreakBadge'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2
        style={{
          color: 'var(--brand-red, #C9302A)',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontSize: 12,
          margin: '0 0 16px',
          paddingBottom: 8,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  )
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ width: 96 }}>
      <div
        style={{
          height: 48,
          background: value,
          border: '1px solid var(--border-color)',
        }}
      />
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        {name}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function ToastDemo() {
  const { showToast } = useToast()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button variant="success" size="sm" onClick={() => showToast('Saved successfully')}>
        Success toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => showToast({ message: 'Heads up — review pending.', variant: 'warning' })}>
        Warning
      </Button>
      <Button variant="primary" size="sm" onClick={() => showToast('Something went wrong', 'error')}>
        Error
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          showToast({
            title: 'Streak',
            message: '7-day discipline unlocked.',
            variant: 'info',
            action: { label: 'View', onClick: () => {} },
          })
        }
      >
        With action
      </Button>
    </div>
  )
}

export function DevComponentsClient() {
  return (
    <ToastProvider>
      <DevComponentsInner />
    </ToastProvider>
  )
}

function DevComponentsInner() {
  const { resolvedTheme } = useTheme()

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 32px 80px',
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 40,
          maxWidth: 1100,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold, #C9A84C)',
            }}
          >
            Sprint 1 · Foundation
          </p>
          <h1
            style={{
              margin: '8px 0 6px',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 36,
              fontWeight: 900,
              color: 'var(--text-primary)',
            }}
          >
            Component Library
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: 'Barlow, sans-serif',
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}
          >
            /dev/components — isolation preview · theme:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{resolvedTheme}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Dark / Light
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div style={{ maxWidth: 1100 }}>
        <Section title="Design tokens — brand">
          {(
            [
              ['red', colors.red],
              ['redHot', colors.redHot],
              ['gold', colors.gold],
              ['teal', colors.teal],
              ['navy', colors.navy],
              ['blue', colors.blue],
              ['violet', colors.violet],
              ['paper', colors.paper],
            ] as const
          ).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </Section>

        <Section title="Design tokens — pillars">
          {(Object.entries(pillarColors) as [string, { name: string; color: string }][]).map(
            ([n, p]) => (
              <Swatch key={n} name={`P${n} ${p.name}`} value={p.color} />
            ),
          )}
        </Section>

        <Section title="Design tokens — spacing / radii">
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 12,
            }}
          >
            {([1, 2, 3, 4, 6, 8, 12] as const).map(k => (
              <div key={k} style={{ border: '1px solid var(--border-color)', padding: 10 }}>
                <div
                  style={{
                    height: 8,
                    width: spacing[k],
                    background: colors.teal,
                    marginBottom: 8,
                  }}
                />
                <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  space-{k}: {spacing[k]}
                </code>
              </div>
            ))}
            {(['none', 'sm', 'md', 'lg', 'pill'] as const).map(k => (
              <div key={k} style={{ border: '1px solid var(--border-color)', padding: 10 }}>
                <div
                  style={{
                    height: 28,
                    width: 48,
                    background: colors.gold,
                    borderRadius: radii[k],
                    marginBottom: 8,
                  }}
                />
                <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  radius-{k}
                </code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Toast system (Sprint 3)">
          <ToastDemo />
        </Section>

        <Section title="Micro-interactions — streaks">
          <StreakBadge days={0} />
          <StreakBadge days={3} />
          <StreakBadge days={7} bump />
          <StreakBadge days={30} />
        </Section>

        <Section title="Button — variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="pill">Pill</Button>
          <Button variant="success">Success</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="tertiary">Tertiary</Button>
        </Section>

        <Section title="Button — sizes / states">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="success" loading>
            Saving
          </Button>
        </Section>

        <Section title="Button — gradients (primary / success)">
          <div
            style={{
              padding: 16,
              background: gradients.primary,
              color: '#fff',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Primary gradient
          </div>
          <div
            style={{
              padding: 16,
              background: gradients.success,
              color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Success gradient
          </div>
          <div
            style={{
              padding: 16,
              background: gradients.gold,
              color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Gold gradient
          </div>
        </Section>

        <Section title="StatCard — scoreboard metrics">
          <StatCard value="12" label="Posts" delta="+3 this week" deltaType="up" accent="violet" />
          <StatCard value="4" label="Events" delta="Steady" deltaType="neutral" accent="gold" />
          <StatCard value="27" label="Podcasts" delta="+5" deltaType="up" accent="blue" />
          <StatCard value="89%" label="Completion" delta="-2%" deltaType="down" accent="red" />
          <StatCard value="6" label="Pillars" pillar={5} hint="Accountability active" />
        </Section>

        <Section title="ProgressCircle — Daily Pulse style">
          <ProgressCircle value={0} sublabel="0/5 done" size="sm" />
          <ProgressCircle value={40} sublabel="2/5 done" size="md" />
          <ProgressCircle value={80} sublabel="4/5 done" pillar={6} size="md" />
          <ProgressCircle value={100} sublabel="All done" size="lg" />
        </Section>

        <Section title="ProgressBar — pillar color coding">
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProgressBar label="Foundation" value={100} pillar={1} />
            <ProgressBar label="Identity" value={72} pillar={2} />
            <ProgressBar label="Mental Toughness" value={45} pillar={3} size="lg" />
            <ProgressBar label="Strategy" value={18} pillar={4} size="sm" />
            <ProgressBar label="Accountability" value={0} pillar={5} />
            <ProgressBar label="Execution" value={60} pillar={6} />
          </div>
        </Section>

        <Section title="AchievementBanner">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AchievementBanner
              eyebrow="Just earned"
              title="Foundation complete"
              description="You finished every lesson in Pillar 1. The ground every operator stands on."
              pillar={1}
              icon="🏆"
              action={<Button variant="secondary" size="sm">View badge</Button>}
            />
            <AchievementBanner
              eyebrow="Streak"
              title="7-day discipline"
              description="Daily pulse completed seven days in a row. Keep the chain intact."
              accentColor={colors.gold}
              icon="🔥"
              action={<Button variant="pill" size="sm">Open scoreboard</Button>}
            />
          </div>
        </Section>

        <Section title="Card">
          <Card className="w-72">
            <CardHeader title="Card Title" eyebrow="Eyebrow" action={<Badge kind="tier" tier="pro" />} />
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                Theme-aware card body using semantic tokens.
              </p>
            </CardBody>
          </Card>
          <Card className="w-72">
            <CardHeader title="Simple Card" />
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                No eyebrow or action slot.
              </p>
            </CardBody>
          </Card>
        </Section>

        <Section title="Badge">
          <Badge kind="tier" tier="pro" />
          <Badge kind="tier" tier="community" />
          <Badge kind="status" status="active" />
          <Badge kind="status" status="trial" />
          <Badge kind="status" status="cancelled" />
          <Badge kind="pillar" label="P1 — Foundation" />
          <Badge kind="plan" label="Annual" />
        </Section>

        <Section title="Avatar">
          <Avatar name="John Smith" size="sm" />
          <Avatar name="John Smith" size="md" />
          <Avatar name="John Smith" size="lg" />
          <Avatar name="Alex Rivera" backgroundColor="#0ABFA3" size="md" />
          <Avatar name="Pro Member" backgroundColor="#C9A84C" size="md" />
        </Section>

        <Section title="Input / Textarea">
          <div style={{ width: 288, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Email Address" placeholder="you@example.com" type="email" />
            <Input label="With Error" placeholder="Enter value" error="This field is required." />
            <Textarea label="Bio" placeholder="Tell the community about yourself..." />
          </div>
        </Section>

        <Section title="SidebarItem">
          <div
            style={{
              width: 224,
              padding: 12,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <SidebarItem icon={<span>🏠</span>} label="Home" active />
            <SidebarItem icon={<span>💬</span>} label="Community" badge={3} />
            <SidebarItem icon={<span>📚</span>} label="Courses" />
            <SidebarItem icon={<span>📅</span>} label="Events" />
          </div>
        </Section>
      </div>
    </div>
  )
}
