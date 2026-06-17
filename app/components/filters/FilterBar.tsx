"use client";

import { Filter } from "lucide-react";
import FilterPanel from "./FilterPanel";
import ActiveFilterChips from "./ActiveFilterChips";
import type { FilterActions, ResolutionTier } from "@/lib/use-wallpaper-filters";

interface Option {
  id: string;
  name: string;
  count?: number;
}

interface Props {
  filters: FilterActions;
  categories: Option[];
  tags: Option[];
  resolutions: ResolutionTier[];
  totalCount: number;
  filteredCount: number;
  categoryName?: string;
  showSearch?: boolean;
}

export default function FilterBar({
  filters,
  categories,
  tags,
  resolutions,
  totalCount,
  filteredCount,
  categoryName,
  showSearch = true,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterPanel
          filters={filters}
          categories={categories}
          tags={tags}
          resolutions={resolutions}
          compact={false}
          showSearch={showSearch}
        />

        <div className="flex items-center gap-2 ml-auto text-xs text-zinc-500 shrink-0">
          <span>
            <strong className="text-zinc-300">{filteredCount}</strong>
            {filteredCount !== totalCount && (
              <span className="text-zinc-600"> / {totalCount}</span>
            )}
          </span>
          {filters.hasActiveFilters && (
            <button onClick={filters.clearAll}
              className="text-zinc-500 hover:text-zinc-300 underline text-[11px]">
              Clear
            </button>
          )}
        </div>
      </div>

      <ActiveFilterChips filters={filters} categoryName={categoryName} />
    </div>
  );
}
