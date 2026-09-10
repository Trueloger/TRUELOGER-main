// src/lib/auth/google-error.ts
// Maps the Firebase Auth error codes a Google sign-in popup can
// realistically throw to plain-English copy — same "never surface
// error.code/error.message verbatim" rule as mapSignInError/
// mapSignUpError in the login/signup pages, shared here since both
// pages use the identical Google flow.
export function mapGoogleAuthError(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      // Not a real error — the user closed the popup themselves.
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method. Try logging in with your password instead.";
    case "auth/network-request-failed":
      return "Network error — please check your connection and try again.";
    default:
      return "We couldn't sign you in with Google. Please try again.";
  }
}
