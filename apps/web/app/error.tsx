'use client'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#0d1c27',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <p style={{
          fontFamily:    '"Barlow Condensed", sans-serif',
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.3)',
          marginBottom:  16,
        }}>
          Something went wrong
        </p>
        <h2 style={{
          fontFamily:   'Georgia, serif',
          fontSize:     24,
          fontWeight:   700,
          color:        '#faf9f7',
          marginBottom: 8,
        }}>
          Unexpected error.
        </h2>
        <p style={{
          fontFamily:   'system-ui, sans-serif',
          fontSize:     13,
          color:        'rgba(255,255,255,0.4)',
          marginBottom: 32,
          lineHeight:   1.6,
        }}>
          {error.digest ? `Error ID: ${error.digest}` : 'Please try again or contact support if the issue persists.'}
        </p>
        <button
          onClick={reset}
          style={{
            background:    '#ef0e30',
            color:         '#fff',
            border:        'none',
            padding:       '12px 28px',
            cursor:        'pointer',
            fontFamily:    '"Barlow Condensed", sans-serif',
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            borderRadius:  4,
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
