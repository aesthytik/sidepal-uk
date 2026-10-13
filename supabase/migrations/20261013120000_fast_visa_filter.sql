-- The visa filter unnested every sponsor's visa_types row by row, so a count for one
-- visa route took ~7s on 127k sponsors and hit the 8s anon statement timeout when
-- several ran at once (e.g. building /visa-routes pages). Comparing the lower-cased
-- array as a whole is equivalent and ~30x faster.
CREATE OR REPLACE FUNCTION public.search_sponsors(q text DEFAULT NULL::text, loc text DEFAULT NULL::text, visa text DEFAULT NULL::text, rating_a boolean DEFAULT false, sector_filter text DEFAULT NULL::text, sector_any text[] DEFAULT NULL::text[], lim integer DEFAULT 20, pg integer DEFAULT 1)
 RETURNS TABLE(id text, name text, city text, county text, location text, rating text, routes text[], visa_types text[], sector text, total bigint, page integer, page_count integer, fuzzy boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  text_q text := lower(trim(coalesce(q, '')));
  esc_q text;
  head_q text;
  tokens text[];
  loc_like text;
  visa_n text := nullif(lower(trim(coalesce(visa, ''))), '');
  want_a boolean := coalesce(rating_a, false);
  lim_n integer := least(greatest(1, coalesce(lim, 20)), 100);
  is_fuzzy boolean := false;
  n_total bigint;
  pages integer;
  page_n integer;
begin
  esc_q := replace(replace(replace(text_q, '\', '\\'), '%', '\%'), '_', '\_');
  head_q := left(esc_q, 3) || '%';
  loc_like := nullif(trim(coalesce(loc, '')), '');
  if loc_like is not null then
    loc_like := '%' || replace(replace(replace(lower(loc_like), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;
  if text_q <> '' then
    select array_agg('%' || replace(replace(replace(t, '\', '\\'), '%', '\%'), '_', '\_') || '%')
      into tokens from unnest(regexp_split_to_array(text_q, '\s+')) t;
  end if;

  select count(*) into n_total
  from sponsors s
  where (tokens is null or s.search_text like all (tokens))
    and (loc_like is null or s.place_text like loc_like)
    and (visa_n is null or lower(s.visa_types::text)::text[] @> array[visa_n])
    and (sector_filter is null or s.sector = sector_filter)
    and (sector_any is null or s.sector = any (sector_any))
    and (not want_a or s.rating like 'A%');

  -- Nothing matched every word: fall back to near-miss names (at most 200)
  if n_total = 0 and text_q <> '' then
    is_fuzzy := true;
    perform set_config('pg_trgm.word_similarity_threshold', '0.5', true);
    select least(count(*), 200) into n_total
    from sponsors s
    where text_q <% lower(s.name)
      and (loc_like is null or s.place_text like loc_like)
      and (visa_n is null or lower(s.visa_types::text)::text[] @> array[visa_n])
      and (sector_filter is null or s.sector = sector_filter)
      and (sector_any is null or s.sector = any (sector_any))
      and (not want_a or s.rating like 'A%');
  end if;

  pages := greatest(1, ceil(n_total::numeric / lim_n)::integer);
  page_n := least(greatest(1, coalesce(pg, 1)), pages);

  return query
  select s.id, s.name, s.city, s.county, s.location, s.rating, s.routes, s.visa_types, s.sector,
         n_total, page_n, pages, is_fuzzy
  from sponsors s
  where (
      (not is_fuzzy and (tokens is null or s.search_text like all (tokens)))
      or (is_fuzzy and text_q <% lower(s.name))
    )
    and (loc_like is null or s.place_text like loc_like)
    and (visa_n is null or lower(s.visa_types::text)::text[] @> array[visa_n])
    and (sector_filter is null or s.sector = sector_filter)
    and (sector_any is null or s.sector = any (sector_any))
    and (not want_a or s.rating like 'A%')
  order by
    case when is_fuzzy and lower(s.name) like head_q then 0 when is_fuzzy then 1 end,
    case when is_fuzzy then word_similarity(text_q, lower(s.name)) end desc nulls last,
    case when is_fuzzy then similarity(lower(s.name), text_q) end desc nulls last,
    case when text_q = '' or is_fuzzy then 0
         when lower(s.name) like esc_q || '%' then 0
         when lower(s.name) like '%' || esc_q || '%' then 1
         else 2 end,
    s.ord
  limit lim_n offset (page_n - 1) * lim_n;
end;
$function$;
