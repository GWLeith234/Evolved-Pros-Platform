# Thursday media publish

The weekly six used to go live through raw SQL (`execute_sql`) with `is_published = true` and a null `featured_image_url`. That skipped the admin API guard, and `storyMeta` then advertised the logo as `og:image`.

## How to publish

Publish through `POST /api/admin/media` with `featured_image_url` set to this project's public Branding URL, or insert the row as a draft (`is_published = false`) and flip it to published only after the hero is attached.

Do not insert or update a non-redirect story to `is_published = true` unless `featured_image_url` is an owned Branding URL:

`https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/...`

Migration `101_media_stories_publish_requires_hero.sql` makes that raw-SQL path fail with `check_violation` (SQLSTATE 23514). Apply it manually only after George's YES. This pull request does not apply it.

Redirect stories are exempt. A view-count update, or any other update that does not publish the row or change `featured_image_url` / `story_type`, still succeeds on rows that were published before the trigger (including Unsplash art and rows that still have no image).

## Proof

`PROVE.json` is the contract for every non-redirect story in the pack:

- HEAD `featured_image_url` returns **200** with a content-type of `image/*`.
- The public page `/media/{pillar}/{slug}` has an `og:image` that is **not** `/logo_horizontal_navy.png` (the default logo, including its absolute www URL).

The same two facts are checked every 30 minutes by `GET /api/cron/media-image-check`. A failure returns HTTP 500, and the `media-image-check` job in `.github/workflows/cron.yml` goes red. That failed GitHub Actions run is the alert (Actions tab, plus GitHub's failed-workflow email).

Stories already live with a null hero will fail that job until they get an owned image or are unpublished. The trigger does not unpublish them, and it does not block their view counts.
