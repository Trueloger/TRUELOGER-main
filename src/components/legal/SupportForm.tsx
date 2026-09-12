"use client";

// src/components/legal/SupportForm.tsx
// One form component behind Contact, Grievance, and every order/
// report/meeting "Need help?" link — a `category` prop pins/hides the
// category selector, and orderId/reportId/meetingId props pre-fill
// (and lock) the relevant reference field so the user never has to
// type an ID they already gave the platform once.
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fieldLabelClass, fieldInputClass, fieldHintTextClass } from "@/components/forms/field-styles";
import { SUPPORT_CATEGORIES, type SupportCategory, type PrivacyRequestType } from "@/lib/support/types";

const PRIVACY_REQUEST_TYPES: { value: PrivacyRequestType; label: string }[] = [
  { value: "access", label: "Access my personal data" },
  { value: "correction", label: "Correct my personal data" },
  { value: "deletion", label: "Delete my personal data" },
  { value: "withdraw-consent", label: "Withdraw consent" },
  { value: "complaint", label: "Raise a privacy complaint" },
];

export function SupportForm({
  fixedCategory,
  defaultCategory,
  heading = "How can we help?",
  orderId,
  reportId,
  meetingId,
}: {
  /** When set, the category dropdown is hidden and this value is always
   * submitted — used by the Grievance page (always "grievance"). */
  fixedCategory?: SupportCategory;
  /** Pre-selects the category dropdown without hiding it — used when
   * arriving from an order/report/meeting "Need help?" link so the
   * category starts on the right value but the user can still change
   * it. */
  defaultCategory?: SupportCategory;
  heading?: string;
  orderId?: string;
  reportId?: string;
  meetingId?: string;
}) {
  const { currentUser, profile } = useAuth();
  const [name, setName] = useState(profile?.fullName ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [category, setCategory] = useState<SupportCategory>(fixedCategory ?? defaultCategory ?? "general");

  // Auth state resolves asynchronously after mount — fill name/email
  // once it's available rather than only at the initial (likely empty)
  // render.
  useEffect(() => {
    queueMicrotask(() => {
      if (profile?.fullName) setName((prev) => prev || profile.fullName);
      if (currentUser?.email) setEmail((prev) => prev || currentUser.email!);
    });
  }, [profile?.fullName, currentUser?.email]);
  const [privacyRequestType, setPrivacyRequestType] = useState<PrivacyRequestType>("access");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — never rendered visibly
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (message.trim().length < 10) return setError("Please write a slightly longer message (at least 10 characters).");

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category: fixedCategory ?? category,
          ...(category === "privacy" || fixedCategory === "privacy" ? { privacyRequestType } : {}),
          message: message.trim(),
          orderId,
          reportId,
          meetingId,
          website,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && data.error) || "Something went wrong submitting your request.");
        setSubmitting(false);
        return;
      }
      setTicketId(data.id);
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (ticketId) {
    return (
      <div className="rounded-2xl border border-nav-lavender-line bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-3 font-serif text-lg text-nav-violet">Request Received</h3>
        <p className="mt-1.5 text-sm text-nav-plum/75">
          Reference: <strong>{ticketId}</strong>. We&apos;ve emailed you a confirmation and aim to respond as promptly as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border border-nav-lavender-line bg-white p-5 sm:p-6">
      <h3 className="font-serif text-lg text-nav-plum">{heading}</h3>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Honeypot field — visually hidden, never seen by a real user;
          a filled value marks the submission as a bot (see the API
          route's own check). */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className={fieldLabelClass}>Name</label>
          <input id="support-name" value={name} onChange={(e) => setName(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
        </div>
        <div>
          <label htmlFor="support-email" className={fieldLabelClass}>Email</label>
          <input id="support-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
        </div>
      </div>

      {!fixedCategory && (
        <div>
          <label htmlFor="support-category" className={fieldLabelClass}>Category</label>
          <select
            id="support-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategory)}
            className={`mt-1.5 ${fieldInputClass}`}
          >
            {SUPPORT_CATEGORIES.filter((c) => c.value !== "grievance").map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {(category === "privacy" || fixedCategory === "privacy") && (
        <div>
          <label htmlFor="support-privacy-type" className={fieldLabelClass}>Type of request</label>
          <select
            id="support-privacy-type"
            value={privacyRequestType}
            onChange={(e) => setPrivacyRequestType(e.target.value as PrivacyRequestType)}
            className={`mt-1.5 ${fieldInputClass}`}
          >
            {PRIVACY_REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {(orderId || reportId || meetingId) && (
        <div className="flex flex-wrap gap-2 text-xs text-nav-plum/60">
          {orderId && <span className="rounded-full bg-nav-lavender-soft px-2.5 py-1">Order: {orderId}</span>}
          {reportId && <span className="rounded-full bg-nav-lavender-soft px-2.5 py-1">Report: {reportId}</span>}
          {meetingId && <span className="rounded-full bg-nav-lavender-soft px-2.5 py-1">Meeting: {meetingId}</span>}
        </div>
      )}

      <div>
        <label htmlFor="support-message" className={fieldLabelClass}>Message</label>
        <textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Tell us what's going on…"
          className={`mt-1.5 ${fieldInputClass} min-h-32 resize-y`}
        />
        <p className={fieldHintTextClass}>{message.length}/5000</p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
