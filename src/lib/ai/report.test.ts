// src/lib/ai/report.test.ts
import assert from "node:assert/strict";
import { buildReportPrompt, isValidStructuredReport } from "./report.ts";

const prompt = buildReportPrompt("numerology", { lifePathNumber: 7 }, "Cover life path.");
assert.ok(prompt.includes("numerology"), "prompt must include the tool name");
assert.ok(prompt.includes('"lifePathNumber": 7'), "prompt must include the real calculated data");
assert.ok(/JSON/.test(prompt), "prompt must instruct JSON-only output");
assert.ok(/guaranteed/i.test(prompt), "prompt must bake in the no-guaranteed-outcomes safety rule");
assert.ok(prompt.includes("Cover life path."), "prompt must include the tool-specific instructions");

const goodReport = {
  summary: "A grounded overview of the reading.",
  sections: [{ title: "Life Path", content: "This number traditionally suggests..." }],
  highlights: ["A steady year ahead"],
  recommendations: ["Take time to reflect"],
};

assert.strictEqual(isValidStructuredReport(goodReport), true);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, summary: "" }),
  false,
  "empty summary must fail"
);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, sections: [] }),
  false,
  "empty sections array must fail"
);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, sections: [{ title: "Only title" }] }),
  false,
  "section missing content must fail"
);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, highlights: "not an array" }),
  false,
  "highlights must be an array"
);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, recommendations: [1, 2] }),
  false,
  "recommendations entries must be strings"
);
assert.strictEqual(
  isValidStructuredReport({ ...goodReport, highlights: [], recommendations: [] }),
  true,
  "empty highlights/recommendations arrays are valid"
);
assert.strictEqual(isValidStructuredReport(null), false);
assert.strictEqual(isValidStructuredReport("not an object"), false);

console.log("report.test.ts: all assertions passed");
