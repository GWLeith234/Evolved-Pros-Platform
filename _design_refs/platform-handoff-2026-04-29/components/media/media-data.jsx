/* global React */
// MEDIA — editorial content data
// Categories: Revenue · AI · Leadership · Foundation · Identity · Mental Toughness ·
//             Strategy · Accountability · Execution

// Color tokens for category chips (sourced from design system pillars)
const CATEGORY_COLORS = {
  'Revenue':          '#C9302A',
  'AI':               '#1B2A4A',
  'Leadership':       '#8B6A00',
  'Foundation':       '#FFA538',
  'Identity':         '#A78BFA',
  'Mental Toughness': '#F87171',
  'Strategy':         '#3D6BB8',
  'Accountability':   '#C9A84C',
  'Execution':        '#0A9980',
};

// ── LEAD STORY ────────────────────────────────────────────────
const LEAD_STORY = {
  id: 'lead-1',
  category: 'Revenue',
  title: "The compensation plan is dead. Long live the compensation system.",
  dek: "After interviewing 47 sales leaders across SaaS, services, and manufacturing, one pattern keeps surfacing: the spreadsheet that ran your comp for a decade is now the single biggest drag on your revenue org.",
  byline: "George Leith",
  date: "Apr 25, 2026",
  readTime: 12,
  image: 'placeholder',
  imageLabel: 'Lead photo · sales leadership',
  imageTone: 'navy',
};

// ── FEATURED (4 cards next to lead) ───────────────────────────
const FEATURED = [
  {
    id: 'feat-1',
    category: 'AI',
    title: "What \u2018AI-native sales\u2019 actually looks like in a 200-person org",
    byline: "Evolved Editorial",
    date: "Apr 24, 2026",
    readTime: 8,
    imageTone: 'gold',
    imageLabel: 'AI workflow illustration',
  },
  {
    id: 'feat-2',
    category: 'Leadership',
    title: "Why your top rep is about to quit \u2014 and what the exit interview won't say",
    byline: "George Leith",
    date: "Apr 24, 2026",
    readTime: 6,
    imageTone: 'crimson',
    imageLabel: 'Leadership essay',
    isCurated: false,
  },
  {
    id: 'feat-3',
    category: 'Mental Toughness',
    title: "The 4 a.m. rule: how elite operators rebuild after a brutal quarter",
    byline: "Maya Okafor",
    date: "Apr 23, 2026",
    readTime: 9,
    imageTone: 'forge',
    imageLabel: 'Resilience feature',
  },
  {
    id: 'feat-4',
    category: 'Execution',
    title: "Cadence math: the weekly rhythm that compounds into 3x pipeline",
    byline: "Evolved Editorial",
    date: "Apr 22, 2026",
    readTime: 7,
    imageTone: 'teal',
    imageLabel: 'Execution playbook',
  },
];

// ── LATEST GRID (main column) ─────────────────────────────────
const LATEST = [
  {
    id: 'l-1',
    category: 'Revenue',
    title: "Discovery is dead. What sellers are doing instead.",
    byline: "George Leith",
    date: "6h ago",
    readTime: 5,
    imageTone: 'crimson',
    imageLabel: 'Discovery feature',
  },
  {
    id: 'l-2',
    category: 'AI',
    title: "I shadowed 12 reps using Claude for outbound. The good ones broke a rule.",
    byline: "Maya Okafor",
    date: "8h ago",
    readTime: 11,
    imageTone: 'navy',
    imageLabel: 'AI in outbound',
  },
  {
    id: 'l-3',
    category: 'Foundation',
    title: "Before the strategy: the 30-minute audit George runs on every new client",
    byline: "Evolved Editorial",
    date: "Apr 24, 2026",
    readTime: 4,
    imageTone: 'amber',
    imageLabel: 'Foundation playbook',
  },
  {
    id: 'l-4',
    category: 'Identity',
    title: "The story you tell yourself between 5 and 7 p.m. is your real career strategy",
    byline: "Dr. Lena Pham",
    date: "Apr 24, 2026",
    readTime: 8,
    imageTone: 'violet',
    imageLabel: 'Identity essay',
  },
  {
    id: 'l-5',
    category: 'Strategy',
    title: "Why \u2018land and expand\u2019 broke this year (and the model replacing it)",
    byline: "George Leith",
    date: "Apr 23, 2026",
    readTime: 9,
    imageTone: 'blue',
    imageLabel: 'Strategy analysis',
  },
  {
    id: 'l-6',
    category: 'Accountability',
    title: "The accountability ladder: a 5-rung framework George's clients use weekly",
    byline: "Evolved Editorial",
    date: "Apr 23, 2026",
    readTime: 6,
    imageTone: 'gold',
    imageLabel: 'Accountability framework',
  },
  {
    id: 'l-7',
    category: 'AI',
    title: "Klarna's AI rollback wasn't a failure \u2014 it was a leadership test",
    byline: "Maya Okafor",
    date: "Apr 22, 2026",
    readTime: 7,
    imageTone: 'navy',
    imageLabel: 'AI strategy commentary',
  },
  {
    id: 'l-8',
    category: 'Leadership',
    title: "The middle manager renaissance: why 2026 is rewarding the people you almost cut",
    byline: "George Leith",
    date: "Apr 22, 2026",
    readTime: 10,
    imageTone: 'gold',
    imageLabel: 'Leadership essay',
  },
];

// ── TRENDING (sidebar) ─────────────────────────────────────────
const TRENDING = [
  { rank: 1, category: 'AI',          title: "What \u2018AI-native sales\u2019 actually looks like in a 200-person org", views: '14.2k' },
  { rank: 2, category: 'Revenue',     title: "The compensation plan is dead. Long live the compensation system.", views: '11.8k' },
  { rank: 3, category: 'Leadership',  title: "Why your top rep is about to quit \u2014 and what the exit interview won't say", views: '9.4k' },
  { rank: 4, category: 'Execution',   title: "Cadence math: the weekly rhythm that compounds into 3x pipeline", views: '8.1k' },
  { rank: 5, category: 'AI',          title: "I shadowed 12 reps using Claude for outbound. The good ones broke a rule.", views: '7.6k' },
];

// ── GEORGE'S DESK (curated reads with commentary) ─────────────
const CURATED = [
  {
    id: 'c-1',
    source: 'Harvard Business Review',
    sourceUrl: 'hbr.org',
    title: "The 5 Things All Great Salespeople Do",
    take: "The framing here on \u2018buyer outcome\u2019 vs. \u2018seller activity\u2019 is exactly the lens I've been pushing in workshops this quarter. Skip the intro \u2014 chapter 3 onward.",
    category: 'Revenue',
    readTime: 9,
  },
  {
    id: 'c-2',
    source: 'a16z',
    sourceUrl: 'a16z.com',
    title: "The agentic enterprise: org design for the post-LLM era",
    take: "Disagree with their take on flattening, agree on the P&L rewrite. The 47 leaders I just interviewed land somewhere in between \u2014 keep an eye on the org chart they sketch on page 11.",
    category: 'AI',
    readTime: 14,
  },
  {
    id: 'c-3',
    source: 'McKinsey Quarterly',
    sourceUrl: 'mckinsey.com',
    title: "What separates B2B revenue leaders from the rest in 2026",
    take: "The data here matches what we're seeing inside Evolved Pros member orgs almost line for line. Print the chart on page 4 and put it on your wall.",
    category: 'Leadership',
    readTime: 11,
  },
  {
    id: 'c-4',
    source: 'First Round Review',
    sourceUrl: 'firstround.com',
    title: "How to design a sales comp plan that actually drives the right behavior",
    take: "Pair this with my piece above. Their model is more elegant than mine; mine is more battle-tested. Steal from both.",
    category: 'Revenue',
    readTime: 13,
  },
];

// ── DOSSIERS (deep-dive collections) ──────────────────────────
const DOSSIERS = [
  {
    id: 'd-1',
    title: 'AI in B2B Sales',
    pieces: 14,
    cover: 'navy',
    blurb: "Twelve months of George's reporting on what AI is actually doing inside revenue orgs \u2014 and what's just theatre.",
  },
  {
    id: 'd-2',
    title: 'The 6 Pillars Series',
    pieces: 24,
    cover: 'gold',
    blurb: "Every essay, framework, and case study published under the EVOLVED Architecture\u2122 \u2014 organized by pillar.",
  },
  {
    id: 'd-3',
    title: 'Founder-led Sales',
    pieces: 9,
    cover: 'crimson',
    blurb: "What founders actually do differently when they're still running deals \u2014 and how to keep it after they hand it off.",
  },
];

// ── BOOK EXCERPT ──────────────────────────────────────────────
const BOOK_EXCERPT = {
  title: "Evolved: A Field Guide for the Modern Operator",
  chapter: "Chapter 7 \u2014 Strategy is a verb",
  excerpt: "Most strategy decks die the moment the room clears. The slides are immaculate, the logic is sound, the room nodded. And then nothing happens \u2014 because nobody in that room woke up the next morning with a calendar that reflects what was just decided. Strategy isn't what you wrote. Strategy is what your Tuesday looks like.",
  pageCount: 287,
};

// ── VIDEO CLIPS ───────────────────────────────────────────────
const VIDEO_CLIPS = [
  { id: 'v-1', title: 'On rebuilding pipeline after a missed quarter', duration: '4:12', source: 'Live · Sydney 2026' },
  { id: 'v-2', title: 'The discovery question I steal from therapists',  duration: '2:48', source: 'Podcast · Ep. 142' },
  { id: 'v-3', title: 'Why your CRM hates you (and what to do about it)', duration: '6:01', source: 'Live · NYC 2025' },
];

// ── NAVIGATION CATEGORIES ─────────────────────────────────────
const MEDIA_NAV = [
  { label: 'Top Stories', href: '#top', primary: true },
  { label: 'Revenue',     href: '#revenue' },
  { label: 'AI',          href: '#ai' },
  { label: 'Leadership',  href: '#leadership' },
  { label: 'Pillars',     href: '#pillars' },
  { label: 'George\u2019s Desk', href: '#desk' },
];

window.MEDIA_DATA = {
  CATEGORY_COLORS,
  LEAD_STORY,
  FEATURED,
  LATEST,
  TRENDING,
  CURATED,
  DOSSIERS,
  BOOK_EXCERPT,
  VIDEO_CLIPS,
  MEDIA_NAV,
};
