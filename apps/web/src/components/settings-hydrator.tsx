import { Provider, createStore } from "jotai";
import { type ReactNode, useMemo } from "react";
import {
  groupByAtom,
  priorityFiltersAtom,
  sortDirectionAtom,
  sortFieldAtom,
  tagFiltersAtom,
  viewModeAtom,
} from "~/atoms/board-atoms";
import type { BoardSettings } from "~/lib/cookies.shared";

type SettingsHydratorProps = {
  settings: BoardSettings;
  children: ReactNode;
};

export function SettingsHydrator({ settings, children }: SettingsHydratorProps) {
  // Create a store with initial values from server-loaded settings
  // This ensures both SSR and client hydration use the same atom values
  const store = useMemo(() => {
    const s = createStore();
    s.set(viewModeAtom, settings.viewMode);
    s.set(groupByAtom, settings.groupBy);
    s.set(priorityFiltersAtom, new Set(settings.priorityFilters));
    s.set(tagFiltersAtom, new Set(settings.tagFilters));
    s.set(sortFieldAtom, settings.sortField);
    s.set(sortDirectionAtom, settings.sortDirection);
    return s;
  }, [
    settings.viewMode,
    settings.groupBy,
    settings.priorityFilters,
    settings.tagFilters,
    settings.sortField,
    settings.sortDirection,
  ]);

  return <Provider store={store}>{children}</Provider>;
}
