import { logos } from '@evolved-pros/ui'

/**
 * Footer lockup: the shipped horizontal PNG has ~125px of empty canvas on
 * the left, so a raw image sits indented of JOIN FREE / Privacy. The red
 * disc is also taller than the wordmark and, on the white-on-dark file,
 * sits high of the cap-height.
 *
 * We keep those same assets and crop them into three tiles (letters / disc /
 * S) so the E is flush with the footer column and the disc is centered on
 * the wordmark. Theme swap stays CSS so this remains a server component.
 */
export function FooterLogo() {
  return (
    <>
      <Lockup
        src={logos.horizontalDark}
        className="ep-public-footer-logo ep-public-footer-logo--on-dark"
      />
      <Lockup
        src={logos.horizontalNavy}
        className="ep-public-footer-logo ep-public-footer-logo--on-light"
      />
    </>
  )
}

function Lockup({ src, className }: { src: string; className: string }) {
  return (
    <span className={className} aria-hidden>
      <span className="ep-public-footer-lockup">
        <span
          className="ep-public-footer-lockup__tile ep-public-footer-lockup__letters"
          style={{ backgroundImage: `url(${src})` }}
        />
        <span
          className="ep-public-footer-lockup__tile ep-public-footer-lockup__disc"
          style={{ backgroundImage: `url(${src})` }}
        />
        <span
          className="ep-public-footer-lockup__tile ep-public-footer-lockup__ess"
          style={{ backgroundImage: `url(${src})` }}
        />
      </span>
    </span>
  )
}
