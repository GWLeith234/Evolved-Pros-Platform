/* 074_users_tier_default.sql */
/* SPRINT P — Close the users.tier gap before free-signup traffic lands. */
/*                                                                        */
/* WHY THIS EXISTS                                                        */
/* public.users.tier is currently nullable with no default. Today there  */
/* are zero NULL rows, but only because free-signup traffic has not       */
/* arrived yet. The media funnel is the top of the revenue ladder and     */
/* free signup is the entry point, so a NULL tier would leak in the       */
/* moment that traffic lands. This migration gives the column a default   */
/* of 'community', backfills any NULLs, then enforces NOT NULL.           */
/*                                                                        */
/* ORDER MATTERS                                                          */
/* The backfill (step 2) must sit between the default (step 1) and the    */
/* NOT NULL (step 3). If NOT NULL ran before the backfill, any existing   */
/* NULL row would make step 3 fail.                                       */
/*                                                                        */
/* EXECUTION NOTE                                                         */
/* Run each statement below INDIVIDUALLY. This environment only returns   */
/* the last result set of a multi-statement batch, which would hide a     */
/* failure in an earlier statement.                                       */
/*                                                                        */
/* Tier values are always lowercase: 'community', never 'Community'.      */

/* Step 1 of 3: set the column default. */
ALTER TABLE public.users ALTER COLUMN tier SET DEFAULT 'community';

/* Step 2 of 3: backfill any existing NULL rows before enforcing NOT NULL. */
UPDATE public.users SET tier = 'community' WHERE tier IS NULL;

/* Step 3 of 3: enforce the constraint now that no NULL rows remain. */
ALTER TABLE public.users ALTER COLUMN tier SET NOT NULL;
