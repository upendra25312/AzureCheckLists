import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/service-page-view";
import { readServiceIndex, readServicePayload } from "@/lib/catalog";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const index = await readServiceIndex();

  return index.services.map((service) => ({
    slug: service.slug
  }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await readServicePayload(slug);

  if (!payload) {
    notFound();
  }

  return <ServicePageView payload={payload} />;
}
