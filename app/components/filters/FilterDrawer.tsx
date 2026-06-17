"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
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

export default function FilterDrawer({
  filters,
  categories,
  tags,
  resolutions,
  totalCount,
  filteredCount,
  categoryName,
  showSearch = true,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)}
          className="relative flex items-center gap-1.5 px-3 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
          <Filter size={14} />
          <span>Filters</span>
          {filters.activeCount > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
              {filters.activeCount}
            </span>
          )}
        </button>
        <span className="text-xs text-zinc-500">
          <strong className="text-zinc-300">{filteredCount}</strong>
          {filteredCount !== totalCount && (
            <span className="text-zinc-600"> / {totalCount}</span>
          )}
        </span>
      </div>

      <ActiveFilterChips filters={filters} categoryName={categoryName} />

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Filters</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <FilterPanel
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                compact={true}
                showSearch={showSearch}
              />
            </div>

            <div className="sticky bottom-0 flex gap-2 px-4 py-3 bg-zinc-950 border-t border-zinc-800">
              {filters.hasActiveFilters && (
                <button onClick={() => { filters.clearAll(); setOpen(false); }}
                  className="flex-1 px-3 py-2 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all">
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
