# Legal Review Required Before Production Publication

**Internal document — not shown publicly, not linked from any page.** The
Legal/Company/Help/Support/Policy/Trust section built into this app (About,
Contact, Help, FAQ, Privacy Policy, Privacy & Security, Terms & Conditions,
Refund & Cancellation, Shipping & Delivery, Payment & Billing, Disclaimer,
Cookie Policy, Data Deletion, Grievance, Accessibility, Astrologer Terms) is
technically complete and describes TrueLoger's actual implemented
functionality, but it has **not** been reviewed by qualified Indian legal
counsel. Do not represent any of these pages as final, binding, or legally
compliant until every item below is resolved.

## Business / legal identity (centralized in `src/lib/policy/config.ts`)

- [ ] Real legal entity name (`BUSINESS_INFO.entityName`)
- [ ] Entity type — company / proprietorship / LLP, etc. (`BUSINESS_INFO.entityType`)
- [ ] Registered office address (`BUSINESS_INFO.registeredAddress`)
- [ ] GSTIN (`BUSINESS_INFO.gstin`)
- [ ] Grievance Officer name and designation (`BUSINESS_INFO.grievanceOfficer`)
- [ ] Jurisdiction city/state for governing-law and arbitration-seat clauses (`BUSINESS_INFO.jurisdictionCity` / `jurisdictionState` / `arbitrationSeat`)
- [ ] Real support email/phone/WhatsApp number (`src/components/footer/footer-data.ts`'s `FOOTER_CONTACT` — currently placeholder values)

## Legal-review items flagged inline in the app

- [ ] **Astrologer commercial terms** (`/astrologer-terms`) — commission percentages and payout schedule are explicitly not filled in.
- [ ] **Data retention periods** (`/privacy-policy`, `/data-deletion`) — exact retention windows for order/payment/report/support records need confirmation against actual accounting/tax-law requirements, not the general "retained for accounting/tax purposes" language currently used.
- [ ] **AI provider (OpenRouter/Claude) data-retention terms** (`/privacy-policy` § 4) — this project has not independently verified OpenRouter's/Anthropic's current data-retention practices for API requests; confirm against their current terms before making any retention claim.
- [ ] **DPDP Act/Rules applicability & phased commencement** — the Digital Personal Data Protection Rules, 2025 include phased-commencement provisions; confirm which specific obligations are currently in force for this business at the time of review, rather than assuming full applicability.
- [ ] **Consumer Protection (E-Commerce) Rules disclosures** — confirm which specific disclosure obligations apply to TrueLoger's actual business model (not every marketplace-specific requirement necessarily applies).
- [ ] **CERT-In obligations** — confirm which incident-reporting/log-retention directions actually apply to this application's architecture and hosting setup.
- [ ] **Refund/cancellation windows per category** (`/refund-cancellation`) — the specific hour/day windows used (24hr consultations, 48hr Puja, 7-day gemstones, 3-day courses) are commercially reasonable drafting choices, not values derived from a signed business policy; confirm they match actual business intent before publishing as binding.

## General

- [ ] Confirm no page anywhere claims blanket legal compliance (e.g. "TrueLoger complies with all applicable Indian laws") — none currently does; keep it that way.
- [ ] Confirm no page claims a certification (ISO, PCI-DSS, SOC 2, WCAG, DPDP-compliant, etc.) that has not actually been obtained — none currently does.
- [ ] Final proofread of all policy pages by qualified counsel before removing this checklist's relevance.

---
Last generated: 13 September 2026, alongside the initial build of this section.
