'use client'

import Script from 'next/script'

/**
 * Microsoft Clarity (heatmaps + session replay). Loaded only when a project
 * ID is passed in — the parent gates on NEXT_PUBLIC_CLARITY_ID.
 */
export function MicrosoftClarity({ clarityId }: { clarityId: string }) {
  const idLiteral = JSON.stringify(clarityId)

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", ${idLiteral});
      `}
    </Script>
  )
}
