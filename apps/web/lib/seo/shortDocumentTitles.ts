/**
 * Hand-written document titles for podcast episodes and media stories
 * whose stored headline does not fit in 60 characters.
 *
 * Each value is a complete title, 60 characters or less, with no trailing
 * period. fitDocumentTitle adds " | Evolved Pros" when that still fits.
 * An entry longer than 60 is ignored. A word-boundary cut is not a
 * substitute: the sitemap title test fails until a slug has a row here.
 */
export const SHORT_DOCUMENT_TITLES: Readonly<Record<string, string>> = {
  'evolved-pros-podcast-ep-010-juan-fernandez':
    'Evolving the MSP Channel with Juan Fernandez',
  'seeing-around-corners-gib-olander':
    'Seeing Around Corners: Product Vision with Gib Olander',
  'trust-credibility-cold-calling-jim-thompson':
    'Why Cold Calling Still Works with Jim Thompson',
  'what-happened-to-claudes-fable-5':
    "Claude's Fable 5: Why Sales Pros Should Care",
  'strategic-planning-q2-sales-targets':
    'Strategy Without a Hierarchy of Commitments Is a Wish List',
  'building-sales-foundation-core-principles':
    'The Advanced Playbook Is Just the Basics, Done Right',
  'the-industry-teaches-you-to-stand-out-nobody-teaches-you-to-stand-for-something':
    'Stand Out vs Stand for Something: Sales Identity',
  'fox-roku-acquisition-what-it-means-for-advertisers':
    'Fox Bought the Living Room: What It Means for Ad Dollars',
  'evolved-pros-origin-story-30-years-sales-leadership':
    'How 30 Years of Sales Leadership Built Evolved Pros',
  'elite-travel-hacks-mobile-command-center':
    'Elite Travel Hacks: Airports and Hotels as Profit Centers',
  'niche-vs-horizontal-sales-strategy-mckinsey-data':
    'The McKinsey Data on Niche vs Horizontal Sales',
  'the-power-of-resilience-building-mental-toughness-in-sales':
    'Mental Toughness Is a Practice, Not a Mindset',
  'execution-excellence-turning-plans-results':
    'Consistency Beats Talent: Reps Who Hit Their Number',
  '40-percent-discovery-advantage-top-performers':
    'The 40% Discovery Advantage of Top Performers',
  'sacred-hour-morning-rituals-sales-professionals':
    'The Sacred Hour: A Morning Ritual for Sales Performance',
  'kettlebells-five-exercises':
    'Five Kettlebell Exercises for Desk and Travel Sales Pros',
  'adopting-new-habit-stick':
    'Adopting a New Habit: What Improves Your Odds',
  'tecovas-boots-denver':
    'Tecovas Boots in Denver: A Lesson on Identity',
  'better-outbound-digital-solutions':
    'Get Better at Outbound: The Digital Stack That Works',
  'cognitive-bias-best-sales-tool-worst-enemy':
    'Cognitive Bias: Your Best Sales Tool and Worst Enemy',
  'desk-jockey-to-deadlift-dynamo-5-back-exercises-sales-pros':
    'Desk Jockey to Deadlift: 5 Back Exercises for Sales Pros',
  'fitness-nutrition-evolved-pros-carson-teagarden':
    'Fitness and Nutrition for Evolved Pros with Carson Teagarden',
  'betting-on-yourself-resilience-heather-monahan':
    'Betting on Yourself with Heather Monahan',
  'reinvention-partnerships-long-game-martin-scholz':
    'Reinvention and the Long Game with Martin Scholz',
  '72-hour-water-fast-five-benefits':
    'The 72-Hour Water Fast: Five Benefits and the Fine Print',
  'what-looks-like-chaos-is-usually-a-priority-shift':
    'What Looks Like Chaos Is Usually a Priority Shift',
  'ai-tokens-materials-line':
    'Put AI Tokens on the Materials Line Before the MSA',
}
