"use client";

import "@/lib/app-check";

if (process.env.NODE_ENV === "development") {
  import("@/lib/app-check.dev");
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
