import { ServicesDirectory } from "@/components/services-directory";
import { readServiceIndex } from "@/lib/catalog";

export default async function ServicesPage() {
  const index = await readServiceIndex();

  return <ServicesDirectory index={index} />;
}
