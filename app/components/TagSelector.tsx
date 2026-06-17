"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { listTags } from "@/lib/tag-store";
import type { TagDoc } from "@/lib/firestore-types";
import { Tag, X } from "lucide-react";

interface TagSelectorProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagSelector({ tags, onAddTag, onRemoveTag }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<TagDoc[]>([]);
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listTags()
      .then(setAllTags)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return allTags
      .filter((t) => t.name.toLowerCase().includes(lower) && !tags.includes(t.id))
      .slice(0, 8);
  }, [allTags, input, tags]);

  const handleAdd = (value: string) => {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!trimmed || trimmed.length > 32) return;
    if (tags.includes(trimmed)) return;
    onAddTag(trimmed);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
        <Tag size={14} />
        Tags
      </label>

      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-800 border border-zinc-700 focus-within:ring-2 focus-within:ring-amber-500/50">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-700 text-xs text-zinc-200">
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (input.trim()) {
                handleAdd(input);
              }
            } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
              onRemoveTag(tags[tags.length - 1]);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
            if (input.trim()) handleAdd(input);
          }}
          placeholder="Type to search or add…"
          maxLength={32}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500"
        />
      </div>

      {focused && input.trim() && filtered.length > 0 && (
        <div className="border border-zinc-700 rounded-lg bg-zinc-850 shadow-lg overflow-hidden">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAdd(t.id);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 text-left"
            >
              <Tag size={12} className="text-zinc-500 shrink-0" />
              <span>{t.name}</span>
              <span className="ml-auto text-[10px] text-zinc-500">{t.id}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {!loading && allTags.slice(0, 12).map((t) =>
          tags.includes(t.id) ? null : (
            <button
              key={t.id}
              type="button"
              onClick={() => handleAdd(t.id)}
              className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            >
              + {t.name}
            </button>
          )
        )}
      </div>

      <p className="text-[11px] text-zinc-500">Up to 30 tags, each ≤ 32 chars. Press Enter or comma to add.</p>
    </div>
  );
}
