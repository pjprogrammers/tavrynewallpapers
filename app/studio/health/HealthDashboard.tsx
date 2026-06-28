"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ImageIcon,
  Layers,
  Tag,
  Copy,
  FileText,
  Search,
  ExternalLink,
  Download,
} from "lucide-react";
import type { HealthReport } from "@/lib/health-check-server";

interface Props {
  report: HealthReport;
}

export default function HealthDashboard({ report }: Props) {
  return (
    <div className="space-y-8">
      <Header report={report} />
      <CountsCard counts={report.counts} />
      <CategoryHealthCard health={report.categoryHealth} />
      <TagHealthCard health={report.tagHealth} />
      <DuplicatesCard duplicates={report.duplicates} />
      <BrokenImageCard wallpapers={report.wallpapers} />
    </div>
  );
}

function Header({ report }: { report: HealthReport }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <ExportButton format="json" report={report} />
        <ExportButton format="csv" report={report} />
      </div>
    </div>
  );
}

function ExportButton({ format, report }: { format: "json" | "csv"; report: HealthReport }) {
  return (
    <button
      onClick={() => (format === "json" ? downloadJson(report) : downloadCsv(report))}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 transition-all text-xs"
    >
      <Download size={12} />
      Export {format.toUpperCase()}
    </button>
  );
}

/* --------------------------------------------------
   Counts
   -------------------------------------------------- */

function CountsCard({ counts }: { counts: HealthReport["counts"] }) {
  const items = [
    { label: "Published", value: counts.published, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Drafts", value: counts.drafts, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Deleted", value: counts.deleted, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Featured", value: counts.featured, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Trending", value: counts.trending, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "Total", value: counts.total, color: "text-zinc-300", bg: "bg-zinc-500/10" },
  ];

  return (
    <Card title="Counts" icon={<FileText size={16} />}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl p-4 text-center border border-zinc-800`}
          >
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --------------------------------------------------
   Category Health
   -------------------------------------------------- */

function CategoryHealthCard({ health }: { health: HealthReport["categoryHealth"] }) {
  const hasIssues = health.orphaned.length > 0 || health.missing.length > 0;

  const topUsage = health.usage.slice(0, 10);

  return (
    <Card
      title="Category Health"
      icon={<Layers size={16} />}
      status={hasIssues ? "warning" : "ok"}
    >
      <div className="text-sm text-zinc-400 mb-4">
        {health.total} categor{health.total === 1 ? "y" : "ies"} total
      </div>

      {topUsage.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-2">Top Categories by Usage</div>
          <div className="flex flex-wrap gap-1.5">
            {topUsage.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-300"
              >
                {u.name}
                <span className="text-zinc-500">({u.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {health.orphaned.length > 0 && (
        <Section label="Orphaned Categories" count={health.orphaned.length} variant="warning">
          {health.orphaned.map((c) => (
            <Item key={c.id} id={c.id} name={c.name} issue="no wallpapers" />
          ))}
        </Section>
      )}
      {health.orphaned.length === 0 && <OkMsg text="No orphaned categories" />}

      {health.missing.length > 0 && (
        <Section label="Missing Category References" count={health.missing.length} variant="error">
          {health.missing.map((m, i) => (
            <Item
              key={i}
              id={m.categoryId}
              name={m.categoryId}
              issue={`wallpaper "${m.wallpaperTitle}"`}
              editHref={`/studio/wallpapers/edit/${m.wallpaperId}`}
            />
          ))}
        </Section>
      )}
      {health.missing.length === 0 && <OkMsg text="No missing category references" />}
    </Card>
  );
}

/* --------------------------------------------------
   Tag Health
   -------------------------------------------------- */

function TagHealthCard({ health }: { health: HealthReport["tagHealth"] }) {
  const hasIssues = health.orphaned.length > 0 || health.missing.length > 0;

  const missingGrouped = new Map<string, { tagId: string; count: number; wallpapers: { title: string; id: string }[] }>();
  for (const m of health.missing) {
    const existing = missingGrouped.get(m.tagId) ?? { tagId: m.tagId, count: 0, wallpapers: [] };
    existing.count++;
    existing.wallpapers.push({ title: m.wallpaperTitle, id: m.wallpaperId });
    missingGrouped.set(m.tagId, existing);
  }

  const topUsage = health.usage.slice(0, 10);

  return (
    <Card
      title="Tag Health"
      icon={<Tag size={16} />}
      status={hasIssues ? "warning" : "ok"}
    >
      <div className="text-sm text-zinc-400 mb-4">
        {health.total} tag{health.total === 1 ? "" : "s"} total
      </div>

      {topUsage.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-2">Top Tags by Usage</div>
          <div className="flex flex-wrap gap-1.5">
            {topUsage.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-300"
              >
                {u.name}
                <span className="text-zinc-500">({u.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {health.orphaned.length > 0 && (
        <Section label="Orphaned Tags" count={health.orphaned.length} variant="warning">
          {health.orphaned.map((t) => (
            <Item key={t.id} id={t.id} name={t.name} issue="no wallpapers" />
          ))}
        </Section>
      )}
      {health.orphaned.length === 0 && <OkMsg text="No orphaned tags" />}

      {missingGrouped.size > 0 && (
        <Section label="Missing Tag References" count={missingGrouped.size} variant="error">
          {Array.from(missingGrouped.values()).map((m) => (
            <div key={m.tagId} className="mb-2">
              <Item key={m.tagId} id={m.tagId} name={m.tagId} issue={`referenced by ${m.count} wallpaper${m.count === 1 ? "" : "s"}`} />
              <div className="ml-4 mt-1 space-y-0.5">
                {m.wallpapers.map((wp) => (
                  <Item
                    key={wp.id}
                    id={wp.id}
                    name={wp.title}
                    issue=""
                    editHref={`/studio/wallpapers/edit/${wp.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
      {missingGrouped.size === 0 && <OkMsg text="No missing tag references" />}
    </Card>
  );
}

/* --------------------------------------------------
   Duplicates
   -------------------------------------------------- */

function DuplicatesCard({ duplicates }: { duplicates: HealthReport["duplicates"] }) {
  const hasIssues = duplicates.titles.length > 0 || duplicates.imageUrls.length > 0;
  return (
    <Card
      title="Duplicates"
      icon={<Copy size={16} />}
      status={hasIssues ? "warning" : "ok"}
    >
      {duplicates.titles.length > 0 && (
        <Section label="Duplicate Titles" count={duplicates.titles.length} variant="warning">
          {duplicates.titles.map((d, i) => (
            <Item key={i} id={d.ids.join(", ")} name={d.title} issue={`${d.ids.length} wallpapers`} />
          ))}
        </Section>
      )}
      {duplicates.titles.length === 0 && <OkMsg text="No duplicate titles" />}

      {duplicates.imageUrls.length > 0 && (
        <Section label="Duplicate Image URLs" count={duplicates.imageUrls.length} variant="warning">
          {duplicates.imageUrls.map((d, i) => (
            <Item key={i} id={d.ids.join(", ")} name={d.url} issue={`${d.ids.length} wallpapers`} />
          ))}
        </Section>
      )}
      {duplicates.imageUrls.length === 0 && <OkMsg text="No duplicate image URLs" />}
    </Card>
  );
}

/* --------------------------------------------------
   Helpers
   -------------------------------------------------- */

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("load failed"));
    img.src = url;
  });
}

function downloadJson(data: HealthReport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `health-report-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(data: HealthReport) {
  const rows: string[][] = [];
  rows.push(["Section", "Detail", "Value"]);

  rows.push(["Counts", "Published", String(data.counts.published)]);
  rows.push(["Counts", "Drafts", String(data.counts.drafts)]);
  rows.push(["Counts", "Deleted", String(data.counts.deleted)]);
  rows.push(["Counts", "Featured", String(data.counts.featured)]);
  rows.push(["Counts", "Trending", String(data.counts.trending)]);
  rows.push(["Counts", "Total", String(data.counts.total)]);

  for (const m of data.categoryHealth.missing) {
    rows.push(["Missing Category", m.wallpaperTitle, m.categoryId]);
  }
  for (const o of data.categoryHealth.orphaned) {
    rows.push(["Orphaned Category", o.name, "0 wallpapers"]);
  }
  for (const m of data.tagHealth.missing) {
    rows.push(["Missing Tag", m.wallpaperTitle, m.tagId]);
  }
  for (const o of data.tagHealth.orphaned) {
    rows.push(["Orphaned Tag", o.name, "0 wallpapers"]);
  }
  for (const d of data.duplicates.titles) {
    rows.push(["Duplicate Title", d.title, d.ids.join(", ")]);
  }
  for (const d of data.duplicates.imageUrls) {
    rows.push(["Duplicate Image URL", d.url, d.ids.join(", ")]);
  }

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `health-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------------------------------------------
   Broken Image Checker
   -------------------------------------------------- */

interface BrokenResult {
  message: string;
  severity: "error" | "warning";
}

function BrokenImageCard({ wallpapers }: { wallpapers: HealthReport["wallpapers"] }) {
  const [broken, setBroken] = useState<BrokenResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const check = useCallback(async () => {
    setChecking(true);
    setBroken([]);
    setProgress(0);
    const results: BrokenResult[] = [];
    const total = wallpapers.length;
    const BATCH = 5;

    for (let i = 0; i < total && mountedRef.current; i += BATCH) {
      const batch = wallpapers.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        batch.map(async (w) => {
          if (!w.imageUrl) {
            return { message: `"${w.title}" (${w.id}) – no URL`, severity: "error" as const };
          }
          try {
            const res = await fetch(`/api/health/https?url=${encodeURIComponent(w.imageUrl)}`, {
              signal: AbortSignal.timeout(5000),
            });
            const data = await res.json();
            if (data.ok) {
              try {
                const dims = await getImageDimensions(w.imageUrl);
                if (dims.width === 0 || dims.height === 0) {
                  return { message: `"${w.title}" (${w.id}) – zero dimensions`, severity: "warning" as const };
                }
              } catch {
                return { message: `"${w.title}" (${w.id}) – unreachable`, severity: "error" as const };
              }
            } else {
              return { message: `"${w.title}" (${w.id}) – HTTP ${data.status}`, severity: "error" as const };
            }
          } catch {
            return { message: `"${w.title}" (${w.id}) – fetch failed`, severity: "error" as const };
          }
          return null;
        })
      );
      const filtered = batchResults.filter((r): r is NonNullable<typeof r> => r !== null);
      results.push(...filtered);
      setProgress(Math.min(i + BATCH, total));
    }

    if (mountedRef.current) {
      setBroken(results);
      setChecking(false);
    }
  }, [wallpapers]);

  const allOk = broken.length === 0 && !checking && progress > 0;
  const errors = broken.filter((b) => b.severity === "error");
  const warnings = broken.filter((b) => b.severity === "warning");

  return (
    <Card
      title="Image Health"
      icon={<ImageIcon size={16} />}
      status={errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : allOk ? "ok" : undefined}
    >
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={check}
          disabled={checking}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50 text-sm"
        >
          {checking ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Checking {progress}/{wallpapers.length}...
            </>
          ) : (
            <>
              <Search size={14} />
              Check {wallpapers.length} Image{wallpapers.length === 1 ? "" : "s"}
            </>
          )}
        </button>
        {allOk && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 size={14} />
            All images OK
          </span>
        )}
        {progress > 0 && !checking && (
          <span className="text-xs text-zinc-500">
            {broken.length === 0
              ? "All reachable with valid dimensions"
              : `${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      {checking && (
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-200 rounded-full"
            style={{ width: `${wallpapers.length > 0 ? (progress / wallpapers.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {errors.length > 0 && (
        <Section label={`${errors.length} Broken Image${errors.length === 1 ? "" : "s"}`} count={errors.length} variant="error">
          {errors.map((b, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <XCircle size={12} className="text-red-400 shrink-0" />
              <span className="text-xs text-zinc-400 truncate">{b.message}</span>
            </div>
          ))}
        </Section>
      )}

      {warnings.length > 0 && (
        <Section label={`${warnings.length} Dimension Warning${warnings.length === 1 ? "" : "s"}`} count={warnings.length} variant="warning">
          {warnings.map((b, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
              <span className="text-xs text-zinc-400 truncate">{b.message}</span>
            </div>
          ))}
        </Section>
      )}
    </Card>
  );
}

/* --------------------------------------------------
   Shared UI Primitives
   -------------------------------------------------- */

function Card({
  title,
  icon,
  children,
  status,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  status?: "ok" | "warning" | "error";
}) {
  const statusIcon =
    status === "error" ? (
      <XCircle size={14} className="text-red-400" />
    ) : status === "warning" ? (
      <AlertTriangle size={14} className="text-amber-400" />
    ) : status === "ok" ? (
      <CheckCircle2 size={14} className="text-emerald-400" />
    ) : null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-amber-500">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {statusIcon}
      </div>
      {children}
    </div>
  );
}

function Section({
  label,
  count,
  variant,
  children,
}: {
  label: string;
  count: number;
  variant: "warning" | "error";
  children: React.ReactNode;
}) {
  const color = variant === "error" ? "text-red-400" : "text-amber-400";
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-center gap-2 mb-2">
        {variant === "error" ? (
          <XCircle size={14} className={color} />
        ) : (
          <AlertTriangle size={14} className={color} />
        )}
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <span className={`text-xs ${color} opacity-60`}>({count})</span>
      </div>
      <div className="space-y-0.5 pl-5">{children}</div>
    </div>
  );
}

function OkMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
      <span className="text-xs text-zinc-500">{text}</span>
    </div>
  );
}

function Item({ id, name, issue, editHref }: { id: string; name: string; issue: string; editHref?: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 group">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
      <span className="text-xs text-zinc-400 truncate">{name}</span>
      <span className="text-[10px] text-zinc-600 shrink-0">— {issue}</span>
      {editHref && (
        <a
          href={editHref}
          className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
        >
          <ExternalLink size={10} />
          Edit
        </a>
      )}
    </div>
  );
}
