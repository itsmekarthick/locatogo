"use client";

import { useEffect, useMemo, useState } from "react";
import { EMPTY_FACETS, hasJobFilters, type JobFacets, type JobFilters } from "@/lib/jobs/taxonomy";

const cache = new Map<string, JobFacets>();
const CACHE_LIMIT = 60;

type Scope = { hubId: string; country: string };

function buildQuery(scope: Scope, filters: JobFilters) {
  const params = new URLSearchParams();
  if (scope.hubId && scope.hubId !== "all") params.set("hub", scope.hubId);
  if (scope.country && scope.country !== "ALL") params.set("country", scope.country);
  if (filters.levels.length) params.set("level", filters.levels.join(","));
  if (filters.workModes.length) params.set("workplace", filters.workModes.join(","));
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.freshers) params.set("freshers", "1");
  return params.toString();
}

/**
 * Role counts per filter option and the companies that match, fetched from the server for the current hub.
 * The previous answer stays on screen while the next one loads, so counts never blank out as chips are toggled.
 */
export function useJobFacets(scope: Scope, filters: JobFilters) {
  const { hubId, country } = scope;
  const query = useMemo(() => buildQuery({ hubId, country }, filters), [hubId, country, filters]);
  const [fetched, setFetched] = useState<{ query: string; facets: JobFacets }>({ query: "", facets: EMPTY_FACETS });
  const [failedQuery, setFailedQuery] = useState<string | null>(null);

  const cached = cache.get(query);

  useEffect(() => {
    if (cache.has(query)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tech-atlas/facets${query ? `?${query}` : ""}`, { signal: controller.signal });
        if (!response.ok) throw new Error("facets");
        const facets = (await response.json()) as JobFacets;
        if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
        cache.set(query, facets);
        setFetched({ query, facets });
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailedQuery(query);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const facets = cached ?? fetched.facets;
  const ready = Boolean(cached) || fetched.query === query;
  const failed = failedQuery === query && !ready;
  const companyCounts = useMemo(() => new Map(facets.companies), [facets.companies]);

  return {
    facets,
    /** Roles per company for the filters that were applied when these facets were fetched. */
    companyCounts,
    loading: !ready && !failed,
    failed,
    active: hasJobFilters(filters),
    /** True when the facets on screen answer the current filters. */
    ready,
  };
}
