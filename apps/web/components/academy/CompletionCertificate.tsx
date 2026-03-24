'use client'

interface CompletionCertificateProps {
  courseTitle: string
  courseSlug: string
  memberName: string
  completedAt: string
  userId: string
  nextCourseSlug?: string
}

export function CompletionCertificate({
  courseTitle,
  courseSlug,
  memberName,
  completedAt,
  userId,
  nextCourseSlug,
}: CompletionCertificateProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://evolvedpros.up.railway.app'
  const certUrl = `${appUrl}/academy/${courseSlug}/certificate/${userId}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`
  const dateStr = new Date(completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="flex flex-col items-center text-center px-12 py-16 mx-auto max-w-2xl"
      style={{
        backgroundColor: '#112535',
        border: '2px solid rgba(201,168,76,0.35)',
        borderRadius: '8px',
      }}
    >
      {/* Watermark */}
      <p className="font-condensed font-bold uppercase tracking-[0.25em] text-[11px] mb-8" style={{ color: 'rgba(201,168,76,0.6)' }}>
        EVOLVED·PROS
      </p>

      <p
        className="font-display font-black italic mb-3 leading-tight"
        style={{ fontSize: '42px', color: '#faf9f7' }}
      >
        Course Complete.
      </p>

      <p
        className="font-display font-bold mb-5"
        style={{ fontSize: '28px', color: '#faf9f7' }}
      >
        {courseTitle}
      </p>

      <div className="w-16 h-[2px] mb-5" style={{ backgroundColor: 'rgba(201,168,76,0.4)' }} />

      <p className="font-condensed font-semibold tracking-[0.1em] text-[14px] mb-1" style={{ color: '#68a2b9' }}>
        {memberName}
      </p>
      <p className="font-condensed text-[12px] mb-8" style={{ color: 'rgba(250,249,247,0.4)' }}>
        Completed {dateStr}
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-3 text-center transition-all"
          style={{ backgroundColor: '#0a66c2', color: 'white' }}
        >
          Share on LinkedIn →
        </a>
        {nextCourseSlug && (
          <a
            href={`/academy/${nextCourseSlug}`}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-3 text-center transition-all"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            Continue to Next Pillar →
          </a>
        )}
        <a
          href="/academy"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] transition-colors text-center"
          style={{ color: 'rgba(250,249,247,0.4)' }}
        >
          Back to Academy
        </a>
      </div>
    </div>
  )
}
