import assert from "node:assert/strict";
import { ZODIAC_ORDER, ZODIAC_META, isZodiacSlug } from "./zodiac.ts";

assert.strictEqual(ZODIAC_ORDER.length, 12, "must have exactly 12 signs");
assert.deepStrictEqual(ZODIAC_ORDER, [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);

for (const slug of ZODIAC_ORDER) {
  const meta = ZODIAC_META[slug];
  assert.ok(meta, `missing meta for ${slug}`);
  assert.strictEqual(meta.slug, slug);
  assert.ok(meta.name.length > 0, `${slug} missing name`);
  assert.ok(meta.dateRange.length > 0, `${slug} missing dateRange`);
  assert.ok(
    ["Fire", "Earth", "Air", "Water"].includes(meta.element),
    `${slug} has invalid element`
  );
}

assert.strictEqual(isZodiacSlug("aries"), true);
assert.strictEqual(isZodiacSlug("pisces"), true);
assert.strictEqual(isZodiacSlug("dragon"), false);
assert.strictEqual(isZodiacSlug(""), false);

console.log("zodiac.test.ts: all assertions passed");
