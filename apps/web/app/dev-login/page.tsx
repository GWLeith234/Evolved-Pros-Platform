import { notFound } from 'next/navigation'
import { DevLoginClient } from './DevLoginClient'

// No loading.tsx in this segment. A suspense shell prerenders as HTTP 200
// and the notFound() status never reaches the response.
export default function DevLoginPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <DevLoginClient />
}
