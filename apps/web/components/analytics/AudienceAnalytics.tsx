import { Suspense } from 'react'
import { getClarityId, getGaMeasurementId } from '@/lib/analytics/public-ids'
import { GoogleAnalytics } from './GoogleAnalytics'
import { MicrosoftClarity } from './MicrosoftClarity'

/**
 * Optional audience tags for the membership app. Renders nothing when the
 * corresponding env vars are unset so production can deploy without secrets.
 */
export function AudienceAnalytics() {
  const gaId = getGaMeasurementId()
  const clarityId = getClarityId()

  if (!gaId && !clarityId) return null

  return (
    <>
      {gaId ? (
        <Suspense fallback={null}>
          <GoogleAnalytics measurementId={gaId} />
        </Suspense>
      ) : null}
      {clarityId ? <MicrosoftClarity clarityId={clarityId} /> : null}
    </>
  )
}
