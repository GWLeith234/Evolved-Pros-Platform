import { ThemeBridge } from '@/components/media/ThemeBridge'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeBridge />
      {children}
    </>
  )
}
