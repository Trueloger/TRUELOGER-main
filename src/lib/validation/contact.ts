// src/lib/validation/contact.ts
// Shared client+server field validators — imported by both
// src/app/register-as-astrologer/page.tsx (client UX) and
// src/app/api/astrologer-applications/route.ts (the real gate), so the
// two never drift apart. Server trusts nothing from the client; these
// functions exist so both sides apply the identical rule.

// Domain must end in a letters-only TLD of 2+ characters — this is the
// piece a bare `[^\s@]+\.[^\s@]+` check misses, and it's exactly what
// lets something like "123@11.11" through: a numeric "TLD" structurally
// satisfies "something, dot, something" but is not a real domain.
const EMAIL_DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const match = /^([^\s@]+)@([^\s@]+)$/.exec(v);
  if (!match) return false;
  const [, local, domain] = match;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return EMAIL_DOMAIN_RE.test(domain);
}

// Loose, intentionally international check — 7 to 15 digits (the E.164
// range) after stripping spaces/hyphens/parens and an optional leading
// "+", not a country-specific pattern. This is a job-application form,
// not a payment flow, so it only needs to catch obviously-malformed
// input, not enforce one country's dialing format.
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const stripped = v.replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(stripped);
}

// Optional-field URL check (qualifications/social-profile links): if
// given, must parse as an absolute URL once a missing "https://" is
// assumed, and must have a dotted host — rejects "not a url" while
// accepting bare domains like "linkedin.com/in/name".
export function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true; // optional field — empty is valid, required-ness is checked separately
  const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}
