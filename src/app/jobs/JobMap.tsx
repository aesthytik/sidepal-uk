"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type MapLayerMouseEvent,
  Map as MapLibre,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, GlobeIcon } from "@/components/ui/icons";
import { PLACE_BY_ID } from "@/lib/geo/places";
import type { JobMap as JobMapData, MapPlace } from "@/lib/jobs";
import { type SearchFilters, toSearchParams } from "@/lib/searchParams";
import { cn } from "@/lib/utils";
import { useCalm } from "@/store/useGame";
import { SortSelect } from "./SortSelect";

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const UK: LngLatBoundsLike = [[-8.6, 49.8], [1.9, 58.8]];
const LIMITS: LngLatBoundsLike = [[-16, 47], [8, 62]];
const PLACE_ZOOM = 10; // Clusters break apart past zoom 9, so a selected place is always its own bubble

// Bubble sizes grow with the square root of the job count, so area tracks jobs
const CLUSTER_RADIUS: ExpressionSpecification = ["interpolate", ["linear"], ["sqrt", ["get", "jobs"]], 1, 15, 80, 48];
const PLACE_RADIUS: ExpressionSpecification = ["interpolate", ["linear"], ["sqrt", ["get", "count"]], 1, 8, 80, 42];
const ANY_RADIUS: ExpressionSpecification = ["case", ["has", "point_count"], CLUSTER_RADIUS, PLACE_RADIUS];
const NOTHING: FilterSpecification = ["==", ["get", "id"], "__none__"];

type Hover = { kind: "place"; id: string } | { kind: "cluster"; id: number } | null;

interface Props {
  filters: SearchFilters;
  onChange: (changes: Partial<SearchFilters>) => void;
  /** The job list for the selected place, rendered by the jobs page. */
  children: React.ReactNode;
}

/** UK map of where matching jobs are, with a side panel listing places or one place's jobs. */
export default function JobMap({ filters, onChange, children }: Props) {
  const calm = useCalm();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [data, setData] = useState<JobMapData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [hover, setHover] = useState<Hover>(null);
  const [order, setOrder] = useState<"count" | "name">("count");
  const selected = filters.place;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // The map shows every place matching the other filters, whichever place is open
  const key = toSearchParams({ ...filters, place: undefined, sort: undefined, view: undefined }).toString();
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/jobs/map?${key}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Map failed: ${res.status}`);
        return res.json() as Promise<JobMapData>;
      })
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [key, retry]);

  // Create the map once
  useEffect(() => {
    if (!box.current) return;
    const map = new MapLibre({
      container: box.current,
      style: STYLE,
      bounds: UK,
      fitBoundsOptions: { padding: 24 },
      maxBounds: LIMITS,
      minZoom: 4,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      addJobLayers(map);
      paint(map, selectedRef.current);
      setMapReady(true);
    });
    mapRef.current = map;

    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const repaint = () => map.isStyleLoaded() && paint(map, selectedRef.current);
    dark.addEventListener("change", repaint);
    return () => {
      dark.removeEventListener("change", repaint);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Pointer interaction: tooltip, hover pulse, click to zoom or open a place
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const tip = new Popup({ closeButton: false, closeOnClick: false, offset: 14, className: "job-map-tip" });

    const onMove = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = "pointer";
      const p = f.properties as Record<string, unknown>;
      const cluster = typeof p.cluster_id === "number";
      setHover(cluster ? { kind: "cluster", id: p.cluster_id as number } : { kind: "place", id: String(p.id) });
      const jobs = Number(cluster ? p.jobs : p.count);
      tip
        .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
        .setDOMContent(
          tipContent(
            cluster ? `${Number(p.point_count)} places` : String(p.name),
            `${jobs.toLocaleString()} job${jobs === 1 ? "" : "s"} · ${cluster ? "click to zoom in" : "click to see them"}`
          )
        )
        .addTo(map);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      setHover(null);
      tip.remove();
    };
    const onClick = async (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties as Record<string, unknown>;
      const center = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      if (typeof p.cluster_id === "number") {
        const zoom = await (map.getSource("jobs") as GeoJSONSource).getClusterExpansionZoom(p.cluster_id);
        map.easeTo({ center, zoom: zoom + 0.3, duration: calm ? 0 : 700 });
      } else {
        onChange({ place: String(p.id) });
      }
    };

    for (const layer of ["job-clusters", "job-places"]) {
      map.on("mousemove", layer, onMove);
      map.on("mouseleave", layer, onLeave);
      map.on("click", layer, onClick);
    }
    return () => {
      tip.remove();
      for (const layer of ["job-clusters", "job-places"]) {
        map.off("mousemove", layer, onMove);
        map.off("mouseleave", layer, onLeave);
        map.off("click", layer, onClick);
      }
    };
  }, [mapReady, onChange, calm]);

  // New results: swap the data and grow the bubbles in
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data) return;
    (map.getSource("jobs") as GeoJSONSource).setData(toGeoJson(data.places));
    if (calm) return setScale(map, 1);
    return animate(650, (t) => setScale(map, easeOutBack(t)));
  }, [data, mapReady, calm]);

  // Highlight the open place and fly to it; fly back out when it closes
  const wasSelected = useRef(selected);
  useEffect(() => {
    // The row that was hovered is gone, so its mouseleave never fires
    setHover(null);
    const map = mapRef.current;
    if (!map || !mapReady) return;
    highlight(map, palette(), selected);
    const place = selected ? PLACE_BY_ID.get(selected) : undefined;
    const duration = calm ? 0 : 1400;
    if (place) map.flyTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), PLACE_ZOOM), duration, essential: true });
    else if (wasSelected.current && wasSelected.current !== "remote" && !selected) map.fitBounds(UK, { padding: 24, duration });
    wasSelected.current = selected;
  }, [selected, mapReady, calm]);

  // A soft ring that pulses around whatever is hovered, on the map or in the list
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const filter: FilterSpecification = !hover
      ? NOTHING
      : hover.kind === "cluster"
        ? ["==", ["get", "cluster_id"], hover.id]
        : ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], hover.id]];
    map.setFilter("job-pulse", filter);
    if (!hover) return;
    if (calm) {
      map.setPaintProperty("job-pulse", "circle-radius", ["*", ANY_RADIUS, 1.45]);
      map.setPaintProperty("job-pulse", "circle-opacity", 0.3);
      return;
    }
    return animate(
      1300,
      (t) => {
        map.setPaintProperty("job-pulse", "circle-radius", ["*", ANY_RADIUS, 1 + 0.8 * t]);
        map.setPaintProperty("job-pulse", "circle-opacity", 0.45 * (1 - t));
      },
      true
    );
  }, [hover, mapReady, calm]);

  const places = useMemo(() => {
    const list = [...(data?.places ?? [])];
    return order === "name" ? list.sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [data, order]);
  const busiest = data?.places[0]?.count ?? 1;
  const open = selected === "remote" ? { name: "Remote / UK-wide", count: data?.remote ?? 0 } : data?.places.find((p) => p.id === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
      <div className="card relative h-[55vh] min-h-[22rem] overflow-hidden p-0 lg:h-[72vh]">
        <div ref={box} className="h-full w-full" aria-label="Map of UK jobs" role="region" />
        {(!mapReady || status === "loading") && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {mapReady ? "Updating…" : "Loading map…"}
          </div>
        )}
        {data && status === "ready" && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-card/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
            <span className="font-semibold tabular-nums">{(data.total - data.unplaced).toLocaleString()}</span> jobs in{" "}
            <span className="font-semibold tabular-nums">{data.places.length}</span> places
          </div>
        )}
      </div>

      <aside className="card flex max-h-[72vh] min-h-[22rem] flex-col overflow-hidden p-0" aria-label="Places">
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Button variant="ghost" size="sm" onClick={() => onChange({ place: undefined })} aria-label="Back to all places">
                <ArrowLeftIcon />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-semibold">{open?.name ?? PLACE_BY_ID.get(selected)?.name ?? "Jobs"}</h2>
                {open && <p className="text-xs text-muted-foreground tabular-nums">{open.count.toLocaleString()} jobs</p>}
              </div>
              <SortSelect value={filters.sort} onChange={(sort) => onChange({ sort })} />
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">{children}</div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Where the jobs are</h2>
              <Segmented
                label="Order places"
                value={order}
                options={[
                  ["count", "Most jobs"],
                  ["name", "A–Z"],
                ]}
                onChange={setOrder}
              />
            </div>
            {status === "error" ? (
              <div className="p-6 text-center text-sm">
                <p>Couldn&apos;t load the map.</p>
                <Button className="mt-3" variant="outline" size="sm" onClick={() => setRetry((n) => n + 1)}>
                  Try again
                </Button>
              </div>
            ) : !data ? (
              <div className="space-y-2 p-3" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : (
              <ol className="drop-in flex-1 overflow-y-auto p-2" key={`${key}:${order}`}>
                {data.remote > 0 && (
                  <PlaceRow
                    name="Remote / UK-wide"
                    count={data.remote}
                    share={data.remote / busiest}
                    icon={<GlobeIcon className="text-muted-foreground" />}
                    onClick={() => onChange({ place: "remote" })}
                  />
                )}
                {places.map((p) => (
                  <PlaceRow
                    key={p.id}
                    name={p.name}
                    count={p.count}
                    share={p.count / busiest}
                    active={hover?.kind === "place" && hover.id === p.id}
                    onClick={() => onChange({ place: p.id })}
                    onHover={(on) => setHover(on ? { kind: "place", id: p.id } : null)}
                  />
                ))}
                {places.length === 0 && data.remote === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">No jobs match these filters.</li>
                )}
                {data.unplaced > 0 && (
                  <li className="px-3 py-3 text-xs text-muted-foreground">
                    {data.unplaced.toLocaleString()} role{data.unplaced === 1 ? " is" : "s are"} based abroad or somewhere we
                    couldn&apos;t place, so {data.unplaced === 1 ? "it isn't" : "they aren't"} on the map.
                  </li>
                )}
              </ol>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function PlaceRow({
  name,
  count,
  share,
  icon,
  active,
  onClick,
  onHover,
}: {
  name: string;
  count: number;
  share: number;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  onHover?: (on: boolean) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
        onFocus={() => onHover?.(true)}
        onBlur={() => onHover?.(false)}
        className={cn(
          "group relative flex w-full items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
          active && "bg-accent"
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-0 rounded-r-sm bg-primary/10 transition-[width] duration-700 ease-out group-hover:bg-primary/20"
          style={{ width: `${Math.max(2, Math.min(1, share) * 100)}%` }}
        />
        {icon && <span className="relative">{icon}</span>}
        <span className="relative flex-1 truncate font-medium">{name}</span>
        <span className="relative tabular-nums text-muted-foreground">{count.toLocaleString()}</span>
      </button>
    </li>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border p-0.5 text-xs">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            value === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function toGeoJson(places: MapPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name, count: p.count },
    })),
  };
}

function tipContent(title: string, detail: string): HTMLElement {
  const el = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = detail;
  el.append(strong, span);
  return el;
}

function addJobLayers(map: MapLibre) {
  map.addSource("jobs", {
    type: "geojson",
    data: toGeoJson([]),
    cluster: true,
    clusterRadius: 46,
    clusterMaxZoom: PLACE_ZOOM - 1,
    clusterProperties: { jobs: ["+", ["get", "count"]] },
  });
  map.addLayer({ id: "job-pulse", type: "circle", source: "jobs", filter: NOTHING, paint: { "circle-opacity": 0 } });
  map.addLayer({ id: "job-clusters", type: "circle", source: "jobs", filter: ["has", "point_count"] });
  map.addLayer({
    id: "job-cluster-count",
    type: "symbol",
    source: "jobs",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["number-format", ["get", "jobs"], {}],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
  });
  map.addLayer({ id: "job-places", type: "circle", source: "jobs", filter: ["!", ["has", "point_count"]] });
  map.addLayer({
    id: "job-place-count",
    type: "symbol",
    source: "jobs",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["number-format", ["get", "count"], {}],
      "text-font": ["Noto Sans Bold"],
      "text-size": 11,
      "text-allow-overlap": true,
    },
  });
}

/** The site's palette, read from the CSS custom properties so light and dark both match. */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const hsl = (name: string, alpha = 1) => {
    const [h, s, l] = css.getPropertyValue(name).trim().split(/\s+/);
    return `hsla(${h}, ${s}, ${l}, ${alpha})`;
  };
  return {
    paper: hsl("--background"),
    card: hsl("--card"),
    ink: hsl("--foreground"),
    muted: hsl("--muted"),
    faint: hsl("--muted-foreground"),
    border: hsl("--border"),
    line: hsl("--input"),
    primary: hsl("--primary"),
    onPrimary: hsl("--primary-foreground"),
    clay: hsl("--clay"),
    sage: hsl("--sage", 0.12),
    water: hsl("--accent"),
  };
}

type Palette = ReturnType<typeof palette>;

/** The open place turns clay with a thicker ring. */
function highlight(map: MapLibre, c: Palette, selected: string | undefined) {
  const open: ExpressionSpecification = ["==", ["get", "id"], selected ?? ""];
  map.setPaintProperty("job-places", "circle-color", ["case", open, c.clay, c.primary]);
  map.setPaintProperty("job-places", "circle-stroke-width", ["case", open, 3, 1.5]);
}

/** Recolours the base map and the job layers in the site's palette. */
function paint(map: MapLibre, selected: string | undefined) {
  const c = palette();
  for (const layer of map.getStyle().layers) {
    const { id, type } = layer;
    if (id.startsWith("job-")) continue;
    const set = (prop: Parameters<MapLibre["setPaintProperty"]>[1], value: string) => {
      try {
        map.setPaintProperty(id, prop, value);
      } catch {
        // Not every layer has every property
      }
    };
    if (type === "background") set("background-color", c.paper);
    else if (id === "water") set("fill-color", c.water);
    else if (type === "fill" && /park|wood|landcover/.test(id)) set("fill-color", c.sage);
    else if (type === "fill") set("fill-color", c.muted);
    else if (type === "line" && id.startsWith("water")) set("line-color", c.water);
    else if (type === "line" && id.startsWith("boundary")) set("line-color", c.line);
    else if (type === "line") set("line-color", c.border);
    else if (type === "symbol") {
      set("text-color", c.faint);
      set("text-halo-color", c.paper);
    }
  }
  map.setPaintProperty("job-clusters", "circle-color", c.primary);
  map.setPaintProperty("job-clusters", "circle-opacity", 0.88);
  map.setPaintProperty("job-clusters", "circle-stroke-color", c.paper);
  map.setPaintProperty("job-clusters", "circle-stroke-width", 2);
  map.setPaintProperty("job-places", "circle-opacity", 0.92);
  map.setPaintProperty("job-places", "circle-stroke-color", c.paper);
  map.setPaintProperty("job-pulse", "circle-color", c.primary);
  for (const id of ["job-cluster-count", "job-place-count"]) map.setPaintProperty(id, "text-color", c.onPrimary);
  highlight(map, c, selected);
}

function setScale(map: MapLibre, s: number) {
  map.setPaintProperty("job-clusters", "circle-radius", ["*", CLUSTER_RADIUS, s]);
  map.setPaintProperty("job-places", "circle-radius", ["*", PLACE_RADIUS, s]);
  const text = Math.max(0, Math.min(1, (s - 0.5) * 2));
  map.setPaintProperty("job-cluster-count", "text-opacity", text);
  map.setPaintProperty("job-place-count", "text-opacity", text);
}

function easeOutBack(t: number) {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/** Runs `frame(t)` with t from 0 to 1 over `ms`, once or on a loop. Returns a cancel function. */
function animate(ms: number, frame: (t: number) => void, loop = false): () => void {
  let raf = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const t = (now - start) / ms;
    frame(loop ? t % 1 : Math.min(1, t));
    if (loop || t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
