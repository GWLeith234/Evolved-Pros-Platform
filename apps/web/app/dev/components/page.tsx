/**
 * /dev/components — Component preview page (development only)
 * Protected by middleware; only accessible when authenticated.
 */

import { Button }                     from '@evolved-pros/ui'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'
import { StatCard }                   from '@evolved-pros/ui'
import { Badge }                      from '@evolved-pros/ui'
import { Avatar }                     from '@evolved-pros/ui'
import { Input, Textarea }            from '@evolved-pros/ui'
import { SidebarItem }                from '@evolved-pros/ui'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2
        className="text-[#ef0e30] font-condensed font-bold uppercase tracking-widest text-xs mb-4 pb-2 border-b border-[rgba(255,255,255,0.06)]"
      >
        {title}
      </h2>
      <div className="flex flex-wrap gap-3 items-start">
        {children}
      </div>
    </section>
  )
}

export default function ComponentsPage() {
  return (
    <div className="min-h-screen p-10" style={{ backgroundColor: '#0d1c27' }}>
      <h1
        className="text-white mb-2"
        style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '36px', fontWeight: 900 }}
      >
        Component Library
      </h1>
      <p className="text-[#7a8a96] text-sm mb-10" style={{ fontFamily: 'Barlow, sans-serif' }}>
        /dev/components — design system preview
      </p>

      {/* Buttons */}
      <Section title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="teal">Teal</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="primary" loading>Loading</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </Section>

      {/* Cards */}
      <Section title="Card">
        <Card className="w-72">
          <CardHeader title="Card Title" eyebrow="Eyebrow" action={<Badge kind="tier" tier="pro" />} />
          <CardBody>
            <p className="text-[#1b3c5a] text-sm">Card body content goes here.</p>
          </CardBody>
        </Card>
        <Card className="w-72">
          <CardHeader title="Simple Card" />
          <CardBody>
            <p className="text-[#1b3c5a] text-sm">No eyebrow or action slot.</p>
          </CardBody>
        </Card>
      </Section>

      {/* StatCards */}
      <Section title="StatCard">
        <StatCard value="247" label="Members" delta="+12 this week" deltaType="up" accent="teal" />
        <StatCard value="89%" label="Completion" delta="Steady" deltaType="neutral" accent="red" />
        <StatCard value="6" label="Active Pillars" accent="navy" />
        <StatCard value="$4,200" label="Revenue" delta="+8%" deltaType="up" accent="gold" />
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <Badge kind="tier" tier="pro" />
        <Badge kind="tier" tier="community" />
        <Badge kind="status" status="active" />
        <Badge kind="status" status="trial" />
        <Badge kind="status" status="cancelled" />
        <Badge kind="pillar" label="P1 — Foundation" />
        <Badge kind="pillar" label="P5 — Accountability" />
        <Badge kind="plan" label="Annual" />
        <Badge kind="plan" label="Monthly" />
      </Section>

      {/* Avatars */}
      <Section title="Avatar">
        <Avatar name="John Smith" size="sm" />
        <Avatar name="John Smith" size="md" />
        <Avatar name="John Smith" size="lg" />
        <Avatar name="Alex Rivera" backgroundColor="#68a2b9" size="md" />
        <Avatar name="Pro Member" backgroundColor="#c9a84c" size="md" />
      </Section>

      {/* Inputs */}
      <Section title="Input / Textarea">
        <div className="w-72 space-y-3">
          <Input label="Email Address" placeholder="you@example.com" type="email" />
          <Input label="With Error" placeholder="Enter value" error="This field is required." />
          <Textarea label="Bio" placeholder="Tell the community about yourself..." />
        </div>
      </Section>

      {/* Sidebar Items */}
      <Section title="SidebarItem">
        <div
          className="w-56 rounded-lg p-3 space-y-1"
          style={{ backgroundColor: '#112535' }}
        >
          <SidebarItem
            icon={<span>🏠</span>}
            label="Home"
            active
          />
          <SidebarItem
            icon={<span>💬</span>}
            label="Community"
            badge={3}
          />
          <SidebarItem
            icon={<span>📚</span>}
            label="Courses"
          />
          <SidebarItem
            icon={<span>📅</span>}
            label="Events"
          />
        </div>
      </Section>
    </div>
  )
}
