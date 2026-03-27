import fs from "node:fs/promises";
import path from "node:path";
import type { BusinessInput } from "../types/business";
import { enrichBusinessInput } from "../lib/business-enrich";

const RAW_PATH = path.resolve("data/raw/usvi-businesses-manual.json");
const OUT_PATH = path.resolve("data/processed/usvi-businesses-normalized.json");

function ensureArray(value: unknown): BusinessInput[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected raw dataset to be an array.");
  }
  return value as BusinessInput[];
}

async function main() {
  const rawText = await fs.readFile(RAW_PATH, "utf8");
  const rawJson = JSON.parse(rawText);
  const rawBusinesses = ensureArray(rawJson);

  const enriched = rawBusinesses.map(enrichBusinessInput);

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(enriched, null, 2), "utf8");

  console.log(`Built normalized dataset: ${enriched.length} businesses`);
  console.log(`Output: ${OUT_PATH}`);
}

main().catch((error) => {
  console.error("Failed to build dataset.");
  console.error(error);
  process.exit(1);
});
