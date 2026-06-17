"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import type { FilterActions, ResolutionTier } from "@/lib/use-wallpaper-filters";
import {
  SORT_OPTIONS,
  ORIENTATION_OPTIONS,
} from "@/lib/use-wallpaper-filters";

/* ───────── helpers ───────── */

interface Option {
  id: string;
  name: string;
  count?: number;
}

/* ───────── SearchInput ───────── */

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg focus-within:border-amber-500/40 flex-1 min-w-0">
      <Search size={14} className="text-zinc-500 shrink-0" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Search title, tags, category…"
        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600 min-w-0" />
      {value && (
        <button onClick={() => onChange("")} className="text-zinc-500 hover:text-zinc-300 shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ───────── SelectDropdown ───────── */

function SelectDropdown({
  label, value, options, onChange, allLabel = "All",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value);
  const display = value === "all" ? allLabel : selected?.name ?? value;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all whitespace-nowrap">
        <span className="text-zinc-500">{label}:</span>
        <span className="font-medium">{display}</span>
        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-1">
          {value !== "all" && (
            <button onClick={() => { onChange("all"); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800">
              {allLabel}
            </button>
          )}
          {options.map((opt) => (
            <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-zinc-800 transition-colors ${opt.id === value ? "text-amber-400" : "text-zinc-300"}`}>
              <span>{opt.name}</span>
              {opt.count !== undefined && (
                <span className="text-zinc-500 tabular-nums">{opt.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── ChipGroup (multi-select) ───────── */

function ChipGroup({
  options, selected, onToggle, label,
}: {
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, 8);
  const hasMore = options.length > 8;

  return (
    <div>
      <span className="text-[11px] text-zinc-500 block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((opt) => {
          const isOn = selected.includes(opt.id);
          return (
            <button key={opt.id} onClick={() => onToggle(opt.id)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-all ${
                isOn
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-500"
              }`}>
              {opt.name}
            </button>
          );
        })}
        {hasMore && (
          <button onClick={() => setShowAll(!showAll)}
            className="text-[11px] px-2 py-1 rounded-full border border-zinc-700 text-zinc-500 hover:text-zinc-300">
            {showAll ? "Less" : `+${options.length - 8}`}
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────── PillRow (single-select chips) ───────── */

function PillRow({
  options, value, onChange, label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <span className="text-[11px] text-zinc-500 block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              opt.value === value
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-500"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────── FilterPanel ───────── */

interface FilterPanelProps {
  filters: FilterActions;
  categories: Option[];
  tags: Option[];
  resolutions: ResolutionTier[];
  compact?: boolean;
  showSearch?: boolean;
}

export default function FilterPanel({
  filters,
  categories,
  tags,
  resolutions,
  compact = false,
  showSearch = true,
}: FilterPanelProps) {
  const { values, setCategory, setOrientation, setResolution, toggleTag, setSort, setSearch } = filters;

  const resolutionOptions = resolutions.map((r) => ({ value: r, label: r }));
  const resolvedSortOptions = SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label }));

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {showSearch && <SearchInput value={values.q} onChange={setSearch} />}
        <SelectDropdown label="Category" value={values.category} options={categories} onChange={setCategory} />
        <PillRow label="Orientation" options={ORIENTATION_OPTIONS.map(o => ({ value: o.value, label: o.label }))} value={values.orientation} onChange={setOrientation} />
        <PillRow label="Resolution" options={resolutionOptions} value={values.resolution} onChange={setResolution} />
        <ChipGroup label="Tags" options={tags} selected={values.tags} onToggle={toggleTag} />
        <PillRow label="Sort" options={resolvedSortOptions} value={values.sort} onChange={setSort} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showSearch && (
        <div className="min-w-[200px] max-w-[300px] flex-1">
          <SearchInput value={values.q} onChange={setSearch} />
        </div>
      )}
      <SelectDropdown label="Category" value={values.category} options={categories} onChange={setCategory} />
      <SelectDropdown label="Orientation" value={values.orientation} options={ORIENTATION_OPTIONS.map(o => ({ id: o.value, name: o.label }))} onChange={setOrientation} />
      <SelectDropdown label="Resolution" value={values.resolution} options={resolutionOptions.map(r => ({ id: r.value, name: r.label }))} onChange={setResolution} />
      <SelectDropdown label="Sort" value={values.sort} options={resolvedSortOptions.map(s => ({ id: s.value, name: s.label }))} onChange={setSort} />

      {tags.length > 0 && (
        <div className="relative group">
          <button
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-lg transition-all whitespace-nowrap ${
              values.tags.length > 0
                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}>
            <span className="text-zinc-500">Tags</span>
            {values.tags.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1 rounded">{values.tags.length}</span>
            )}
          </button>
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-2 px-3 hidden group-hover:block">
            <ChipGroup label="" options={tags} selected={values.tags} onToggle={toggleTag} />
          </div>
        </div>
      )}
    </div>
  );
}
