import { getHealthReport } from "@/lib/health-check-server";
import HealthDashboard from "./HealthDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Health Dashboard | Studio | Tavryne Wallpapers",
  robots: { index: false, follow: false } as const,
};

export default async function HealthPage() {
  const report = await getHealthReport();
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <HealthDashboard report={report} />
    </div>
  );
}
