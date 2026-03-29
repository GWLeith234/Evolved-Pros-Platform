import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1c27',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#ef0e30',
            marginBottom: 16,
          }}
        >
          404 — Page Not Found
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 32,
            fontWeight: 700,
            color: '#faf9f7',
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          This page doesn&apos;t exist.
        </h1>
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 36,
            lineHeight: 1.6,
          }}
        >
          The link may be broken or the page may have moved.
        </p>
        <Link
          href="/home"
          style={{
            display: 'inline-block',
            background: '#ef0e30',
            color: '#fff',
            padding: '12px 28px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            borderRadius: 4,
            textDecoration: 'none',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
