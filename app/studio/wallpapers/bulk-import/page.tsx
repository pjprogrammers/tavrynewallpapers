"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Upload,
  Link2,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  Play,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";

type InputMode = "urls" | "csv";
type CsvInputType = "file" | "paste";

interface BulkItem {
  imageUrl: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  rowNumber: number;
}

const COLUMN_ALIASES: Record<string, string> = {
  url: "imageUrl",
  image_url: "imageUrl",
  imageurl: "imageUrl",
  src: "imageUrl",
  image: "imageUrl",
  cat: "category",
  category_id: "category",
  desc: "description",
  tag: "tags",
};

const KNOWN_COLUMNS = new Set(["imageUrl", "title", "description", "category", "tags"]);

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const lower = h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    return COLUMN_ALIASES[lower] ?? lower;
  });
}

function normalizeRow(
  row: Record<string, string>,
  rowNumber: number
): BulkItem | { error: string } {
  const imageUrl = (row.imageUrl || "").trim();
  if (!imageUrl) {
    return { error: `Row ${rowNumber}: missing imageUrl` };
  }
  const tagsRaw = (row.tags || "").trim();
  const tags = tagsRaw
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    imageUrl,
    title: (row.title || "").trim() || "",
    description: (row.description || "").trim() || "",
    categoryId: (row.category || "").trim().toLowerCase() || "abstract",
    tags,
    rowNumber,
  };
}

import { detectImageDimensions } from "@/lib/image-utils";

function titleFromUrl(url: string, fallback: string): string {
  return (
    url
      .split("/")
      .pop()
      ?.split(".")?.[0]
      ?.replace(/[-_]/g, " ")
      ?.trim() || fallback
  );
}

const CONCURRENCY = 5;
const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
const PREVIEW_ROW_LIMIT = 10;

interface ImportResult {
  url: string;
  status: "ok" | "duplicate" | "error";
  id?: string;
  title?: string;
  error?: string;
}

function TablePreview({ previewRows }: { previewRows: BulkItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-zinc-800/50">
            <th className="text-left px-3 py-2 text-zinc-400 font-medium">#</th>
            <th className="text-left px-3 py-2 text-zinc-400 font-medium">URL</th>
            <th className="text-left px-3 py-2 text-zinc-400 font-medium">Title</th>
            <th className="text-left px-3 py-2 text-zinc-400 font-medium">Category</th>
            <th className="text-left px-3 py-2 text-zinc-400 font-medium">Tags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {previewRows.map((row, i) => (
            <tr key={i} className="hover:bg-zinc-800/30">
              <td className="px-3 py-2 text-zinc-500">{row.rowNumber}</td>
              <td className="px-3 py-2 text-zinc-300 max-w-[180px] truncate" title={row.imageUrl}>
                {row.imageUrl}
              </td>
              <td className="px-3 py-2 text-zinc-300 max-w-[120px] truncate">
                {row.title || <span className="text-zinc-600">auto</span>}
              </td>
              <td className="px-3 py-2">
                <span className="capitalize text-zinc-300">{row.categoryId}</span>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1 flex-wrap">
                  {row.tags.length > 0 ? (
                    row.tags.map((t, j) => (
                      <span
                        key={j}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BulkImportPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [mode, setMode] = useState<InputMode>("urls");
  const [csvInputType, setCsvInputType] = useState<CsvInputType>("file");
  const [urls, setUrls] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<BulkItem[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [createdCategories, setCreatedCategories] = useState<string[]>([]);
  const [createdTags, setCreatedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate = user && hasPermission(user, "wallpaper.create", roles);

  const parseCsvText = useCallback((text: string) => {
    setError(null);
    setResults(null);
    setParsedRows(null);
    setParseErrors([]);
    setCreatedCategories([]);
    setCreatedTags([]);

    if (!text || !text.trim()) {
      setError("CSV content is empty");
      setParsing(false);
      return;
    }

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const errors: string[] = [];
        if (result.errors.length > 0) {
          for (const err of result.errors.slice(0, 5)) {
            errors.push(`Parse error at row ${err.row ?? "?"}: ${err.message}`);
          }
        }

        const headers = result.meta.fields ?? [];
        if (headers.length === 0) {
          setError("CSV content has no columns");
          setParsing(false);
          return;
        }

        const normalized = normalizeHeaders(headers);
        const headerMap: Record<string, string> = {};
        for (let i = 0; i < headers.length; i++) {
          headerMap[normalized[i]] = headers[i];
        }

        const knownInHeaders = normalized.filter((h) => KNOWN_COLUMNS.has(h));
        if (!knownInHeaders.includes("imageUrl")) {
          errors.push(
            'No imageUrl column found. Expected one of: imageUrl, url, image_url, src, image'
          );
        }

        const items: BulkItem[] = [];
        const rawRows = result.data as Record<string, string>[];
        if (rawRows.length === 0) {
          setError("CSV content has no data rows");
          setParsing(false);
          return;
        }

        for (let i = 0; i < rawRows.length; i++) {
          const mapped: Record<string, string> = {};
          for (const [normKey, origKey] of Object.entries(headerMap)) {
            if (KNOWN_COLUMNS.has(normKey)) {
              mapped[normKey] = rawRows[i][origKey] ?? "";
            }
          }
          const row = normalizeRow(mapped, i + 2);
          if ("error" in row) {
            errors.push(row.error);
          } else {
            items.push(row);
          }
        }

        if (items.length === 0) {
          setError("No valid rows found in CSV. Check that imageUrl column is present and populated.");
          setParsing(false);
          return;
        }

        setParsedRows(items);
        setParseErrors(errors);
        setParsing(false);
      },
    });
  }, []);

  const handleCsvFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    if (file.size > MAX_CSV_SIZE_BYTES) {
      setError(`File too large (max ${MAX_CSV_SIZE_BYTES / 1024 / 1024}MB)`);
      return;
    }
    if (file.size === 0) {
      setError("CSV file is empty");
      return;
    }

    setError(null);
    setResults(null);
    setParsedRows(null);
    setParseErrors([]);
    setCreatedCategories([]);
    setCreatedTags([]);
    setCsvFile(file);
    setCsvText("");
    setParsing(true);

    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsvText(text);
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setParsing(false);
    };
    reader.readAsText(file);
  }, [parseCsvText]);

  const handleCsvPaste = useCallback((text: string) => {
    setCsvFile(null);
    setCsvText(text);
  }, []);

  const handleParsePastedCsv = useCallback(() => {
    if (!csvText.trim()) {
      setError("Paste some CSV content first");
      return;
    }
    setParsing(true);
    parseCsvText(csvText);
  }, [csvText, parseCsvText]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleCsvFile(file);
    },
    [handleCsvFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const clearCsv = useCallback(() => {
    setCsvFile(null);
    setCsvText("");
    setParsedRows(null);
    setParseErrors([]);
    setCreatedCategories([]);
    setCreatedTags([]);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setImportProgress]);

  const switchCsvInputType = useCallback((type: CsvInputType) => {
    setCsvInputType(type);
    clearCsv();
  }, [clearCsv]);

  const switchMode = useCallback((newMode: InputMode) => {
    setMode(newMode);
    setResults(null);
    setError(null);
    setImportProgress(null);
  }, [setImportProgress]);

  const processBulkItems = useCallback(
    async (items: BulkItem[]): Promise<ImportResult[]> => {
      if (!user) return [];

      const token = await user.getIdToken(true);
      const out: ImportResult[] = [];
      let hasSetMetadata = false;

      for (let i = 0; i < items.length; i += CONCURRENCY) {
        const batch = items.slice(i, i + CONCURRENCY);
        setImportProgress({ current: Math.min(i + CONCURRENCY, items.length), total: items.length });

        const prepared = await Promise.all(
          batch.map(async (item) => {
            let width = 0;
            let height = 0;
            try {
              const dims = await detectImageDimensions(item.imageUrl);
              if (dims) {
                width = dims.width;
                height = dims.height;
              }
            } catch { /* fallback */ }
            return {
              imageUrl: item.imageUrl,
              title: item.title || titleFromUrl(item.imageUrl, ""),
              description: item.description,
              categoryId: item.categoryId,
              tags: item.tags,
              width,
              height,
            };
          })
        );

        try {
          const res = await fetch("/api/admin/bulk-import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: prepared }),
          });

          const data = await res.json();

          if (!res.ok) {
            for (const item of batch) {
              out.push({ url: item.imageUrl, status: "error", error: data.error || `HTTP ${res.status}` });
            }
            continue;
          }

          out.push(...data.results);

          if (!hasSetMetadata) {
            if (data.createdCategories?.length > 0) setCreatedCategories(data.createdCategories);
            if (data.createdTags?.length > 0) setCreatedTags(data.createdTags);
            hasSetMetadata = true;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          for (const item of batch) {
            out.push({ url: item.imageUrl, status: "error", error: msg });
          }
        }
      }

      setImportProgress(null);
      return out;
    },
    [user, setImportProgress]
  );

  const handleImport = useCallback(async () => {
    if (!user) return;

    let items: BulkItem[] = [];

    if (mode === "urls") {
      const lines = urls.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;
      items = lines.map((url, i) => ({
        imageUrl: url,
        title: "",
        description: "",
        categoryId: "abstract",
        tags: [],
        rowNumber: i + 1,
      }));
    } else {
      if (!parsedRows || parsedRows.length === 0) return;
      items = parsedRows;
    }

    setImporting(true);
    setError(null);
    setResults(null);

    const out = await processBulkItems(items);
    setResults(out);
    setImporting(false);
  }, [user, mode, urls, parsedRows, processBulkItems]);

  const previewRows = useMemo(() => {
    if (!parsedRows) return [];
    return parsedRows.slice(0, PREVIEW_ROW_LIMIT);
  }, [parsedRows]);

  const totalItems = mode === "urls"
    ? urls.split("\n").map((l) => l.trim()).filter(Boolean).length
    : parsedRows?.length ?? 0;

  const busy = importing || parsing;

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">
          Go home
        </Link>
      </div>
    );
  }

  const okCount = results?.filter((r) => r.status === "ok").length ?? 0;
  const dupCount = results?.filter((r) => r.status === "duplicate").length ?? 0;
  const errCount = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/studio/wallpapers"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Bulk Import</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-900/30 border border-amber-800/50">
          <p className="text-amber-200 text-sm font-medium mb-1">
            {parseErrors.length} warning{parseErrors.length === 1 ? "" : "s"}:
          </p>
          <ul className="space-y-0.5">
            {parseErrors.map((e, i) => (
              <li key={i} className="text-amber-300/80 text-xs">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="text-emerald-400">
              <CheckCircle2 size={14} className="inline mr-1" />
              {okCount} created
            </span>
            {dupCount > 0 && (
              <span className="text-amber-400">
                <AlertCircle size={14} className="inline mr-1" />
                {dupCount} duplicates
              </span>
            )}
            {errCount > 0 && (
              <span className="text-red-400">
                <AlertCircle size={14} className="inline mr-1" />
                {errCount} failed
              </span>
            )}
          </div>
          {(createdCategories.length > 0 || createdTags.length > 0) && (
            <div className="mb-3 text-xs text-zinc-500">
              {createdCategories.length > 0 && (
                <p>Auto-created categories: {createdCategories.join(", ")}</p>
              )}
              {createdTags.length > 0 && (
                <p>Auto-created tags: {createdTags.join(", ")}</p>
              )}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {r.status === "ok" ? (
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : r.status === "duplicate" ? (
                  <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-zinc-400 truncate block">{r.url}</span>
                  {r.status === "error" && r.error && (
                    <span className="text-red-400/80 block mt-0.5 break-words">{r.error}</span>
                  )}
                </div>
                {r.status === "ok" && (
                  <Link
                    href={`/studio/wallpapers/edit/${r.id}`}
                    className="text-amber-400 hover:text-amber-300 shrink-0 flex items-center gap-1"
                  >
                    <Eye size={10} />
                    Edit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit">
        <button
          onClick={() => switchMode("urls")}
          disabled={busy}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
            mode === "urls"
              ? "bg-amber-500/10 text-amber-400 font-medium"
              : busy ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Link2 size={14} />
          Paste URLs
        </button>
        <button
          onClick={() => switchMode("csv")}
          disabled={busy}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
            mode === "csv"
              ? "bg-amber-500/10 text-amber-400 font-medium"
              : busy ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FileSpreadsheet size={14} />
          CSV
        </button>
      </div>

      {mode === "urls" ? (
        /* URL input mode */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-sm text-zinc-300 font-medium mb-2 flex items-center gap-2">
              <Link2 size={14} className="text-amber-400" />
              How it works
            </p>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li>• Paste one image URL per line</li>
              <li>• Each URL creates a published wallpaper</li>
              <li>• Dimensions are auto-detected from the image</li>
              <li>• Title is derived from the filename (or auto-numbered)</li>
              <li>• Defaults to <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">abstract</code> category with no tags</li>
            </ul>
          </div>
          <textarea
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value);
              setResults(null);
            }}
            placeholder={`https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920
https://cdn.pixabay.com/photo/2023/01/01/10.jpg
https://raw.githubusercontent.com/user/repo/main/wallpapers/forest.jpg`}
            rows={12}
            disabled={busy}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono text-sm resize-none"
          />
          <button
            onClick={handleImport}
            disabled={busy || !urls.trim()}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Importing&hellip;
              </>
            ) : (
              <>
                <Upload size={18} /> Import {totalItems} URL{totalItems === 1 ? "" : "s"}
              </>
            )}
          </button>
        </div>
      ) : (
        /* CSV input mode */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-sm text-zinc-300 font-medium mb-2 flex items-center gap-2">
              <FileSpreadsheet size={14} className="text-amber-400" />
              How it works
            </p>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li>• Use an <strong>imageUrl</strong> column (required). Also supports: url, image_url, src, image</li>
              <li>• Optional columns: <strong>title</strong>, <strong>description</strong>, <strong>category</strong>, <strong>tags</strong></li>
              <li>• Tags are pipe-delimited: <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">blue|dark|car|linux</code></li>
              <li>• Missing categories are auto-created; missing tags are auto-created</li>
              <li>• Each row creates a published wallpaper with auto-detected dimensions</li>
            </ul>
          </div>

          {/* CSV sub-mode toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit">
            <button
              onClick={() => switchCsvInputType("file")}
              disabled={busy}
              className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all ${
                csvInputType === "file"
                  ? "bg-amber-500/10 text-amber-400 font-medium"
                  : busy ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText size={13} />
              Upload File
            </button>
            <button
              onClick={() => switchCsvInputType("paste")}
              disabled={busy}
              className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all ${
                csvInputType === "paste"
                  ? "bg-amber-500/10 text-amber-400 font-medium"
                  : busy ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileSpreadsheet size={13} />
              Paste CSV
            </button>
          </div>

          {csvInputType === "file" ? (
            !csvFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full px-4 py-12 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                }`}
              >
                <FileText size={32} className="mx-auto mb-3 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  Drag & drop a CSV file here, or click to browse
                </p>
                <p className="text-xs text-zinc-600 mt-1">Max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvFile(file);
                  }}
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet size={16} className="text-emerald-400" />
                    <span className="text-zinc-200">{csvFile.name}</span>
                    <span className="text-zinc-500">
                      ({(csvFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={clearCsv}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {parsing ? (
                  <div className="flex items-center justify-center py-6 text-zinc-500 text-sm">
                    <Loader2 size={16} className="animate-spin mr-2" /> Parsing CSV&hellip;
                  </div>
                ) : parsedRows && parsedRows.length > 0 ? (
                  <>
                    <p className="text-xs text-zinc-500 mb-3">
                      {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"} parsed
                      {parsedRows.length > PREVIEW_ROW_LIMIT &&
                        ` (showing first ${PREVIEW_ROW_LIMIT})`}
                    </p>
                    <TablePreview previewRows={previewRows} />
                  </>
                ) : null}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <textarea
                value={csvText}
                onChange={(e) => handleCsvPaste(e.target.value)}
                placeholder={`imageUrl,title,description,category,tags
https://example.com/sunset.jpg,Sunset Beach,A beautiful sunset on the coast,nature,beach|sunset|ocean
https://example.com/mountain.jpg,Mountain View,Scenic mountain landscape,nature,mountain|landscape|snow
https://example.com/car.jpg,,,vehicles,car|sports|red`}
                rows={10}
                disabled={busy}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono text-sm resize-none"
              />

              <button
                onClick={handleParsePastedCsv}
                disabled={busy || !csvText.trim()}
                className="w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                {parsing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Parsing&hellip;
                  </>
                ) : (
                  <>
                    <Play size={16} /> Parse CSV
                  </>
                )}
              </button>

              {parsing && (
                <div className="flex items-center justify-center py-4 text-zinc-500 text-sm">
                  <Loader2 size={16} className="animate-spin mr-2" /> Parsing CSV&hellip;
                </div>
              )}

              {!parsing && parsedRows && parsedRows.length > 0 && (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-3">
                    {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"} parsed
                    {parsedRows.length > PREVIEW_ROW_LIMIT &&
                      ` (showing first ${PREVIEW_ROW_LIMIT})`}
                  </p>
                  <TablePreview previewRows={previewRows} />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={busy || !parsedRows || parsedRows.length === 0}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Importing&hellip;
              </>
            ) : (
              <>
                <Upload size={18} /> Import {totalItems} wallpaper{totalItems === 1 ? "" : "s"}
                {totalItems > 0 && " from CSV"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
