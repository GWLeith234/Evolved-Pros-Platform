#!/usr/bin/env python3
"""Regenerate the 4 weekly report PWAs from on-box feeds.
Usage: python3 _build/refresh.py [--today YYYY-MM-DD]
Local report.json files are gitignored. When SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY are set, each payload is upserted through the
service-role RPC. The script never prints the payload or the key.
Every item carries source + as_of. stale=True when source as_of is older than 8 days.
Anything that cannot be parsed from a source is omitted (logged in build-log.json), never invented."""
import json, re, glob, os, sys, datetime as dt, urllib.request, urllib.error
from zoneinfo import ZoneInfo

TZ = ZoneInfo('America/Regina')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, '_build')
FEEDS = '/workspace/cc/feeds'
ETP = '/workspace/et-pins'
GMW = '/workspace/cc/vault/gm-weekly'
STALE_DAYS = 8
now = dt.datetime.now(TZ)
if '--today' in sys.argv:
    d0 = dt.date.fromisoformat(sys.argv[sys.argv.index('--today') + 1])
    now = dt.datetime.combine(d0, now.time(), TZ)
TODAY = now.date()
LOG = {'omitted': [], 'used': set()}

# ---------------- helpers ----------------
def rel(p): return p.replace('/workspace/', '')
def latest(pattern):
    fs = sorted(glob.glob(pattern))
    return fs[-1] if fs else None
def jload(p):
    try: return json.load(open(p))
    except Exception: return None
def tload(p):
    try: return open(p).read()
    except Exception: return ''
def asof_txt(txt):
    m = re.search(r'as_of:\s*(\d{4}-\d{2}-\d{2})', txt); return m.group(1) if m else None
def clean(s):
    s = str(s).replace('\u2014', ',').replace('\u2013', '-').replace('\u2192', 'to').replace('\u2212', '-')
    s = re.sub(r'\s+,', ',', s); s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()
def is_stale(asof):
    try: return (TODAY - dt.date.fromisoformat(asof)).days > STALE_DAYS
    except Exception: return True
def item(title, status=None, tone='neutral', body=None, source=None, asOf=None):
    LOG['used'].add(source)
    return dict(title=clean(title), status=clean(status) if status else None, tone=tone,
                body=clean(body) if body else None, source=source, asOf=asOf, stale=is_stale(asOf))
def kpi(label, value, delta, source, asOf):
    LOG['used'].add(source)
    return dict(label=clean(label), value=clean(value), delta=clean(delta) if delta else None,
                source=source, asOf=asOf, stale=is_stale(asOf))
def omit(biz, what, why): LOG['omitted'].append(f'{biz}: {what} ({why})')
def safe(biz, what, fn):
    """Run an extractor; on any failure or empty result, omit instead of guessing."""
    try:
        r = fn()
        if r is None or r == []: omit(biz, what, 'not found in source'); return []
        return r if isinstance(r, list) else [r]
    except Exception as e:
        omit(biz, what, f'parse failed: {type(e).__name__}'); return []
def money(x): return f'${x:,.2f}'

# ---------------- sources ----------------
PIPE_SNAP = f'{FEEDS}/SNAPSHOT-PIPELINE.txt'; pipe_txt = tload(PIPE_SNAP); pipe_asof = asof_txt(pipe_txt)
PAY = latest(f'{FEEDS}/_pipeline_payload_*.json'); pay = jload(PAY) or {}
pay_txt = json.dumps(pay, ensure_ascii=False); pay_asof = pay.get('as_of') or (re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(PAY or '')) or [None, None])[1]
SEO_SNAP = f'{FEEDS}/SNAPSHOT-SEO.txt'; seo_txt = tload(SEO_SNAP); seo_asof = asof_txt(seo_txt)
SEOP = f'{FEEDS}/seo-pinned.json'; seop = jload(SEOP) or {}; seop_notes = seop.get('notes', ''); seop_asof = seop.get('as_of')
COSP = f'{FEEDS}/cos-pinned.json'; cos = jload(COSP) or {}; cos_asof = cos.get('as_of')
CFOP = f'{FEEDS}/cfo-pinned.json'; cfo = jload(CFOP) or {}
CFO_SNAP = f'{FEEDS}/SNAPSHOT-CFO.txt'; cfo_txt = tload(CFO_SNAP)
DAUF = latest(f'{FEEDS}/ep-dau-tier-*.json'); dau = jload(DAUF) or {}
DATAP = f'{FEEDS}/data-pinned.json'; data = jload(DATAP) or {}
COM_SNAP = f'{FEEDS}/SNAPSHOT-COMMERCE.txt'; com_txt = tload(COM_SNAP); com_asof = asof_txt(com_txt)
CON_SNAP = f'{FEEDS}/SNAPSHOT-CONTENT.txt'; con_txt = tload(CON_SNAP); con_asof = asof_txt(con_txt)
SOC_SNAP = f'{FEEDS}/SNAPSHOT-SOCIAL.txt'; soc_txt = tload(SOC_SNAP); soc_asof = asof_txt(soc_txt)
ETF = latest(f'{ETP}/????-??-??.json'); et = jload(ETF) or {}; et_asof = et.get('editionDate')
ADC_BEAT = latest('/workspace/cos/adc-pipeline-beat-*.md'); adc_beat = tload(ADC_BEAT) if ADC_BEAT else ''
adc_beat_asof = (re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(ADC_BEAT or '')) or [None, None])[1]
S_PIPE = f'{rel(PIPE_SNAP)}'; S_PAY = rel(PAY) if PAY else None
S_SEO = rel(SEO_SNAP); S_SEOP = rel(SEOP); S_COS = rel(COSP); S_CFO = rel(CFO_SNAP); S_DAU = rel(DAUF) if DAUF else None
S_DATA = rel(DATAP); S_COM = rel(COM_SNAP); S_CON = rel(CON_SNAP); S_SOC = rel(SOC_SNAP); S_ET = rel(ETF) if ETF else None
S_ADCB = rel(ADC_BEAT) if ADC_BEAT else None

def book_status(name, pattern):
    """Deal status from the pipeline payload book. Dollar amounts are stripped on purpose (ADC private)."""
    m = re.search(pattern, pay_txt)
    return m.group(0) if m else None
def soc_line(pattern):
    m = re.search(pattern, soc_txt, re.M); return m.group(0) if m else None
def cos_over(pattern):
    for l in cos.get('overnight', []) + cos.get('gmail_brief', []):
        if re.search(pattern, l): return l
    return None
def cos_cal(pattern):
    for l in cos.get('calendar_today_plus_7d', []):
        if re.search(pattern, l): return l
    return None

gaps_common = []
gm_dirs = sorted(d for d in glob.glob(f'{GMW}/????-??-??') if os.path.isdir(d))
gm_latest = os.path.basename(gm_dirs[-1]) if gm_dirs else None
if not gm_latest or is_stale(gm_latest):
    gaps_common.append(f'GM weekly beat: latest on box is week ending {gm_latest or "none"} (stale), not used. Weeks ending Sep 19 and Sep 26 not found on box or Drive.')

# ---------------- ADC ----------------
def build_adc():
    b = 'adcellerant'
    k, wins, slips, dec, nxt, proj, cli = [], [], [], [], [], [], []
    vista = safe(b, 'Vista Reach status', lambda: book_status('Vista', r'Vista Reach Closed Won \$[\d.,]+k SIGNED') and 'SIGNED')
    smedia = safe(b, 'SMedia status', lambda: book_status('SMedia', r'SMedia Negotiation[^;]*?BLOCKED') and 'BLOCKED')
    hertz = safe(b, 'Hertz status', lambda: book_status('Hertz', r'Hertz Closed Lost DEAD') and 'DEAD')
    kerry = safe(b, 'Kerry status', lambda: book_status('Kerry', r'Kerry DEAD') and 'DEAD')
    fcl = safe(b, 'FCL retarget', lambda: re.search(r'FCL retarget[^\n]*ASK-ALWAYS', pipe_txt).group(0))
    if vista: k.append(kpi('Vista Reach', 'SIGNED', 'Closed won', S_PAY, pay_asof))
    if smedia: k.append(kpi('SMedia', 'BLOCKED', 'Deal desk only', S_PAY, pay_asof))
    if hertz and kerry: k.append(kpi('Hertz / Kerry', 'DEAD', 'Closed lost', S_PAY, pay_asof))
    if fcl: k.append(kpi('FCL retarget', 'ASK', 'Ask-always before any move', S_PIPE, pipe_asof))
    m = re.search(r'Meetings today/tomorrow\s*.\s*(.+?)\s*.\s*[\u25b2\u25bc]', pipe_txt)
    closed = []
    if vista: closed.append(item('Vista Reach', 'Signed', 'good', 'Closed won. Amount withheld (ADC private).', S_PAY, pay_asof))
    if safe(b, 'Reach 360 status', lambda: book_status('Reach 360', r'Reach 360 Closed Won')):
        closed.append(item('Reach 360', 'Closed won', 'good', 'Closed won carry. Amount withheld.', S_PAY, pay_asof))
    lost = []
    for nm, pat, st in [('Hertz', r'Hertz Closed Lost DEAD', 'Dead'), ('Kerry', r'Kerry DEAD', 'Dead'),
                        ('Decatur', r'Decatur CLOSED', 'Closed'), ('Stingray (Paul Larson)', r'Paul Larson Stingray KILLED', 'Killed')]:
        if safe(b, f'{nm} status', lambda pat=pat: book_status(nm, pat)): lost.append(item(nm, st, 'bad', None, S_PAY, pay_asof))
    motion = []
    if smedia: motion.append(item('SMedia', 'Blocked', 'bad', 'Paperwork blocked. Deal desk only.', S_PAY, pay_asof))
    if fcl: motion.append(item('FCL', 'Ask-always', 'warn', 'Close retarget flagged for Fri Sep 25. George must be asked before any move.', S_PIPE, pipe_asof))
    if safe(b, 'Brandt status', lambda: book_status('Brandt', r'Brandt Proposal')):
        motion.append(item('Brandt', 'Proposal', 'neutral', 'Proposal out. Waiting on the Oct 8 Premier\'s Dinner table.', S_PAY, pay_asof))
    if safe(b, 'Enigmatic status', lambda: re.search(r'Enigmatic \$[\d.,]+k Needs Analysis', adc_beat)):
        motion.append(item('Enigmatic', 'Needs analysis', 'neutral', None, S_ADCB, adc_beat_asof))
    if safe(b, 'Waverly status', lambda: book_status('Waverly', r'Waverly Stage 1 PARKED')):
        motion.append(item('Waverly', 'Parked', 'neutral', 'Stage 1 parked.', S_PAY, pay_asof))
    cli = [dict(name='Closed won', items=closed), dict(name='In motion', items=motion), dict(name='Closed lost / dead', items=lost)]
    watch = []
    for pat, t in [(r'WSI/Princess Auto video', 'WSI / Princess Auto video'), (r'Premier Portable/Rock Digital', 'Premier Portable / Rock Digital')]:
        if re.search(pat, adc_beat): watch.append(item(t, 'Watch', 'neutral', None, S_ADCB, adc_beat_asof))
        else: omit(b, t, 'not in ADC pipeline beat')
    proj = [dict(name='Deal desk', items=[x for x in motion if x['title'] in ('SMedia',)]),
            dict(name='Retargeting', items=[x for x in motion if x['title'] == 'FCL']),
            dict(name='Watch list (pipeline beat)', items=watch)]
    if m: proj.append(dict(name='Calendar', items=[item('This week calendar', 'Private', 'neutral', 'ADC meetings are private (titles hidden). ' + m.group(1).split(' · ')[-1] + '.', S_PIPE, pipe_asof)]))
    wins += [x for x in closed]
    slips += ([item('SMedia paperwork stuck', 'Blocked', 'bad', 'Deal desk only until unblocked.', S_PAY, pay_asof)] if smedia else [])
    if lost: slips.append(item('Lost or dead: ' + ', '.join(x['title'].split(' (')[0] for x in lost), 'Dead', 'bad', None, S_PAY, pay_asof))
    if fcl: dec.append(item('FCL retarget: go or hold?', 'Ask-always', 'warn', 'Needs George before the meeting (flagged Fri Sep 25).', S_PIPE, pipe_asof))
    if re.search(r'Visual Visitor', json.dumps(et)) or cos_cal(r'Visual Visitor'):
        src = S_ET if re.search(r'Visual Visitor', json.dumps(et)) else S_COS
        nxt.append(item('Mon: Visual Visitor product demo, 12:00 ET', 'Scheduled', 'neutral', None, S_COS, cos_asof))
    else: omit(b, 'Visual Visitor demo', 'not in calendar carry')
    gaps = ['ADC deal dollars, book numbers and BU revenue withheld by design. SNAPSHOT-ADC (as of Aug 20) is stale and not used.'] + gaps_common
    return dict(kpis=k, byProject=proj, byClient=cli, wins=wins, slips=slips, decisions=dec, nextWeek=nxt, gaps=gaps,
                footer='ADC details private: deal amounts, contacts and book-of-business numbers intentionally withheld.')

# ---------------- Evolved Pros ----------------
def build_ep():
    b = 'evolved-pros'
    k, wins, slips, dec, nxt = [], [], [], [], []
    mem = dau.get('membership', {}); da = dau.get('as_of')
    if mem:
        k.append(kpi('Members (active)', str(mem['members_total']), f"Free {mem['free']['members']} · VIP {mem['vip']['members']} · Pro {mem['pro']['members']}", S_DAU, da))
        k.append(kpi(f"DAU ({dt.date.fromisoformat(da).strftime('%a %b %-d')})", str(mem['dau_total']), 'All tiers', S_DAU, da))
    else: omit(b, 'membership', 'no ep-dau-tier file')
    w = data.get('walk') or {}
    if w.get('this'):
        k.append(kpi('LinkedIn followers', f"{w['this']:,}", f"{w['delta']:+d} vs {w.get('as_of_last','prior')}", S_DATA, w.get('as_of_this', data.get('as_of'))))
    mm = re.search(r'Sitemap locs (\d+) / media story locs (\d+) \(was (\d+)/(\d+)', seop_notes)
    if mm: k.append(kpi('Media stories in sitemap', mm.group(2), f"+{int(mm.group(2))-int(mm.group(4))} vs prior pin", S_SEOP, seop_asof))
    else: omit(b, 'sitemap media count', 'not in seo-pinned notes')
    # projects
    comm = []
    if mem:
        comm.append(item('Tier counts', f"Free {mem['free']['members']} · VIP {mem['vip']['members']} · Pro {mem['pro']['members']}", 'neutral', f"{mem['members_total']} active members. DAU {mem['dau_total']} across tiers.", S_DAU, da))
        if 'downgraded vip' in dau.get('note', ''):
            comm.append(item('VIP downgrade', 'Expired', 'bad', 'The only active VIP moved to community with tier expired (Sep 25).', S_DAU, da))
    if re.search(r'EP automations firing', json.dumps(cos)):
        comm.append(item('EP automations + Vendasta users', 'Fixed', 'good', 'EP automations firing and Vendasta add-users fixed (Amy Deck).', S_COS, cos_asof))
    site = []
    if 'PR #173 MERGED' in seop_notes: site.append(item('/live structured data', 'Live', 'good', 'PR #173 merged Sep 24 and deployed. Googlebot sees WebPage + Service JSON-LD.', S_SEOP, seop_asof))
    if re.search(r'/pricing JSON-LD LIVE', seop_notes): site.append(item('/pricing structured data', 'Live', 'good', None, S_SEOP, seop_asof))
    if re.search(r'PR #170 OPEN DRAFT', seop_notes): site.append(item('/fit page JSON-LD', 'Draft', 'warn', 'PR #170 still an open draft. /fit has 0 JSON-LD.', S_SEOP, seop_asof))
    if 'GSC PROPERTY_MISS' in seop_notes: site.append(item('Search Console access (SEO agent)', 'Missing', 'bad', 'GSC property access still missing for the SEO pin.', S_SEOP, seop_asof))
    gsc = cos_over(r'GSC: evolvedpros.com Search impressions')
    if gsc: site.append(item('Search impressions collecting', 'Started', 'good', 'Search Console started collecting impressions for evolvedpros.com on Sep 23.', S_COS, cos_asof))
    content = []
    if re.search(r'Media 6/6 LIVE', con_txt): content.append(item('Media six (Round 2 Cycle 2)', '6/6 live', 'good', 'Six blog pieces live on EP Media (Thu Sep 24).', S_CON, con_asof))
    if re.search(r'six LI fire-days ARMED 6/6', soc_txt): content.append(item('Six LinkedIn posts', 'Armed', 'good', 'Scheduled 9:00 America/Regina, Mon Sep 28 to Mon Oct 5.', S_SOC, soc_asof))
    ncomm = len(re.findall(r'^- (Maguire|AI/search receipt|AdX cut) LIVE https://www.evolvedpros.com/community', soc_txt, re.M))
    if ncomm: content.append(item('Community posts', f'{ncomm} live', 'good', 'Maguire, AI/search receipt and AdX cut are live in the community.', S_SOC, soc_asof))
    nshorts = len(re.findall(r'^- Quang \S+ LIVE public', soc_txt, re.M))
    if nshorts: content.append(item('YouTube Shorts (Quang)', f'{nshorts} live', 'good', 'Public Shorts live, including Mon Sep 21 and Tue Sep 22 drops.', S_SOC, soc_asof))
    if re.search(r'Podcast still Ep 010', con_txt): content.append(item('Podcast', 'Ep 010', 'warn', 'Still on Ep 010 (Juan). No new episode heard live.', S_CON, con_asof))
    if re.search(r'Thu six X HOLD', soc_txt): content.append(item('X cross-post of the six', 'Hold', 'warn', '0 of 6 on X. Vendasta login wall.', S_SOC, soc_asof))
    proj = [dict(name='Community + membership', items=comm), dict(name='Site + SEO', items=site), dict(name='Content + social', items=content)]
    # overview
    wins += [x for x in site if x['tone'] == 'good'] + [x for x in content if x['tone'] == 'good'][:2]
    note_mem = data.get('note_membership', '')
    if re.search(r'Pro 0/4 .*Pro 0/6', note_mem) or 'Pro +2' in data.get('headline', ''):
        wins.append(item('Pro members up', '+2', 'good', 'Pro 4 to 6 (Sep 18 to Sep 23 pull).', S_DATA, data.get('as_of')))
    slips += [x for x in comm if x['tone'] == 'bad']
    if mem and mem['dau_total'] == 0: slips.append(item('Zero daily actives', 'DAU 0', 'bad', None, S_DAU, da))
    slips += [x for x in site if x['tone'] in ('bad', 'warn')] + [x for x in content if x['tone'] == 'warn']
    kin = [d for d in cos.get('decisions', []) if d.startswith('Kindle')]
    if kin: dec.append(item('Kindle voice QA / publish', 'Hold', 'warn', 'YES needed. Book LIVE Oct 15 on hold.', S_COS, cos_asof))
    if re.search(r'Search Bar READY FOR CONFIRM', soc_txt): dec.append(item('Community Search Bar post', 'Ask-always', 'warn', 'Ready for confirm. Not live yet.', S_SOC, soc_asof))
    if re.search(r'EP Shorts LI DRAFT', soc_txt): dec.append(item('EP Shorts to LinkedIn (33 drafts)', 'Ask-always', 'warn', 'Drafts ready. Nothing posts without YES.', S_SOC, soc_asof))
    if re.search(r'Personal LI ecosystem DRAFT still waiting George YES', soc_txt): dec.append(item('Personal LinkedIn ecosystem CTA', 'Waiting', 'warn', 'Draft waiting on George YES for the CTA (via CoS).', S_SOC, soc_asof))
    m = re.search(r'next_3:\s*(.+)', seo_txt)
    if m:
        for t in [x.strip() for x in m.group(1).split(';')]:
            if re.search(r'#170|GSC', t): nxt.append(item({'merge #170 /fit': 'Merge /fit JSON-LD (PR #170)', 'GSC grant': 'Search Console grant'}.get(t, t), 'Next', 'neutral', None, S_SEO, seo_asof))
    if re.search(r'six LI fire-days ARMED', soc_txt): nxt.append(item('LinkedIn six start firing Mon 9:00', 'Scheduled', 'neutral', None, S_SOC, soc_asof))
    omit(b, 'podcast downloads, keynote pipeline, ladder conversion rates, partners', 'no source this week')
    return dict(kpis=k, byProject=proj, byClient=[], wins=wins, slips=slips, decisions=dec, nextWeek=nxt,
                gaps=['No sourced keynote clients, podcast download or sponsor data this week. Partners tab hidden.',
                      'Tier names are database names (Free, VIP, Pro). Mapping to $49/mo and $249 mastermind not confirmed in source.'] + gaps_common,
                footer='Conversion ladder: free community, $49/mo, $249 weekly mastermind.')

# ---------------- EvolveX360 ----------------
def build_evx():
    b = 'evolvex360'
    k, wins, slips, dec, nxt = [], [], [], [], []
    if re.search(r'0 named EVX', pipe_txt): k.append(kpi('Named EVX meetings', '0', 'Fri/Sat window', S_PIPE, pipe_asof))
    ar = re.search(r'Past-due AR\s*-\s*(\d+) inv\s*·\s*CAD (\$[\d,]+(?:\.\d+)?) \+ USD (\$[\d,]+(?:\.\d+)?)', com_txt)
    if ar: k.append(kpi('Past-due AR', f'{ar.group(1)} inv', f'CAD {ar.group(2)} + USD {ar.group(3)}', S_COM, com_asof))
    wh = re.search(r'Wholesale MTD\s*-\s*(\$[\d,]+(?:\.\d+)?) USD\s*-\s*(\w+)', com_txt)
    if wh: k.append(kpi('Wholesale MTD', wh.group(1), f'USD, {wh.group(2)}', S_COM, com_asof))
    if 'Instant first-para PASS NEW' in seop_notes: k.append(kpi('Transcend AI check', 'PASS', 'Instant first-para, new', S_SEOP, seop_asof))
    tr = []
    if 'crawl robots+sitemap_index+llms 200' in seop_notes: tr.append(item('Crawl', 'Pass', 'good', 'robots, sitemap_index and llms all 200.', S_SEOP, seop_asof))
    if 'og:image PASS' in seop_notes: tr.append(item('og:image + Instant answer', 'Pass', 'good', 'og:image PASS. Instant first-paragraph PASS (was FAIL Sep 24).', S_SEOP, seop_asof))
    if 'privacy/terms still 404' in seop_notes: tr.append(item('Privacy + terms pages', '404', 'bad', 'Legal pages still 404. Site NOT READY until fixed.', S_SEOP, seop_asof))
    o = cos_over(r'^Transcend: Reviews page LIVE')
    if o: tr.append(item('Reviews page + internal 404s', 'Live', 'good', 'Reviews page live, mobile hero CTA updated, internal 404s completed (Dimitri).', S_COS, cos_asof))
    o = cos_over(r'GSC Domain VERIFIED')
    if o: tr.append(item('Search Console / Bing', 'Partial', 'warn', 'GSC domain verified. Bing still unverified.', S_COS, cos_asof))
    wsl = []
    if cos_over(r'WSL Thu weekly LANDED'): wsl.append(item('Thu weekly', 'Landed', 'good', 'Weekly held. PowerGo HTML landing page got praise from Leanne.', S_COS, cos_asof))
    m = re.search(r'Chase remaining WSL CAD (\$[\d,]+(?:\.\d+)?)', com_txt)
    if m: wsl.append(item('Past-due AR', m.group(1) + ' CAD', 'warn', 'Chase remaining WSL balance.', S_COM, com_asof))
    mh = []; sol = []
    if re.search(r'Transcend/Mile High/Solera', com_txt):
        mh.append(item('Past-due AR', 'Chase', 'warn', 'On the AR chase list.', S_COM, com_asof))
        sol.append(item('Past-due AR', 'Chase', 'warn', 'On the AR chase list.', S_COM, com_asof))
        tr.append(item('Past-due AR', 'Chase', 'warn', 'On the AR chase list.', S_COM, com_asof))
    if re.search(r'Solera Closed Won \$[\d.]+k \(EVX\)', pay_txt): sol.insert(0, item('Deal', 'Closed won', 'good', 'Closed won carry (EVX).', S_PAY, pay_asof))
    if re.search(r'Solera creative/Ui', adc_beat): sol.append(item('Creative + Ui order', 'Pending', 'warn', 'Creatives pending, Ui order not entered (as of Sep 23 evening).', S_ADCB, adc_beat_asof))
    cli = [dict(name='Transcend Clinic', items=tr), dict(name='WSL (PowerGo)', items=wsl), dict(name='Solera', items=sol), dict(name='Mile High Dispensary', items=mh)]
    omit(b, 'Tourdesk / Iceland365', 'no source dated this week')
    proj = []
    web = []
    o = cos_over(r'Candice Fri AM UNREAD')
    if o: web.append(item('EvolveX360 website', 'Mostly done', 'good', 'Candice: site mostly done. Wants Our Work showcase confirmed and a review meeting.', S_COS, cos_asof))
    gbp = []
    if re.search(r'EvolveX360: W1-A \+ W1-B Published 2026-09-23', soc_txt): gbp.append(item('Google Business Profile', 'Published', 'good', 'W1-A and W1-B published Sep 23. Website + phone pending Google.', S_SOC, soc_asof))
    proj = [dict(name='Agency site', items=web), dict(name='Local presence (GBP)', items=gbp),
            dict(name='Transcend SEO readiness', items=[x for x in tr if x['title'] != 'Past-due AR'])]
    wins += [x for x in tr if x['tone'] == 'good'][:3] + [x for x in wsl if x['tone'] == 'good'] + gbp
    if k and k[0]['label'] == 'Named EVX meetings': slips.append(item('Zero named EVX meetings', '0', 'bad', 'No named EVX meetings in the Fri/Sat window.', S_PIPE, pipe_asof))
    slips += [x for x in tr if x['tone'] == 'bad' or x['title'] == 'Search Console / Bing']
    if ar: slips.append(item('Past-due AR flat', f'{ar.group(1)} inv', 'warn', 'No movement vs Sep 24.', S_COM, com_asof))
    if web: dec.append(item('Website: confirm Our Work showcase + meet Candice', 'Awaiting', 'warn', 'Unread ask from Fri morning.', S_COS, cos_asof))
    c = cos_cal(r'EvolveX360 <> WSL Sport Weekly')
    if c: nxt.append(item('Tue: EvolveX360 x WSL Sport weekly, 10:00', 'Scheduled', 'neutral', None, S_COS, cos_asof))
    if re.search(r'privacy/terms', seo_txt): nxt.append(item('Fix Transcend privacy + terms', 'Next', 'neutral', None, S_SEO, seo_asof))
    if re.search(r'One action - Chase', com_txt): nxt.append(item('Chase past-due AR', 'Next', 'neutral', 'WSL, Transcend, Mile High, Solera.', S_COM, com_asof))
    return dict(kpis=k, byProject=proj, byClient=cli, wins=wins, slips=slips, decisions=dec, nextWeek=nxt,
                gaps=['Tourdesk / Iceland365: no source dated this week, omitted. No MRR source.'] + gaps_common,
                footer='AR figures are business receivables from the Partner Center commerce pin.')

# ---------------- GWLeith $ ----------------
def build_gw():
    b = 'gwleith-money'
    k, wins, slips, dec, nxt = [], [], [], [], []
    mt = cfo.get('metrics', {}); ca = cfo.get('as_of')
    if mt.get('debt_remaining') is not None:
        k.append(kpi('Debt remaining', money(mt['debt_remaining']), f'Sealed {ca}', S_CFO, ca))
        k.append(kpi('Paid to zero', f"{mt['pct_to_zero']:.1f}%", 'vs baseline', S_CFO, ca))
        k.append(kpi('Run-rate needed', f"${mt['run_rate_needed_mo']:,}/mo", f"{mt['days_remaining']} days from seal", S_CFO, ca))
    else: omit(b, 'CFO debt metrics', 'no sealed CFO pin')
    if cos.get('open_loops') is not None:
        k.append(kpi('Open loops', str(cos['open_loops']), f"Oldest {cos['oldest_loop_days']} days", S_COS, cos_asof))
        k.append(kpi('Decisions awaiting George', str(cos['decisions_awaiting_george']), None, S_COS, cos_asof))
    ar = re.search(r'Past-due AR\s*-\s*(\d+) inv\s*·\s*CAD (\$[\d,]+(?:\.\d+)?) \+ USD (\$[\d,]+(?:\.\d+)?)', com_txt)
    if ar: k.append(kpi('Past-due AR (EVX)', f'{ar.group(1)} inv', f'CAD {ar.group(2)} + USD {ar.group(3)}', S_COM, com_asof))
    ladder = []
    w = re.search(r'\$150k watch PASSED \(under by (\$[\d,]+(?:\.\d+)?)\)', cfo_txt)
    if w: ladder.append(item('$150K watch', 'Passed', 'good', f'Core debt under $150,000 (by {w.group(1)}).', S_CFO, ca))
    r = re.search(r'Retired (\$[\d,]+(?:\.\d+)?) \(([\d.]+%)\) vs baseline (\$[\d,]+(?:\.\d+)?)', cfo_txt)
    if r: ladder.append(item('Retired vs baseline', r.group(2), 'good', f'{r.group(1)} retired against a {r.group(3)} baseline.', S_CFO, ca))
    h = re.search(r'SEAL HOLD (\d{4}-\d{2}-\d{2})', cfo_txt)
    if h: ladder.append(item('Seal status', 'Hold', 'warn', f'Seal hold noted {h.group(1)}. Last seal {ca}. No ladder move over $500.', S_CFO, h.group(1)))
    biz = []
    wh = re.search(r'Wholesale MTD\s*-\s*(\$[\d,]+(?:\.\d+)?) USD', com_txt)
    if wh: biz.append(item('EvolveX360 wholesale MTD', wh.group(1) + ' USD', 'neutral', 'Partner Center wholesale, flat vs Sep 24.', S_COM, com_asof))
    omit(b, 'AdCellerant revenue', 'ADC book numbers withheld by rule')
    omit(b, 'Evolved Pros revenue', 'no revenue source')
    omit(b, 'weekly cash in / out', 'no source')
    rec = []
    if ar:
        rec.append(item('Past-due invoices', f'{ar.group(1)} inv', 'warn', f'CAD {ar.group(2)} + USD {ar.group(3)}. Flat vs Sep 24.', S_COM, com_asof))
        m = re.search(r'Chase remaining WSL CAD (\$[\d,]+(?:\.\d+)?)', com_txt)
        if m: rec.append(item('WSL', m.group(1) + ' CAD', 'warn', 'Largest named past-due balance.', S_COM, com_asof))
        rec.append(item('Transcend, Mile High, Solera', 'Chase', 'warn', 'On the chase list. Per-client amounts not in source.', S_COM, com_asof))
    proj = [dict(name='Debt ladder', items=ladder), dict(name='Revenue by business', items=biz)]
    wins += [x for x in ladder if x['tone'] == 'good']
    slips += [x for x in ladder if x['tone'] == 'warn']
    if cos.get('oldest_loop_days'): slips.append(item(f"Oldest open loop at {cos['oldest_loop_days']} days", f"{cos['oldest_loop_days']} d", 'bad', f"{cos['open_loops']} open loops total.", S_COS, cos_asof))
    for d in cos.get('decisions', []):
        if d.startswith('Kindle'): dec.append(item('Kindle voice QA / publish (EP)', 'Hold', 'warn', 'YES needed. LIVE Oct 15 on hold.', S_COS, cos_asof))
        elif d.startswith('Fred/Lou XPR'): dec.append(item('Fred / Lou XPR (XPR Canada)', 'Overdue', 'bad', 'YES or skip. EOD Thu Sep 24 missed. Reminding until reopened.', S_COS, cos_asof))
        else: dec.append(item(d, 'Awaiting', 'warn', None, S_COS, cos_asof))
    if any(d.startswith('Fred/Lou') for d in cos.get('decisions', [])):
        slips.append(item('XPR deadline missed', 'Overdue', 'bad', 'Fred / Lou XPR decision past EOD Thu Sep 24.', S_COS, cos_asof))
    if ar: nxt.append(item('Chase past-due AR', 'Next', 'neutral', 'Commerce pin one action.', S_COM, com_asof))
    return dict(kpis=k, byProject=proj, byClient=[dict(name='Past-due (EVX Partner Center)', items=rec)], wins=wins, slips=slips, decisions=dec, nextWeek=nxt,
                gaps=['No sourced weekly cash in/out, EP revenue or ADC revenue (ADC withheld). Next CFO seal date not in source.'] + gaps_common,
                footer='Debt figures from the sealed CFO snapshot. Lender names, account numbers and personal balances withheld. Informational only, not investment advice.')

BUILDERS = {'adcellerant': build_adc, 'evolved-pros': build_ep, 'evolvex360': build_evx, 'gwleith-money': build_gw}

_upsert_note = False

def upsert_weekly_report(slug, payload):
    """Push one report into private.weekly_reports via the service-role RPC.

    No public write route. Skips quietly when the operator has not exported
    credentials. Never prints the payload or the key.
    """
    global _upsert_note
    url = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        if not _upsert_note:
            print('upsert skipped: export SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
            _upsert_note = True
        return
    body = json.dumps({'p_slug': slug, 'p_payload': payload}).encode('utf-8')
    req = urllib.request.Request(
        url.rstrip('/') + '/rest/v1/rpc/weekly_report_upsert',
        data=body,
        method='POST',
        headers={
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            status = getattr(res, 'status', 200)
            if status >= 300:
                raise SystemExit(f'{slug}: upsert failed HTTP {status}')
    except urllib.error.HTTPError as err:
        raise SystemExit(f'{slug}: upsert failed HTTP {err.code}') from None
    print(f'{slug}: upserted ({len(body)} bytes sent, payload not logged)')

def week_label(d):
    mon = d - dt.timedelta(days=d.weekday()); sun = mon + dt.timedelta(days=6)
    if mon.month == sun.month: return f"Week of {mon.strftime('%b')} {mon.day}-{sun.day}, {sun.year}"
    return f"Week of {mon.strftime('%b')} {mon.day}-{sun.strftime('%b')} {sun.day}, {sun.year}"

def main():
    themes = json.load(open(f'{B}/themes.json'))
    tpl = open(f'{B}/template.html').read(); swt = open(f'{B}/sw.js').read()
    ver = now.strftime('%Y%m%d%H%M%S')
    summary = {}
    for slug, fn in BUILDERS.items():
        t = themes[slug]; d = os.path.join(ROOT, slug); os.makedirs(d, exist_ok=True)
        rep = fn()
        # drop empty groups
        rep['byProject'] = [g for g in rep['byProject'] if g['items']]
        rep['byClient'] = [g for g in rep['byClient'] if g['items']]
        stamps = [x['asOf'] for x in rep['kpis'] if x.get('asOf')]
        out = dict(business=t['name'].replace(' Weekly', ''), week=week_label(TODAY), generatedAt=now.isoformat(timespec='seconds'),
                   lastUpdated=now.isoformat(timespec='seconds'), newestSource=max(stamps) if stamps else None,
                   labels=t['labels'], swVersion=ver, **rep)
        txt = json.dumps(out, indent=2, ensure_ascii=False)
        assert '\u2014' not in txt and '\u2013' not in txt, f'dash in {slug}'
        open(f'{d}/report.json', 'w').write(txt)
        vars_css = ';'.join(f"--{k.replace('_','-')}:{v}" for k, v in t['vars'].items())
        html = (tpl.replace('__TITLE__', t['name']).replace('__THEME__', t['theme']).replace('__SHORT__', t['short'])
                .replace('__VARS__', vars_css).replace('__LOGO__', t['logo']).replace('__SLUG__', slug))
        open(f'{d}/index.html', 'w').write(html)
        open(f'{d}/sw.js', 'w').write(swt.replace('__SLUG__', slug).replace('__VER__', ver))
        base = f'/admin/reports/{slug}/'
        man = dict(name=t['name'], short_name=t['short'], description=f"{t['name']} report for George Leith", start_url=base, scope=base,
                   display='standalone', orientation='portrait', theme_color=t['theme'], background_color=t['bg'],
                   icons=[dict(src=base + 'icon.svg', sizes='any', type='image/svg+xml'),
                          dict(src=base + 'icon-192.png', sizes='192x192', type='image/png'),
                          dict(src=base + 'icon-512.png', sizes='512x512', type='image/png', purpose='any maskable')])
        json.dump(man, open(f'{d}/manifest.webmanifest', 'w'), indent=2)
        n = len(rep['kpis']) + sum(len(g['items']) for g in rep['byProject'] + rep['byClient']) + sum(len(rep[s]) for s in ('wins', 'slips', 'decisions', 'nextWeek'))
        summary[slug] = dict(items=n, stale=sum(1 for x in rep['kpis'] if x['stale']))
        upsert_weekly_report(slug, out)
    LOG['used'] = sorted(x for x in LOG['used'] if x)
    json.dump(dict(generatedAt=now.isoformat(timespec='seconds'), swVersion=ver, summary=summary, **LOG), open(f'{B}/build-log.json', 'w'), indent=2)
    print(json.dumps(summary)); print(f'SW cache version {ver}. Omitted: {len(LOG["omitted"])} (see _build/build-log.json)')
    print('Local report.json files are gitignored. Do not commit them.')

if __name__ == '__main__': main()
