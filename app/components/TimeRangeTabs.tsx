import Link from "next/link";
import type { TimeRange } from "@/lib/wallpaper-store-server";

const TABS: { label: string; value: TimeRange }[] = [
  { label: "24h", value: "24h" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "All Time", value: "all" },
];

export function TimeRangeTabs({
  basePath,
  current,
}: {
  basePath: string;
  current: TimeRange;
}) {
  return (
    <div className="flex gap-1 mb-6" role="tablist">
      {TABS.map(({ label, value }) => {
        const active = value === current;
        const href = value === "all" ? basePath : `${basePath}?time=${value}`;
        return (
          <Link
            key={value}
            href={href}
            role="tab"
            aria-selected={active}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
