"use client";

import { X } from "lucide-react";
import type { FilterActions } from "@/lib/use-wallpaper-filters";

interface Props {
  filters: FilterActions;
  categoryName?: string;
}

export default function ActiveFilterChips({ filters, categoryName }: Props) {
  const { values, setCategory, setOrientation, setResolution, setTags, setSearch, clearAll } = filters;
  const chips: { label: string; onRemove: () => void }[] = [];

  if (values.q) {
    chips.push({ label: `"${values.q}"`, onRemove: () => setSearch("") });
  }
  if (values.category !== "all") {
    chips.push({ label: categoryName || values.category, onRemove: () => setCategory("all") });
  }
  if (values.orientation !== "all") {
    chips.push({ label: values.orientation.charAt(0).toUpperCase() + values.orientation.slice(1), onRemove: () => setOrientation("all") });
  }
  if (values.resolution !== "all") {
    chips.push({ label: values.resolution, onRemove: () => setResolution("all") });
  }
  if (values.tags.length > 0) {
    chips.push({ label: `${values.tags.length} tag${values.tags.length > 1 ? "s" : ""}`, onRemove: () => setTags([]) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <span key={chip.label}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {chip.label}
          <button onClick={chip.onRemove} className="hover:text-amber-300" aria-label={`Remove ${chip.label} filter`}>
            <X size={10} />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button onClick={clearAll} className="text-[11px] text-zinc-500 hover:text-zinc-300 underline">
          Clear all
        </button>
      )}
    </div>
  );
}
