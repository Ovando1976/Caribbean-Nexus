import { USVI_SEED_BUSINESSES } from "../data/usvi-seed-businesses";
import { bulkUpsertBusinesses } from "../lib/firebase/usvi-businesses";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function validateSeedData() {
  const seen = new Set<string>();

  for (const business of USVI_SEED_BUSINESSES) {
    if (!business.name.trim()) {
      throw new Error("Seed dataset contains an entry with an empty name.");
    }

    const id = slugify(`${business.island}-${business.name}`);
    if (seen.has(id)) {
      throw new Error(`Seed dataset contains a duplicate slug/id: ${id}`);
    }

    seen.add(id);
  }
}

async function seedBusinesses() {
  validateSeedData();

  if (process.argv.includes("--dry-run")) {
    console.log("Dry run only: no Firestore writes performed.");
    console.log(`Validated records: ${USVI_SEED_BUSINESSES.length}`);
    console.log(
      `Sample IDs: ${USVI_SEED_BUSINESSES.slice(0, 3).map((b) => slugify(`${b.island}-${b.name}`)).join(", ")}`,
    );
    return;
  }

  await bulkUpsertBusinesses(USVI_SEED_BUSINESSES);

  console.log("");
  console.log("Seed complete.");
  console.log(`Total processed: ${USVI_SEED_BUSINESSES.length}`);
}

seedBusinesses().catch((error) => {
  console.error("Failed to seed usviBusinesses collection.");
  console.error(error);
  process.exit(1);
});
