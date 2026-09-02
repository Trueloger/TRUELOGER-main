// Shared class strings for the forms/ field components — keeps the
// label/input/error/hint vocabulary identical across NameField,
// GenderField, DateOfBirthField, TimeOfBirthField and PlaceOfBirthField
// instead of re-typing (and risking drift on) the same long Tailwind
// strings in every file.

export const fieldLabelClass = "block text-sm font-medium text-nav-plum";

export const fieldInputClass =
  "min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-[0.95rem] text-nav-plum placeholder:text-nav-plum/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl";

export const fieldInputErrorClass = "border-red-400/70 focus-visible:ring-red-400";

export const fieldErrorTextClass = "mt-1.5 text-xs text-red-600";

export const fieldHintTextClass = "mt-1.5 text-xs text-nav-plum/60";
