import { promises as fs } from "node:fs";
import path from "node:path";
import type { CatalogSummary, TechnologyIndex, TechnologyPayload } from "@/types";

async function readJsonFile<T>(segments: string[]) {
  const filePath = path.join(process.cwd(), ...segments);
  const contents = await fs.readFile(filePath, "utf8");

  return JSON.parse(contents) as T;
}

export async function readSummary() {
  return readJsonFile<CatalogSummary>(["public", "data", "summary.json"]);
}

export async function readTechnologyIndex() {
  return readJsonFile<TechnologyIndex>(["public", "data", "technology-index.json"]);
}

export async function readTechnologyPayload(slug: string) {
  try {
    return await readJsonFile<TechnologyPayload>([
      "public",
      "data",
      "technologies",
      `${slug}.json`
    ]);
  } catch {
    return null;
  }
}
