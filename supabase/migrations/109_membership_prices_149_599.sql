-- 109_membership_prices_149_599.sql
-- Canonical monthly prices: VIP $149 (14900 cents), The Evolved Pros 99 $599
-- (59900 cents). USD, interval month.
--
-- Does not delete price rows. Does not clear or rename stripe_price_id.
-- Previous active monthly rows are marked inactive so checkout's one-active
-- price index can hold the new amount. Archived and legacy price ids stay
-- on the row so the webhook still maps $49, $99, $249, $849, and the annuals.
--
-- stripe_price_id on the new rows is left null. George creates the Stripe
-- Price objects and sets STRIPE_PRICE_VIP_MONTHLY_149 and
-- STRIPE_PRICE_PRO_MONTHLY_599. Checkout reads those env vars until the
-- catalogue row is linked.
--
-- Not applied to the hosted project by this change. Apply before deploy.
-- Do not run this file against production from an agent. No Stripe API calls.

UPDATE public.products
SET name = 'The Evolved Pros 99',
    description = 'One of 99 seats',
    updated_at = now()
WHERE slug = 'membership_pro'
  AND name IS DISTINCT FROM 'The Evolved Pros 99';

UPDATE public.products
SET description = 'Full Academy, member messages, and the EvPros Today brief',
    updated_at = now()
WHERE slug = 'membership_vip'
  AND description IS DISTINCT FROM 'Full Academy, member messages, and the EvPros Today brief';

-- Retire the active monthly amount only. Annual rows are untouched.
-- Legacy stripe_price_id values stay on the inactive rows.
UPDATE public.prices AS price
SET active = false,
    updated_at = now()
FROM public.products AS product
WHERE price.product_id = product.id
  AND product.kind = 'membership'
  AND product.tier IN ('vip', 'pro')
  AND price.interval = 'month'
  AND price.active = true
  AND price.unit_amount IS DISTINCT FROM (
    CASE product.tier
      WHEN 'vip' THEN 14900
      WHEN 'pro' THEN 59900
    END
  );

INSERT INTO public.prices (product_id, interval, unit_amount, currency, active, metadata)
SELECT product.id,
       'month',
       14900,
       'usd',
       true,
       jsonb_build_object(
         'lookup_key', 'vip_monthly_149',
         'nickname', 'VIP monthly 149'
       )
FROM public.products AS product
WHERE product.slug = 'membership_vip'
  AND NOT EXISTS (
    SELECT 1
    FROM public.prices AS existing
    WHERE existing.product_id = product.id
      AND existing.interval = 'month'
      AND existing.active = true
      AND existing.unit_amount = 14900
  );

INSERT INTO public.prices (product_id, interval, unit_amount, currency, active, metadata)
SELECT product.id,
       'month',
       59900,
       'usd',
       true,
       jsonb_build_object(
         'lookup_key', 'pro_monthly_599',
         'nickname', 'The Evolved Pros 99 monthly 599'
       )
FROM public.products AS product
WHERE product.slug = 'membership_pro'
  AND NOT EXISTS (
    SELECT 1
    FROM public.prices AS existing
    WHERE existing.product_id = product.id
      AND existing.interval = 'month'
      AND existing.active = true
      AND existing.unit_amount = 59900
  );
