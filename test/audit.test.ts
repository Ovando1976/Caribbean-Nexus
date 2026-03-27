import test from "node:test";
import assert from "node:assert/strict";

import { generateDeterministicAudit } from "../lib/audit";
import type { BusinessRecord } from "../types/business";

function makeBusiness(overrides: Partial<BusinessRecord> = {}): BusinessRecord {
  return {
    id: "x1",
    name: "Mock Business",
    island: "st_thomas",
    category: "restaurant",
    status: "active",
    ...overrides,
  };
}

test("generateDeterministicAudit returns structured output", () => {
  const audit = generateDeterministicAudit(
    makeBusiness({
      website: "",
      digitalPresence: {
        hasWebsite: false,
        hasSocialPresence: false,
      },
      scores: {
        priorityScore: 75,
      },
    }),
  );

  assert.ok(typeof audit.summary === "string" && audit.summary.length > 0);
  assert.ok(Array.isArray(audit.strengths));
  assert.ok(Array.isArray(audit.weaknesses));
  assert.ok(Array.isArray(audit.opportunities));
  assert.ok(typeof audit.recommendedOffer === "string");
  assert.ok(typeof audit.recommendedMonthlyValue === "number");
});

test("generateDeterministicAudit suggests menu improvement for restaurant without menu", () => {
  const audit = generateDeterministicAudit(
    makeBusiness({
      category: "restaurant",
      digitalPresence: {
        hasWebsite: true,
        hasOnlineMenu: false,
      },
    }),
  );

  assert.ok(
    audit.opportunities?.some((item) => item.toLowerCase().includes("menu")),
    "Expected restaurant opportunity list to include menu improvement guidance",
  );
});
