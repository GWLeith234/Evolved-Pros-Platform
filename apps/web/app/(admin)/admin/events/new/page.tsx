import { EventForm } from '../EventForm'

export default function NewEventPage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <a
          href="/admin/events"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[color:var(--admin-text-2)] hover:text-[color:var(--admin-text)] transition-colors"
        >
          ← Back to Events
        </a>
      </div>
      <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)] mb-6">New Event</h1>
      <EventForm />
    </div>
  )
}
