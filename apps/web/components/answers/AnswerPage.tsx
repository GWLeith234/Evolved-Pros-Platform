import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'
import {
  ANSWER_CTA_HREF,
  ANSWER_CTA_LABEL,
  type AnswerPageCopy,
  type AnswerRun,
} from '@/lib/answers/pages'

function AnswerRuns({ runs }: { runs: readonly AnswerRun[] }) {
  return runs.map((run, index) => {
    if (run.type === 'text') return <span key={index}>{run.text}</span>
    if (run.type === 'em') return <em key={index}>{run.text}</em>
    if (run.kind === 'external') {
      return (
        <a
          key={index}
          href={run.href}
          className="ep-answer-link"
          rel="nofollow noopener"
          target="_blank"
        >
          {run.text}
        </a>
      )
    }
    return (
      <Link key={index} href={run.href} className="ep-answer-link">
        {run.text}
      </Link>
    )
  })
}

/**
 * Ivory answer page. Logo in the header, one red membership button.
 * Footer comes from the public layout.
 */
export function AnswerPage({ page }: { page: AnswerPageCopy }) {
  return (
    <div className="ep-answer" data-answer-page={page.path}>
      <header className="ep-answer-header">
        <div className="ep-answer-wrap ep-answer-header-inner">
          <Link href="/" aria-label="Evolved Pros home" className="ep-answer-logo">
            <LogoMark variant="dark" height={28} alt="" />
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <article className="ep-answer-wrap ep-answer-body">
          <h1 className="ep-answer-h1">{page.h1}</h1>
          <p className="ep-answer-direct">
            <strong>Direct answer: </strong>
            {page.directAnswer}
          </p>
          {page.sections.map(section => (
            <section key={section.heading} className="ep-answer-section">
              <h2 className="ep-answer-h2">{section.heading}</h2>
              {section.blocks.map((block, index) => {
                if (block.type === 'ol') {
                  return (
                    <ol key={index} className="ep-answer-steps">
                      {block.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  )
                }
                return (
                  <p key={index} className="ep-answer-copy">
                    <AnswerRuns runs={block.runs} />
                  </p>
                )
              })}
            </section>
          ))}
          <section className="ep-answer-section" aria-labelledby={`${page.path.slice(1)}-faq`}>
            <h2 id={`${page.path.slice(1)}-faq`} className="ep-answer-h2">
              FAQ
            </h2>
            {page.faqs.map(item => (
              <div key={item.question} className="ep-answer-faq">
                <h3 className="ep-answer-h3">{item.question}</h3>
                <p className="ep-answer-copy">
                  {item.runs ? <AnswerRuns runs={item.runs} /> : item.answer}
                </p>
              </div>
            ))}
            {page.afterFaq ? (
              <p className="ep-answer-note">
                <AnswerRuns runs={page.afterFaq} />
              </p>
            ) : null}
          </section>
          <p className="ep-answer-cta-row">
            <Link href={ANSWER_CTA_HREF} className="ep-answer-cta">
              {ANSWER_CTA_LABEL}
            </Link>
          </p>
        </article>
      </main>
    </div>
  )
}
