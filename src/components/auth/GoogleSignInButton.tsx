"use client";

// src/components/auth/GoogleSignInButton.tsx
// Shared "Continue with Google" button — used identically by /login and
// /signup (there's no separate Google-specific signup flow; Firebase
// creates the account automatically on first sign-in). Standard
// Google brand mark, white button per Google's own sign-in branding
// guidelines (never recolored into the site's amethyst palette — the
// mark itself must stay recognizable).
type GoogleSignInButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

export function GoogleSignInButton({ onClick, disabled, label = "Continue with Google" }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-nav-lavender-line bg-white px-6 py-3 text-sm font-medium text-nav-plum shadow-sm transition-colors duration-200 hover:bg-nav-lavender-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleGlyph className="h-4.5 w-4.5 shrink-0" />
      {label}
    </button>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11C3.24 21.3 7.28 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.63l4.01 3.1C6.22 6.9 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
