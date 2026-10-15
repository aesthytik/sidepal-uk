-- Keep the name and location on each event: removed sponsors disappear from the
-- directory, and slug ids can change when organisation names collide.
CREATE TABLE public.sponsor_changes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_key text NOT NULL,
  sponsor_id text NOT NULL,
  sponsor_name text NOT NULL,
  location text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('newly_licensed', 'removed', 'rating_changed', 'route_added', 'route_removed')),
  previous_value text,
  new_value text,
  register_date date,
  observed_at timestamptz NOT NULL,
  source_url text NOT NULL
);

-- A retry or overlapping run of the same download must not duplicate events.
CREATE UNIQUE INDEX sponsor_changes_snapshot_event_idx ON public.sponsor_changes
  (snapshot_key, sponsor_name, change_type, coalesce(previous_value, ''), coalesce(new_value, ''));
CREATE INDEX sponsor_changes_recent_idx ON public.sponsor_changes (observed_at DESC, id DESC);
CREATE INDEX sponsor_changes_type_recent_idx ON public.sponsor_changes (change_type, observed_at DESC, id DESC);
CREATE INDEX sponsor_changes_history_idx ON public.sponsor_changes (sponsor_name, observed_at DESC, id DESC);
CREATE INDEX sponsor_changes_location_idx ON public.sponsor_changes USING gin (location extensions.gin_trgm_ops);

ALTER TABLE public.sponsor_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsor changes are public" ON public.sponsor_changes FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.sponsor_changes FROM anon, authenticated;
GRANT SELECT ON public.sponsor_changes TO anon, authenticated;
GRANT ALL ON public.sponsor_changes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sponsor_changes_id_seq TO service_role;

-- Each import batch commits its sponsor mutations and history in one transaction.
-- If an event write fails, its sponsors stay untouched so a retry can diff them
-- again. The existing refresh remains bounded to small batches.
CREATE OR REPLACE FUNCTION public.apply_sponsor_register_batch(sponsor_rows jsonb, removed_names text[], change_rows jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  insert into sponsors (id, name, city, county, location, rating, routes, visa_types,
    sector, sector_override, override_set, ord, register_date, updated_at)
  select r.id, r.name, r.city, r.county, r.location, r.rating, r.routes, r.visa_types,
    r.sector, r.sector_override, r.override_set, r.ord, r.register_date, r.updated_at
  from jsonb_populate_recordset(null::public.sponsors, sponsor_rows) r
  where true
  on conflict (name) do update set
    id = excluded.id, city = excluded.city, county = excluded.county,
    location = excluded.location, rating = excluded.rating, routes = excluded.routes,
    visa_types = excluded.visa_types, sector = excluded.sector,
    sector_override = excluded.sector_override, override_set = excluded.override_set,
    ord = excluded.ord, register_date = excluded.register_date, updated_at = excluded.updated_at;

  delete from sponsors where name = any (removed_names);

  insert into sponsor_changes (snapshot_key, sponsor_id, sponsor_name, location,
    change_type, previous_value, new_value, register_date, observed_at, source_url)
  select r.snapshot_key, r.sponsor_id, r.sponsor_name, r.location,
    r.change_type, r.previous_value, r.new_value, r.register_date, r.observed_at, r.source_url
  from jsonb_populate_recordset(null::public.sponsor_changes, change_rows) r
  where true
  on conflict do nothing;
end;
$function$;

-- Only the server-side service role may change the register or append history.
REVOKE ALL ON FUNCTION public.apply_sponsor_register_batch(jsonb, text[], jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_sponsor_register_batch(jsonb, text[], jsonb) TO service_role;
