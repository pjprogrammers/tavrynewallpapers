import { Loader2 } from "lucide-react";

export default function StudioLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2 text-zinc-400">
      <Loader2 size={24} className="animate-spin text-amber-500" />
      <p className="text-sm">Loading studio&hellip;</p>
    </div>
  );
}
