import { DashboardHome } from "@/components/dashboard-home";
import { readServiceIndex, readSummary } from "@/lib/catalog";

export default async function HomePage() {
  const [summary, serviceIndex] = await Promise.all([readSummary(), readServiceIndex()]);

  return <DashboardHome summary={summary} serviceIndex={serviceIndex} />;
}
