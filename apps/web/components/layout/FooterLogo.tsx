/**
 * Approved footer wordmark. The file is the trimmed horizontal lockup
 * (transparent padding already removed). Render it as-is. Do not crop,
 * redraw, or swap in the padded nav asset at /logo_horizontal_dark.png.
 */
export const FOOTER_LOGO_SRC = '/brand/footer/logo_horizontal_dark.png'

/** Pixel size of public/brand/footer/logo_horizontal_dark.png. */
export const FOOTER_LOGO_WIDTH = 1085
export const FOOTER_LOGO_HEIGHT = 242

export function FooterLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FOOTER_LOGO_SRC}
      alt=""
      width={FOOTER_LOGO_WIDTH}
      height={FOOTER_LOGO_HEIGHT}
      className="ep-public-footer-logo"
    />
  )
}
