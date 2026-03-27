import test from "node:test";
import assert from "node:assert/strict";

import { USVI_SEED_BUSINESSES } from "../data/usvi-seed-businesses";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

test("seed data has required minimum shape", () => {
  assert.ok(USVI_SEED_BUSINESSES.length >= 10, "Expected at least 10 seed businesses");

  for (const entry of USVI_SEED_BUSINESSES) {
    assert.ok(entry.name.trim().length > 0, "Seed business name should be non-empty");
    assert.ok(entry.island, "Seed business island is required");
    assert.ok(entry.category, "Seed business category is required");
    assert.ok(entry.status, "Seed business status is required");
  }
});

test("seed data generates unique deterministic slugs", () => {
  const ids = USVI_SEED_BUSINESSES.map((entry) => slugify(`${entry.island}-${entry.name}`));
  const uniqueCount = new Set(ids).size;

  assert.equal(uniqueCount, ids.length, "Expected seed slugs to be unique");
});
