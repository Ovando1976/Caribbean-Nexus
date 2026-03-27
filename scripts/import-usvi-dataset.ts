import fs from "node:fs/promises";
import path from "node:path";
import { bulkUpsertBusinesses } from "../lib/firebase/usvi-businesses";

const INPUT_PATH = path.resolve(
  "data/processed/usvi-businesses-normalized.json"
);

async function main() {
  const text = await fs.readFile(INPUT_PATH, "utf8");
  const businesses = JSON.parse(text);

  if (!Array.isArray(businesses)) {
    throw new Error("Processed dataset must be an array.");
  }

  await bulkUpsertBusinesses(businesses);

  console.log(`Imported ${businesses.length} businesses into Firestore.`);
}

main().catch((error) => {
  console.error("Failed to import processed dataset.");
  console.error(error);
  process.exit(1);
});
