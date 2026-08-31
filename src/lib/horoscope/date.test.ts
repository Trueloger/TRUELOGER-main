import assert from "node:assert/strict";
import { getTodayIST } from "./date.ts";

// IST = UTC+5:30, so IST midnight on 2026-09-01 is 2026-08-31T18:30:00Z.
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T18:29:00.000Z")),
  "2026-08-31",
  "one minute before IST midnight is still the previous IST day"
);
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T18:30:00.000Z")),
  "2026-09-01",
  "exactly at IST midnight rolls to the next IST day"
);
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T12:00:00.000Z")),
  "2026-08-31",
  "midday UTC is mid-evening IST, same calendar day"
);
assert.strictEqual(getTodayIST(new Date("2026-01-01T00:00:00.000Z")), "2026-01-01");

console.log("date.test.ts: all assertions passed");
