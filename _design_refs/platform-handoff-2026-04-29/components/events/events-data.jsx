/* global React */
// ──────────────────────────────────────────────────────────────────────
// Events mock data — 20 events across live / replay / in-person
// Plus podcast releases as a dedicated shelf type
// ──────────────────────────────────────────────────────────────────────

// Helper: date N hours from now
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000);
const inDays = (d, h = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, 0, 0, 0);
  return dt;
};

// Cover image palette — gradient recipes, used as fallback when no photo
const COVER = {
  crimson:   'linear-gradient(135deg, #ef0e30 0%, #8B1220 50%, #1A2332 100%)',
  gold:      'linear-gradient(135deg, #E8B547 0%, #8B6A00 50%, #1A2332 100%)',
  teal:      'linear-gradient(135deg, #19C9A6 0%, #0A6A5A 50%, #0A0F18 100%)',
  violet:    'linear-gradient(135deg, #A86CFF 0%, #4A2A8C 50%, #0A0F18 100%)',
  blue:      'linear-gradient(135deg, #3FB8E8 0%, #1B4A7A 50%, #0A0F18 100%)',
  amber:     'linear-gradient(135deg, #FFA538 0%, #8B4A00 50%, #0A0F18 100%)',
  midnight:  'linear-gradient(135deg, #2A3B5E 0%, #0D1B2A 60%, #000 100%)',
};

// Real photography from Unsplash (cohort / conference / studio-feeling)
const PHOTO = {
  keynote:     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=70',
  studio:      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600&auto=format&fit=crop&q=70',
  retreat:     'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&auto=format&fit=crop&q=70',
  podcast:     'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&auto=format&fit=crop&q=70',
  workshop:    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1600&auto=format&fit=crop&q=70',
  masterclass: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&auto=format&fit=crop&q=70',
  mountain:    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=70',
  cabin:       'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1600&auto=format&fit=crop&q=70',
  city:        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&auto=format&fit=crop&q=70',
  arena:       'https://images.unsplash.com/photo-1501612780327-45045538702b?w=1600&auto=format&fit=crop&q=70',
};

const EVENTS = [
  // ═══════════ HERO (live, happening soon) ═══════════
  {
    id: 'ev-hero',
    title: 'The Q2 Strategy Sprint — Live with George',
    subtitle: 'A 90-minute tactical intensive on rebuilding your pipeline for the second half.',
    format: 'live',
    pillar: 'strategy',
    pillarColor: '#3FB8E8',
    host: { name: 'George Leith', role: 'Founder · EvolveX360', avatar: 'https://i.pravatar.cc/120?img=15' },
    cohosts: [
      { name: 'Renée Dubois', avatar: 'https://i.pravatar.cc/80?img=47' },
    ],
    starts: inHours(5.3),
    duration: 90,
    price: 'Included',
    capacity: 500,
    attending: 342,
    myEvents: true,
    cover: PHOTO.keynote,
    accent: '#ef0e30',
    description: 'Walk out with a rebuilt Q2 plan, a revised pipeline scorecard, and three fresh plays ready to run Monday morning.',
    hero: true,
    circleGoing: ['MC','AO','JR','TH','RD'],
  },

  // ═══════════ LIVE / HAPPENING SOON ═══════════
  {
    id: 'ev-01', title: 'Identity Reset — Live Group Coaching',
    format: 'live', pillar: 'identity', pillarColor: '#A86CFF',
    host: { name: 'Tariq Hill', role: 'Performance Coach', avatar: 'https://i.pravatar.cc/80?img=33' },
    starts: inHours(22), duration: 75,
    price: 'Included', attending: 88, capacity: 150,
    myEvents: true, cover: PHOTO.studio, accent: '#A86CFF',
    description: 'The 6-question protocol for realigning identity with ambition when the two drift apart.',
    circleGoing: ['MC','AO'],
  },
  {
    id: 'ev-02', title: 'Mental Toughness Masterclass',
    format: 'live', pillar: 'mental-toughness', pillarColor: '#ef0e30',
    host: { name: 'Anna Voss', role: 'Author · The Forge', avatar: 'https://i.pravatar.cc/80?img=23' },
    starts: inDays(1, 14), duration: 60,
    price: '$49', attending: 214, capacity: 300,
    myEvents: false, cover: PHOTO.masterclass, accent: '#ef0e30',
    description: 'How elite operators train the inner voice that shows up under pressure.',
    circleGoing: ['JR'],
  },
  {
    id: 'ev-03', title: 'Execution Hour — Office Hours with George',
    format: 'live', pillar: 'execution', pillarColor: '#19C9A6',
    host: { name: 'George Leith', role: 'Founder', avatar: 'https://i.pravatar.cc/80?img=15' },
    starts: inDays(2, 11), duration: 60,
    price: 'Included', attending: 47, capacity: 100,
    myEvents: false, cover: PHOTO.workshop, accent: '#19C9A6',
    description: 'Bring one blocked initiative. Leave with a 14-day execution path.',
    circleGoing: ['AO','TH','RD','MC'],
  },
  {
    id: 'ev-04', title: 'Accountability Circle — April Cohort',
    format: 'live', pillar: 'accountability', pillarColor: '#E8B547',
    host: { name: 'Jordan Reeves', role: 'Cohort Lead', avatar: 'https://i.pravatar.cc/80?img=52' },
    starts: inDays(3, 18), duration: 45,
    price: 'Pro only', attending: 18, capacity: 24,
    myEvents: true, cover: PHOTO.studio, accent: '#E8B547',
    description: 'Small-group weekly ritual. 7 commitments in, 7 commitments out.',
    circleGoing: ['MC'],
  },
  {
    id: 'ev-05', title: 'Foundation Fridays — Deep Work Block',
    format: 'live', pillar: 'foundation', pillarColor: '#D4862B',
    host: { name: 'Amara Okafor', role: 'Operator in Residence', avatar: 'https://i.pravatar.cc/80?img=45' },
    starts: inDays(4, 9), duration: 90,
    price: 'Included', attending: 162, capacity: 500,
    myEvents: false, cover: PHOTO.workshop, accent: '#D4862B',
    description: 'Camera-on, mic-off, 90 minutes. Ship the thing you keep deferring.',
    circleGoing: [],
  },

  // ═══════════ RETREATS / IN-PERSON ═══════════
  {
    id: 'ev-06', title: 'The Summit — Banff Leadership Retreat',
    format: 'in-person', pillar: 'identity', pillarColor: '#A86CFF',
    host: { name: 'George Leith', role: 'Founder', avatar: 'https://i.pravatar.cc/80?img=15' },
    starts: inDays(38, 9), duration: 2880, // 2 days
    endsLabel: 'Jun 4 – 6 · Banff, AB',
    location: 'Banff Springs, Alberta',
    price: '$4,200', attending: 32, capacity: 40,
    myEvents: true, cover: PHOTO.mountain, accent: '#A86CFF',
    description: 'Three days off-grid with 40 operators. Identity work, long walks, no phones.',
    circleGoing: ['RD','TH'],
    spotlight: true,
  },
  {
    id: 'ev-07', title: 'NYC Pro Meetup — Intro Mixer',
    format: 'in-person', pillar: 'execution', pillarColor: '#19C9A6',
    host: { name: 'Marcus Chen', role: 'Chapter Lead · NYC', avatar: 'https://i.pravatar.cc/80?img=12' },
    starts: inDays(12, 19),
    duration: 120,
    location: 'The Wing · SoHo',
    price: 'Included', attending: 41, capacity: 60,
    myEvents: false, cover: PHOTO.city, accent: '#19C9A6',
    description: 'Drinks, intros, and a 15-minute fireside. Pro-tier members only.',
    circleGoing: ['JR'],
  },
  {
    id: 'ev-08', title: 'Austin Chapter — Breakfast & Build',
    format: 'in-person', pillar: 'foundation', pillarColor: '#D4862B',
    host: { name: 'Renée Dubois', role: 'Chapter Lead · ATX', avatar: 'https://i.pravatar.cc/80?img=47' },
    starts: inDays(19, 8), duration: 120,
    location: 'Fareground · Downtown',
    price: 'Included', attending: 22, capacity: 35,
    myEvents: false, cover: PHOTO.city, accent: '#D4862B',
    description: 'Build your week in public. Breakfast provided, laptops encouraged.',
    circleGoing: [],
  },
  {
    id: 'ev-09', title: 'The Cabin — Silent Cohort Retreat',
    format: 'in-person', pillar: 'mental-toughness', pillarColor: '#ef0e30',
    host: { name: 'Tariq Hill', role: 'Performance Coach', avatar: 'https://i.pravatar.cc/80?img=33' },
    starts: inDays(62, 9), duration: 4320,
    endsLabel: 'Jul 10 – 13 · Boone, NC',
    location: 'Blue Ridge Mountains',
    price: '$2,800', attending: 14, capacity: 16,
    myEvents: false, cover: PHOTO.cabin, accent: '#ef0e30',
    description: 'Four days of guided silence. Not for the curious — for the committed.',
    circleGoing: ['AO'],
  },

  // ═══════════ PODCAST DROPS ═══════════
  {
    id: 'pod-01', title: 'Ep 143 · Selling Through the Downturn',
    format: 'podcast', pillar: 'strategy', pillarColor: '#3FB8E8',
    host: { name: 'Anna Voss', role: 'Guest · CRO Forge Inc.', avatar: 'https://i.pravatar.cc/80?img=23' },
    starts: inDays(-1), duration: 52,
    episodeNum: 143,
    price: 'Included', attending: 0,
    myEvents: false, cover: PHOTO.podcast, accent: '#3FB8E8',
    description: 'Anna on rebuilding a $40M pipeline when your 3 biggest accounts freeze spend.',
    isNew: true,
  },
  {
    id: 'pod-02', title: 'Ep 142 · The Discipline of Saying No',
    format: 'podcast', pillar: 'accountability', pillarColor: '#E8B547',
    host: { name: 'Tariq Hill', role: 'Guest · Author', avatar: 'https://i.pravatar.cc/80?img=33' },
    starts: inDays(-8), duration: 38,
    episodeNum: 142,
    price: 'Included', attending: 0,
    myEvents: false, cover: PHOTO.podcast, accent: '#E8B547',
    description: 'Saying no as a craft, not a mood. 12 scripts for the hardest conversations.',
    isNew: false,
  },
  {
    id: 'pod-03', title: 'Ep 141 · Why Your Pipeline Is Lying',
    format: 'podcast', pillar: 'strategy', pillarColor: '#3FB8E8',
    host: { name: 'Renée Dubois', role: 'Guest · VP Sales', avatar: 'https://i.pravatar.cc/80?img=47' },
    starts: inDays(-15), duration: 47,
    episodeNum: 141,
    price: 'Included', attending: 0,
    myEvents: false, cover: PHOTO.podcast, accent: '#3FB8E8',
    description: 'Renée exposes the 5 metrics that quietly inflate every sales forecast.',
    isNew: false,
  },
  {
    id: 'pod-04', title: 'Ep 140 · Identity Before Strategy',
    format: 'podcast', pillar: 'identity', pillarColor: '#A86CFF',
    host: { name: 'George Leith', role: 'Solo', avatar: 'https://i.pravatar.cc/80?img=15' },
    starts: inDays(-22), duration: 31,
    episodeNum: 140,
    price: 'Included', attending: 0,
    myEvents: true, cover: PHOTO.podcast, accent: '#A86CFF',
    description: 'A solo riff: why most strategic plans fail at the identity layer, not the execution layer.',
    isNew: false,
  },

  // ═══════════ REPLAYS / ON-DEMAND ═══════════
  {
    id: 'ev-10', title: 'REPLAY — The Closing Call Teardown',
    format: 'replay', pillar: 'strategy', pillarColor: '#3FB8E8',
    host: { name: 'George Leith', role: 'Founder', avatar: 'https://i.pravatar.cc/80?img=15' },
    starts: inDays(-12), duration: 68,
    price: 'Included', attending: 1240,
    myEvents: false, cover: PHOTO.masterclass, accent: '#3FB8E8',
    description: 'A 68-minute teardown of a real $180K close — objection by objection.',
  },
  {
    id: 'ev-11', title: 'REPLAY — Building the Discipline Engine',
    format: 'replay', pillar: 'accountability', pillarColor: '#E8B547',
    host: { name: 'Jordan Reeves', role: 'Cohort Lead', avatar: 'https://i.pravatar.cc/80?img=52' },
    starts: inDays(-18), duration: 54,
    price: 'Included', attending: 892,
    myEvents: true, cover: PHOTO.workshop, accent: '#E8B547',
    description: 'How to design a personal accountability system that survives travel, sickness, and chaos.',
  },
  {
    id: 'ev-12', title: 'REPLAY — Identity Work with Tariq Hill',
    format: 'replay', pillar: 'identity', pillarColor: '#A86CFF',
    host: { name: 'Tariq Hill', role: 'Performance Coach', avatar: 'https://i.pravatar.cc/80?img=33' },
    starts: inDays(-25), duration: 82,
    price: 'Included', attending: 2140,
    myEvents: false, cover: PHOTO.studio, accent: '#A86CFF',
    description: 'A two-hour intensive on the six most common identity traps operators fall into.',
  },
  {
    id: 'ev-13', title: 'REPLAY — The Morning Audit',
    format: 'replay', pillar: 'foundation', pillarColor: '#D4862B',
    host: { name: 'Amara Okafor', role: 'Operator in Residence', avatar: 'https://i.pravatar.cc/80?img=45' },
    starts: inDays(-31), duration: 42,
    price: 'Included', attending: 1680,
    myEvents: false, cover: PHOTO.workshop, accent: '#D4862B',
    description: 'The 8-question morning protocol that Amara runs before 8 AM, every day, for 3 years.',
  },
  {
    id: 'ev-14', title: 'REPLAY — Mental Reps Under Pressure',
    format: 'replay', pillar: 'mental-toughness', pillarColor: '#ef0e30',
    host: { name: 'Anna Voss', role: 'Author', avatar: 'https://i.pravatar.cc/80?img=23' },
    starts: inDays(-40), duration: 58,
    price: 'Included', attending: 1420,
    myEvents: false, cover: PHOTO.masterclass, accent: '#ef0e30',
    description: 'Live coaching with 4 members working through the biggest decision on their plate.',
  },
  {
    id: 'ev-15', title: 'REPLAY — Execution Operating System',
    format: 'replay', pillar: 'execution', pillarColor: '#19C9A6',
    host: { name: 'Renée Dubois', role: 'VP Sales', avatar: 'https://i.pravatar.cc/80?img=47' },
    starts: inDays(-48), duration: 64,
    price: 'Pro only', attending: 540,
    myEvents: false, cover: PHOTO.arena, accent: '#19C9A6',
    description: 'The weekly, monthly, and quarterly rituals that turn strategy into delivered revenue.',
  },
];

// Format helpers
function fmtTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtDateLong(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtMonthDay(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtRelative(date) {
  const diff = date - Date.now();
  const h = Math.round(diff / 3600000);
  if (h < 0) {
    const days = Math.abs(Math.round(h / 24));
    return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (h < 1) return 'starting now';
  if (h < 24) return `in ${h}h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

Object.assign(window, {
  EVENTS_DATA: EVENTS,
  EVENTS_COVER: COVER,
  EVENTS_PHOTO: PHOTO,
  fmtTime, fmtDay, fmtDateLong, fmtMonthDay, fmtRelative,
});
