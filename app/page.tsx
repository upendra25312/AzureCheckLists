import { DashboardHome } from "@/components/dashboard-home";
import { readSummary } from "@/lib/catalog";

export default async function HomePage() {
  const summary = await readSummary();

  return <DashboardHome summary={summary} />;
}
