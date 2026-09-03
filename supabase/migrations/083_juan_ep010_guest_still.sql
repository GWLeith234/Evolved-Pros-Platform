-- 083_juan_ep010_guest_still.sql
-- Public platform still for Ep 010. Uses the live slug — do not invent one.
-- guest_image_url is the art layer. thumbnail_url stays the Transistor cover.

UPDATE public.episodes
SET guest_image_url = '/podcast/guests/juan-fernandez.jpg'
WHERE episode_number = 10
  AND slug = 'evolved-pros-podcast-ep-010-juan-fernandez';
