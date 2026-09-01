-- Sprint POLISH-2-FIX: scoreboard lag_value column + increment_points RPC

-- ERROR 1: scoreboard_updates.lag_value column missing
ALTER TABLE scoreboard_updates ADD COLUMN IF NOT EXISTS lag_value NUMERIC DEFAULT 0;

-- ERROR 3: increment_points RPC function missing
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET points = points + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
