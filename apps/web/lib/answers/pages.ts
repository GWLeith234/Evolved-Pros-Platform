/**
 * Public answer pages at the site root: /sales-coaching, /sales-quota,
 * /sales-burnout.
 *
 * Copy is the approved body only. Draft labels, keyword-target notes, and
 * the DataForSEO volume line are not published. Same-host links are relative.
 * Reddit and DOI links stay absolute.
 */

import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'

export const ANSWER_CTA_LABEL = 'Become a member today'
export const ANSWER_CTA_HREF = '/pricing'

const REDDIT = {
  coachOrPipeline:
    'https://www.reddit.com/r/sales/comments/1vqnjcm/anyones_manager_actually_coach_you_or_is_it_just/',
  accountable:
    'https://www.reddit.com/r/sales/comments/eh7mvc/how_to_deal_with_being_held_accountable_for_a/',
  quotaUnrealistic:
    'https://www.reddit.com/r/sales/comments/13oqtn9/what_do_you_do_when_you_know_that_quota_is/',
  missedQuota: 'https://www.reddit.com/r/sales/comments/1qvnofg/missed_quota/',
  burningOut:
    'https://www.reddit.com/r/sales/comments/1gac2ux/finally_burning_out_after_7_years_in_sales/',
  newNormal: 'https://www.reddit.com/r/sales/comments/1kwlnw9/is_this_the_new_normal/',
  boilerRoom:
    'https://www.reddit.com/r/sales/comments/1mtwr1v/feeling_extreme_burnout_from_my_boiler_room_sales/',
  bdrRole:
    'https://www.reddit.com/r/sales/comments/uo6r1r/6_months_at_bdr_role_cant_take_it_anymore/',
  highOrLow:
    'https://www.reddit.com/r/sales/comments/1ngsc27/ive_heard_that_sales_careers_are_either_high/',
  rebound:
    'https://www.reddit.com/r/sales/comments/1lldyk6/how_to_rebound_after_missing_your_target/',
} as const

const DOI_COACHING_SKILL = 'https://doi.org/10.1111/peps.12123'
const CALL_REVIEW = '/media/execution/call-review-coaching-loop-20-minutes'
const DISCOVERY = '/media/strategy/40-percent-discovery-advantage-top-performers'

export type AnswerRun =
  | { type: 'text'; text: string }
  | { type: 'em'; text: string }
  | { type: 'link'; kind: 'internal' | 'external'; href: string; text: string }

export type AnswerBlock =
  | { type: 'p'; runs: AnswerRun[] }
  | { type: 'ol'; items: string[] }

export type AnswerSection = {
  heading: string
  blocks: AnswerBlock[]
}

export type AnswerFaq = {
  question: string
  /** Visible answer text. FAQPage acceptedAnswer uses this string. */
  answer: string
  runs?: AnswerRun[]
}

export type AnswerPageCopy = {
  path: '/sales-coaching' | '/sales-quota' | '/sales-burnout'
  title: string
  description: string
  h1: string
  directAnswer: string
  sections: AnswerSection[]
  faqs: AnswerFaq[]
  /** Trailing note after the FAQ list. Not a FAQ question. */
  afterFaq?: AnswerRun[]
}

const t = (text: string): AnswerRun => ({ type: 'text', text })
const em = (text: string): AnswerRun => ({ type: 'em', text })
const ext = (href: string, text: string): AnswerRun => ({
  type: 'link',
  kind: 'external',
  href,
  text,
})
const int = (href: string, text: string): AnswerRun => ({
  type: 'link',
  kind: 'internal',
  href,
  text,
})

function faq(question: string, runs: AnswerRun[]): AnswerFaq {
  return { question, answer: runs.map(run => run.text).join(''), runs }
}

function faqText(question: string, answer: string): AnswerFaq {
  return { question, answer }
}

function p(...runs: AnswerRun[]): AnswerBlock {
  return { type: 'p', runs }
}

export const SALES_COACHING: AnswerPageCopy = {
  path: '/sales-coaching',
  title: 'Sales Coaching That Actually Changes Your Number | Evolved Pros',
  // The supplied line is 162 characters and would be cut mid-sentence at 155.
  // Same claims, finished sentence, inside the public meta limit.
  description:
    "Most reps get pipeline reviews, not coaching. See what sales coaching looks like, how to tell if it's working, and where to get it if your manager can't.",
  h1: 'Sales Coaching That Actually Changes Your Number',
  directAnswer:
    "Sales coaching is regular, specific feedback on how you actually sell (your calls, your discovery, your deal strategy) followed by one or two changes you practice and get reviewed again. If a session is only a forecast check, it's a pipeline review, not coaching.",
  sections: [
    {
      heading: '"Does anyone\'s manager actually coach, or is it just pipeline reviews?"',
      blocks: [
        p(
          t('That exact question is a live r/sales thread ('),
          ext(REDDIT.coachOrPipeline, '1vqnjcm'),
          t('). A pipeline review asks '),
          em('what'),
          t(" is closing. Coaching asks "),
          em('how'),
          t(" you're running the deal and what you'll do differently on the next call. Peer-reviewed research on 1,246 pharma reps found managers' coaching "),
          em('skill'),
          t(' tied to goal attainment, and frequent coaching from low-skill managers actually hurt ('),
          ext(DOI_COACHING_SKILL, 'Personnel Psychology, doi:10.1111/peps.12123'),
          t(').'),
        ),
      ],
    },
    {
      heading: 'What does a good coaching session look like?',
      blocks: [
        {
          type: 'ol',
          items: [
            'Listen to one recorded call together.',
            'Pick one behavior (not five).',
            'Role-play it.',
            'Review the next real call.',
          ],
        },
        p(
          t('See our 20-minute version: '),
          int(CALL_REVIEW, 'The call review coaching loop'),
          t('.'),
        ),
      ],
    },
    {
      heading: 'What should coaching focus on first?',
      blocks: [
        p(
          t('Discovery. Most lost deals trace back to it. Read '),
          int(DISCOVERY, 'the discovery advantage'),
          t('.'),
        ),
      ],
    },
    {
      heading: "My manager doesn't coach. Now what?",
      blocks: [
        p(
          t('A reply in '),
          ext(REDDIT.accountable, 'eh7mvc'),
          t(' nails it: find "someone who is good at it", often a consistent 85th-95th percentile producer, not the superstar. That\'s what a peer community is for: the '),
          int('/about', 'Evolved Pros community'),
          t(', '),
          int('/live', 'live sessions'),
          t(' and the '),
          int('/podcast', 'podcast'),
          t('.'),
        ),
      ],
    },
    {
      heading: 'Is sales coaching worth paying for?',
      blocks: [
        p(
          t('Only if you\'ll do the work. One r/sales manager: "Coaching is just something to help your hard work pay off." Check '),
          int('/fit', "if you're a fit"),
          t(' and see '),
          int('/pricing', 'pricing'),
          t('.'),
        ),
      ],
    },
  ],
  faqs: [
    faqText(
      'What is the difference between sales training and sales coaching?',
      'Training teaches a skill to a group once; coaching applies it to your real deals, repeatedly.',
    ),
    faqText(
      'How often should sales coaching happen?',
      'Consistently enough to review the change you agreed on. Skill matters more than frequency (study above).',
    ),
    faqText(
      'Can I get sales coaching without a manager?',
      'Yes: peer call reviews, a mentor, or a coaching community.',
    ),
    faqText(
      'What should I bring to a coaching session?',
      'One recorded call and one stuck deal.',
    ),
  ],
}

export const SALES_QUOTA: AnswerPageCopy = {
  path: '/sales-quota',
  title: "Sales Quota: What It Is, How It's Set, and What to Do When It's Unrealistic | Evolved Pros",
  // The supplied line is 156 characters and would drop the last word. Same claims.
  description:
    "A sales quota is the revenue or activity target you're paid against. Here's how to check if yours is realistic, how to push back and recover a miss.",
  h1: "Sales Quota: What It Is, How It's Set, and What to Do When It's Unrealistic",
  directAnswer:
    'A sales quota is the target (usually revenue, sometimes units or activity) a rep is measured and paid against for a period. A fair quota is built from territory capacity: workable accounts, deal size, win rate and cycle length. If your number ignores those, you need a data conversation, not a pep talk.',
  sections: [
    {
      heading: 'How do I know if my quota is unrealistic?',
      blocks: [
        p(
          t('Compare it to what the territory has done. One r/sales rep: "Average of territory, last 10 years on average: 1.1m. My quota: 3m" ('),
          ext(REDDIT.accountable, 'eh7mvc'),
          t('). Another: "almost 6x the sales of the territory from 2022" ('),
          ext(REDDIT.quotaUnrealistic, '13oqtn9'),
          t('). Do the math: accounts x deal size x win rate, across the selling months you really have.'),
        ),
      ],
    },
    {
      heading: 'How do I push back on a quota without getting labeled a complainer?',
      blocks: [
        p(
          t("Best reply in the thread: \"Don't say you can't do it. Say 'this is what I need to do it'.\" Bring the capacity math and a list of what would close the gap (leads, accounts, ramp)."),
        ),
      ],
    },
    {
      heading: 'I missed quota. Am I done?',
      blocks: [
        p(
          t('Depends on pipeline. "If you missed by a lot, there\'s no pipeline, and you haven\'t done much for a while, you\'re cooked" ('),
          ext(REDDIT.missedQuota, '1qvnofg'),
          t('). If you have pipeline, set weekly activity goals you control and review them with someone. Start with '),
          int(CALL_REVIEW, 'the 20-minute call review loop'),
          t('.'),
        ),
      ],
    },
    {
      heading: 'What if only a few reps hit quota?',
      blocks: [
        p(
          t('That\'s a company signal. One rep reported "Only about 20-25% of reps hit quota" with "pips galore" ('),
          ext(REDDIT.burningOut, '1gac2ux'),
          t('). Ask what percent of the team hit last year in every interview.'),
        ),
      ],
    },
    {
      heading: 'How do top performers hit quota consistently?',
      blocks: [
        p(
          t('They win earlier in the deal. See '),
          int(DISCOVERY, 'the discovery advantage'),
          t(', and talk it through with peers at '),
          int('/live', 'Evolved Pros Live'),
          t('.'),
        ),
      ],
    },
  ],
  faqs: [
    faqText('What is a sales quota?', "The target you're measured and paid against for a period."),
    faqText('Revenue vs activity quota?', 'Revenue = dollars closed; activity = calls, meetings, demos.'),
    faqText('What is quota attainment?', 'Closed results divided by quota.'),
    faqText('Can quotas change mid-year?', 'Some companies do; get any relief or change in writing.'),
    faq('Where can I get help hitting quota?', [
      t('A coach or peer group: '),
      int('/about', 'about Evolved Pros'),
      t(', '),
      int('/fit', 'fit check'),
      t('.'),
    ]),
  ],
}

export const SALES_BURNOUT: AnswerPageCopy = {
  path: '/sales-burnout',
  title: 'Sales Burnout: Signs, Causes, and How to Recover Without Quitting Sales | Evolved Pros',
  // The supplied line is 156 characters and would drop the last word. Same claims.
  description:
    "Burned out in sales? Most of it comes from quota pressure, churn-and-burn culture and nonstop prospecting. See how to tell which one and what to do next.",
  h1: 'Sales Burnout: Signs, Causes, and How to Recover Without Quitting Sales',
  directAnswer:
    'Sales burnout is exhaustion from sustained pressure with no recovery: usually unrealistic quotas, a "what have you done for me lately" culture, or prospecting volume you can\'t sustain. Name which one is hurting you, because the fix is different for each: change the plan, change the company, or change the role.',
  sections: [
    {
      heading: 'Is it me, or is it the company?',
      blocks: [
        p(
          t('Check how many reps hit. "Only about 20-25% of reps hit quota... churn and burn culture" ('),
          ext(REDDIT.burningOut, '1gac2ux'),
          t("). If most of the team misses, it's not just you. See "),
          int('/sales-quota', 'our quota guide'),
          t('.'),
        ),
      ],
    },
    {
      heading: 'Even top performers burn out?',
      blocks: [
        p(
          t('Yes. A former President\'s Club rep: "The self-doubt is real, and I just want to feel successful again" ('),
          ext(REDDIT.newNormal, '1kwlnw9'),
          t(').'),
        ),
      ],
    },
    {
      heading: 'I dread the phone. How do I keep prospecting?',
      blocks: [
        p(
          t('"I have to do 200 cold calls everyday... my insomnia returned" ('),
          ext(REDDIT.boilerRoom, '1mtwr1v'),
          t('). The top reply: disqualify early and automate the busywork. Better discovery means fewer wasted calls: '),
          int(DISCOVERY, 'the discovery advantage'),
          t('.'),
        ),
      ],
    },
    {
      heading: 'Should I leave sales?',
      blocks: [
        p(
          t('Some burned-out reps move to inbound, account management or customer success ('),
          ext(REDDIT.bdrRole, 'uo6r1r'),
          t(', '),
          ext(REDDIT.highOrLow, '1ngsc27'),
          t("). Before you quit, talk to people who've been there: "),
          int('/podcast', 'the Evolved Pros podcast'),
          t(' and '),
          int('/about', 'community'),
          t('.'),
        ),
      ],
    },
  ],
  faqs: [
    faqText(
      'What are signs of sales burnout?',
      'Dreading work, sleep problems, self-doubt after good runs, losing interest in deals.',
    ),
    faq('Is it OK to take time off?', [
      t('Yes. r/sales: "Don\'t feel guilty for taking a day off or taking a vacation" ('),
      ext(REDDIT.rebound, '1lldyk6'),
      t(').'),
    ]),
    faq('Can coaching help burnout?', [
      t("It helps when the cause is skill or plan; not when it's the culture. See "),
      int('/sales-coaching', 'sales coaching'),
      t('.'),
    ]),
  ],
  afterFaq: [
    t("Not medical advice. If it's affecting your health, see a professional."),
  ],
}

export const ANSWER_PAGES = [SALES_COACHING, SALES_QUOTA, SALES_BURNOUT] as const

export function answerArticleJsonLd(page: AnswerPageCopy) {
  const url = canonicalUrl(page.path)
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'Article' as const,
    headline: page.h1,
    description: page.description,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage' as const,
      '@id': url,
    },
    author: {
      '@type': 'Organization' as const,
      name: SITE_NAME,
      url: CANONICAL_ORIGIN,
    },
    publisher: {
      '@type': 'Organization' as const,
      name: SITE_NAME,
      url: CANONICAL_ORIGIN,
    },
  }
}

export function answerFaqJsonLd(page: AnswerPageCopy) {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'FAQPage' as const,
    url: canonicalUrl(page.path),
    mainEntity: page.faqs.map(item => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    })),
  }
}

export function answerPageSchemas(page: AnswerPageCopy) {
  return [answerArticleJsonLd(page), answerFaqJsonLd(page)] as const
}
