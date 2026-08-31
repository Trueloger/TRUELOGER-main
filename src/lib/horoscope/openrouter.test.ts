// src/lib/horoscope/openrouter.test.ts
import assert from "node:assert/strict";
import { buildHoroscopePrompt } from "./openrouter.ts";
import { ZODIAC_ORDER, ZODIAC_META } from "./zodiac.ts";

const prompt = buildHoroscopePrompt("2026-09-01");

assert.ok(prompt.includes("2026-09-01"), "prompt must include the target date");
assert.ok(/JSON/.test(prompt), "prompt must instruct JSON-only output");

for (const slug of ZODIAC_ORDER) {
  assert.ok(
    prompt.includes(ZODIAC_META[slug].name),
    `prompt must mention ${ZODIAC_META[slug].name}`
  );
}

console.log("openrouter.test.ts: all assertions passed");
