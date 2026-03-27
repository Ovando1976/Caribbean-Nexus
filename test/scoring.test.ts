import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCloseLikelihoodScore,
  calculatePainPointScore,
  calculatePriorityScore,
  estimatePipelineValue,
  scoreBusiness,
} from "../lib/scoring";
import type { BusinessRecord } from "../types/business";

function makeBusiness(overrides: Partial<BusinessRecord> = {}): BusinessRecord {
  return {
    id: "b1",
    name: "Harbor Bistro",
    island: "st_thomas",
    category: "restaurant",
    status: "active",
    pipelineStage: "discovered",
    ...overrides,
  };
}

test("scoreBusiness returns bounded, deterministic scores", () => {
  const business = makeBusiness({
    website: "https://harborbistro.com",
    phone: "340-555-0100",
    social: { instagram: "@harborbistro" },
    reviewMetrics: { reviewCount: 83, rating: 4.6 },
    digitalPresence: {
      hasOnlineMenu: true,
      hasOnlineOrdering: false,
      hasOnlineBooking: false,
      hasRecentSocialActivity: true,
      hasGoogleBusinessProfile: true,
    },
  });

  const scores = scoreBusiness(business);

  for (const value of Object.values(scores)) {
    assert.ok(value >= 0 && value <= 100, `Expected score to be 0..100 but got ${value}`);
  }

  assert.equal(scores.priorityScore, calculatePriorityScore({ ...scores, priorityScore: 0 }));
});

test("pain point score increases when key channels are missing", () => {
  const richPresence = makeBusiness({
    website: "https://example.com",
    phone: "340-555-0199",
    digitalPresence: {
      hasWebsite: true,
      hasSocialPresence: true,
      hasGoogleBusinessProfile: true,
      hasOnlineMenu: true,
      hasOnlineOrdering: true,
      hasOnlineBooking: true,
    },
  });

  const weakPresence = makeBusiness({
    website: "",
    phone: "",
    email: "",
    digitalPresence: {
      hasWebsite: false,
      hasSocialPresence: false,
      hasGoogleBusinessProfile: false,
      hasOnlineMenu: false,
      hasOnlineOrdering: false,
      hasOnlineBooking: false,
    },
  });

  assert.ok(
    calculatePainPointScore(weakPresence) > calculatePainPointScore(richPresence),
    "Expected weak digital presence to produce a higher pain point score",
  );
});

test("close likelihood honors terminal pipeline stages", () => {
  const won = makeBusiness({ pipelineStage: "won", status: "active" });
  const lost = makeBusiness({ pipelineStage: "lost", status: "active" });

  assert.equal(calculateCloseLikelihoodScore(won), 100);
  assert.equal(calculateCloseLikelihoodScore(lost), 0);
});

test("estimatePipelineValue drops lost deals to zero", () => {
  const won = makeBusiness({ pipelineStage: "won", scores: { priorityScore: 80 } });
  const lost = makeBusiness({ pipelineStage: "lost", scores: { priorityScore: 80 } });

  assert.equal(estimatePipelineValue(lost), 0);
  assert.ok(estimatePipelineValue(won) > 0);
});
