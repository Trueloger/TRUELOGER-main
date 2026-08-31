import assert from "node:assert/strict";
import { isValidSignReading, validateGeneratedSet } from "./validate.ts";
import { ZODIAC_ORDER } from "./zodiac.ts";

const goodReading = {
  overview: "A day of clarity and forward motion.",
  love: "Warmth returns to a close relationship.",
  career: "A well-timed idea earns notice.",
  finance: "Steady, no impulsive spending today.",
  health: "Good energy; a short walk helps focus.",
  luckyNumber: 7,
  luckyColor: "Indigo",
  theme: "Clarity in motion",
};

assert.strictEqual(isValidSignReading(goodReading), true);
assert.strictEqual(isValidSignReading({ ...goodReading, luckyNumber: "7" }), false, "luckyNumber must be a number");
assert.strictEqual(isValidSignReading({ ...goodReading, overview: "" }), false, "empty string field must fail");
assert.strictEqual(isValidSignReading({ ...goodReading, love: undefined }), false, "missing required field must fail");
assert.strictEqual(isValidSignReading(null), false);
assert.strictEqual(isValidSignReading("not an object"), false);
assert.strictEqual(
  isValidSignReading({ ...goodReading, mood: "Bright", compatibility: "Pairs well with Leo" }),
  true,
  "optional fields, when present as strings, must pass"
);
assert.strictEqual(isValidSignReading({ ...goodReading, mood: 5 }), false, "optional field with wrong type must fail");

const fullSet: Record<string, unknown> = {};
for (const slug of ZODIAC_ORDER) fullSet[slug] = goodReading;
assert.ok(validateGeneratedSet(fullSet), "a complete, valid 12-sign set must validate");
assert.strictEqual(Object.keys(validateGeneratedSet(fullSet)!).length, 12);

const missingOne: Record<string, unknown> = { ...fullSet };
delete missingOne[ZODIAC_ORDER[0]];
assert.strictEqual(validateGeneratedSet(missingOne), null, "a set missing one sign must fail");

const oneBad: Record<string, unknown> = { ...fullSet, [ZODIAC_ORDER[1]]: { bad: true } };
assert.strictEqual(validateGeneratedSet(oneBad), null, "a set with one malformed sign must fail");

assert.strictEqual(validateGeneratedSet(null), null);
assert.strictEqual(validateGeneratedSet("nope"), null);

console.log("validate.test.ts: all assertions passed");
