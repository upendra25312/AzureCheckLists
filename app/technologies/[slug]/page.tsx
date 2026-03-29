import { notFound } from "next/navigation";
import { TechnologyPageView } from "@/components/technology-page-view";
import { readTechnologyIndex, readTechnologyPayload } from "@/lib/catalog";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const index = await readTechnologyIndex();

  return index.technologies.map((technology) => ({
    slug: technology.slug
  }));
}

export default async function TechnologyPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await readTechnologyPayload(slug);

  if (!payload) {
    notFound();
  }

  return <TechnologyPageView payload={payload} />;
}
