"use client";

import { useEffect, useMemo, useState } from "react";
import { hashKey, useQueryClient } from "@tanstack/react-query";
import { catalogSnapshotQueryOptions, commitCatalogSnapshot, prepareCatalogSnapshot } from "@/lib/storefrontCatalog.mjs";

// Commit refreshed snapshots after navigation commits, rather than mutating
// another mounted observer during render or an aborted transition. Existing
// newer data wins. Missing queries are still seeded immediately by initialData.
export function useCatalogSnapshotOptions(queryKey, options) {
  const client = useQueryClient();
  const queryHash = hashKey(queryKey);
  const { initialData, initialDataUpdatedAt } = options;
  // Query keys are JSON catalog keys. Capture once per incoming snapshot, not
  // again when an older request updates the cache before the effect runs.
  const adoption = useMemo(() => prepareCatalogSnapshot(client, JSON.parse(queryHash), {
    initialData, initialDataUpdatedAt,
  }), [client, queryHash, initialData, initialDataUpdatedAt]);
  const [completed, setCompleted] = useState(null);
  useEffect(() => {
    if (!adoption.eligible) return;
    let active = true;
    void commitCatalogSnapshot(client, adoption.queryKey, adoption.options, adoption).then(() => {
      if (active) setCompleted(adoption);
    });
    return () => { active = false; };
  }, [client, adoption]);
  return catalogSnapshotQueryOptions(client.getQueryState(queryKey), options,
    adoption.eligible && completed !== adoption);
}
