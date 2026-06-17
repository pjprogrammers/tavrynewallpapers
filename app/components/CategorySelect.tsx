"use client";

import { useState, useEffect } from "react";
import { listCategories } from "@/lib/category-store";
import type { CategoryDoc } from "@/lib/firestore-types";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function CategorySelect({ value, onChange, required }: CategorySelectProps) {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      id="edit-category"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
    >
      {loading && <option value={value}>{value || "Loading..."}</option>}
      {!loading && categories.length === 0 && (
        <option value="">No categories — create one in Categories</option>
      )}
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
