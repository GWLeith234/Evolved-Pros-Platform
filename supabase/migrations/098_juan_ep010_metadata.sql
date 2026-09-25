-- 098_juan_ep010_metadata.sql
-- Ep 010 metadata brought up to house style (title, guest fields, pillar, YouTube, summary, tags, chapters, pull quotes, show notes).
-- Uses the live slug. Do not change it: shared links and stillUrl.ts JUAN_EP010_SLUG depend on it.
-- guest_image_url stays the repo still from 083. thumbnail_url stays the Transistor cover.
-- RSS sync never updates existing rows (upsert ignoreDuplicates on transistor_episode_id), so these edits stick.

UPDATE public.episodes
SET
  title         = 'From Managed to Modern: Evolving the MSP Channel with Juan Fernandez',
  description   = 'MSP-aaS co-founder Juan Fernandez on moving the channel from managed to modern, the hidden risks of ungoverned AI, and why he bet on humans in an AI era.',
  guest_title   = 'Co-Founder & CEO',
  guest_company = 'MSP-aaS',
  guest_bio     = 'Co-founder and CEO of MSP-aaS, a white-label operating model for managed service providers powered by NOCDOC. Channel veteran and author of the MSP Owners Handbook who built and exited his own MSP in 2016.',
  summary       = 'Channel veteran Juan Fernandez on taking MSPs from managed to modern: outcome-based buying, the hot pan risks of ungoverned AI, betting on humans, and the federal contract collapse that cost him everything.',
  pillar        = 'mental-toughness',
  pillars       = ARRAY['mental-toughness']::text[],
  youtube_url   = 'https://youtu.be/CUc3D43Ms7k',
  youtube_id    = 'CUc3D43Ms7k',
  tags          = ARRAY['msp', 'channel', 'ai', 'cybersecurity', 'outcome-selling', 'white-label', 'resilience', 'leadership', 'evolution']::text[],
  chapters      = '[{"ts": 0, "title": "Cold open: reunion from the leadership circle"}, {"ts": 91, "title": "What the MSP channel is, and how it got here"}, {"ts": 336, "title": "The blind side: automating the customer away"}, {"ts": 489, "title": "From price to outcome: how buyers buy now"}, {"ts": 766, "title": "Stunned in place: the next 12 months"}, {"ts": 1071, "title": "Is AI actually accelerating road maps?"}, {"ts": 1166, "title": "Betting on humans in an AI era"}, {"ts": 1196, "title": "Authenticity vs. slop"}, {"ts": 1413, "title": "The hot pan theory: ungoverned AI and data risk"}, {"ts": 1720, "title": "Copilot, permissions & self-inflicted breaches"}, {"ts": 1782, "title": "MSP-aaS: from managed to modern"}, {"ts": 2302, "title": "Buy vs. build & profit on day one"}, {"ts": 2397, "title": "Co-selling and the general contractor model"}, {"ts": 2643, "title": "IT at home & the remote workforce"}, {"ts": 2888, "title": "The 10-year road to an overnight success"}, {"ts": 3252, "title": "Losing everything: the federal contract that collapsed"}, {"ts": 3587, "title": "Resilience & the chief encouragement officer"}, {"ts": 3771, "title": "Wrap"}]'::jsonb,
  pull_quotes   = '[{"ts": 182, "text": "What do you do when what you do isn''t what you do anymore?", "speaker": "Juan Fernandez"}, {"ts": 336, "text": "The blind side is this next generation is automating the customer away.", "speaker": "Juan Fernandez"}, {"ts": 489, "text": "They''re not buying based on price even anymore. We''re buying based on outcome.", "speaker": "Juan Fernandez"}, {"ts": 859, "text": "I call this time stunned in place. Everybody''s just kind of wait and seeing.", "speaker": "Juan Fernandez"}, {"ts": 920, "text": "There are some AI decisions that quite frankly could take you out if you don''t get it right.", "speaker": "George Leith"}, {"ts": 1166, "text": "Ironically, I invested in humans during an AI era.", "speaker": "Juan Fernandez"}, {"ts": 1413, "text": "You don''t know how hot that pan is until you grab a hold of that thing and get burned by it.", "speaker": "Juan Fernandez"}, {"ts": 2302, "text": "I''ve compressed time to profitability down to day one.", "speaker": "Juan Fernandez"}, {"ts": 3100, "text": "There''s usually some entrepreneur that''s been punched in the face a lot of times, and it worked, and they''re about as surprised as everybody else.", "speaker": "George Leith"}, {"ts": 3403, "text": "Out of nowhere, I lost everything overnight.", "speaker": "Juan Fernandez"}, {"ts": 3679, "text": "My title is CEO and it''s chief encouragement officer.", "speaker": "Juan Fernandez"}, {"ts": 3710, "text": "I just create processes that empower people to be successful, which create great cultures, which grow great businesses.", "speaker": "Juan Fernandez"}]'::jsonb,
  show_notes    = '### About this episode
George Leith sits down with longtime friend and channel veteran Juan Fernandez, co-founder and CEO of MSP-aaS, to talk evolution in the managed service provider world. Juan explains what the MSP channel is and how it moved from break-fix to subscriptions to cyber and now AI, why buyers now buy on outcome instead of price, and the "hot pan" risks of bolting ungoverned AI into a business. He shares why he invested in humans during an AI era, how MSP-aaS takes MSPs from managed to modern, and the story of losing everything when a federal contract collapsed, and what that taught him about resilience and leadership.

### Key takeaways
- **What you do isn''t what you do anymore.** Juan''s guiding question for the channel as it moves from managed to modern.
- **Don''t automate the customer away.** The blind side for tech-heavy businesses is pushing people out of the communication chain. Get back in front of your customer.
- **Buyers buy outcomes, not price.** AI proved people will adopt anything that gets them an outcome faster. Every industry is re-tooling to deliver outcomes.
- **Stunned in place.** Buyers are cautious right now. Treat big AI moves as one-way doors and test the two-way doors.
- **The hot pan theory.** Ungoverned AI can leak data out of your control, and in some states that is a reportable breach. Turning on Copilot tenant-wide can surface data your permissions were meant to protect.
- **Authenticity is the new value.** In a world full of slop, people only listen to sources they trust.
- **Buy vs. build.** MSP-aaS gives MSPs a white-label back end so they can reach profitability on day one instead of a year from now.
- **Scars are an asset.** Juan lost everything when a federal contract collapsed. That lesson shaped every business he has built since, including an MSP he grew from zero to $20M in six years.

### Chapters
- 00:00 Cold open: reunion from the leadership circle
- 01:31 What the MSP channel is, and how it got here
- 05:36 The blind side: automating the customer away
- 08:09 From price to outcome: how buyers buy now
- 12:46 Stunned in place: the next 12 months
- 17:51 Is AI actually accelerating road maps?
- 19:26 Betting on humans in an AI era
- 19:56 Authenticity vs. slop
- 23:33 The hot pan theory: ungoverned AI and data risk
- 28:40 Copilot, permissions & self-inflicted breaches
- 29:42 MSP-aaS: from managed to modern
- 38:22 Buy vs. build & profit on day one
- 39:57 Co-selling and the general contractor model
- 44:03 IT at home & the remote workforce
- 48:08 The 10-year road to an overnight success
- 54:12 Losing everything: the federal contract that collapsed
- 59:47 Resilience & the chief encouragement officer
- 62:51 Wrap

### Notable quotes
- "What do you do when what you do isn''t what you do anymore?" (Juan Fernandez)
- "The blind side is this next generation is automating the customer away." (Juan Fernandez)
- "They''re not buying based on price even anymore. We''re buying based on outcome." (Juan Fernandez)
- "I call this time stunned in place. Everybody''s just kind of wait and seeing." (Juan Fernandez)
- "There are some AI decisions that quite frankly could take you out if you don''t get it right." (George Leith)
- "Ironically, I invested in humans during an AI era." (Juan Fernandez)
- "You don''t know how hot that pan is until you grab a hold of that thing and get burned by it." (Juan Fernandez)
- "I''ve compressed time to profitability down to day one." (Juan Fernandez)
- "There''s usually some entrepreneur that''s been punched in the face a lot of times, and it worked, and they''re about as surprised as everybody else." (George Leith)
- "Out of nowhere, I lost everything overnight." (Juan Fernandez)
- "My title is CEO and it''s chief encouragement officer." (Juan Fernandez)
- "I just create processes that empower people to be successful, which create great cultures, which grow great businesses." (Juan Fernandez)

### About the guest
**Juan Fernandez** is co-founder and CEO of **MSP-aaS**, a white-label operating model that gives managed service providers a US-based service desk, NOC, SOC and operations back end, powered by NOCDOC. A long-time channel builder, he is the author of the MSP Owners Handbook.

### Watch / listen
Full episode on YouTube: https://youtu.be/CUc3D43Ms7k
'
  -- location = 'Remote'  -- OPTIONAL, see STAGED.md (inferred, not stated)
WHERE id = '31b3509d-0fce-41e2-8c63-e4b2d6ed10af'
  AND slug = 'evolved-pros-podcast-ep-010-juan-fernandez';
