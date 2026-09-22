"use client";

// src/components/ui/Select.tsx
// The ONE shared dropdown/select component for the whole site —
// replacing native <select>/<option>, whose option padding/height
// cannot be styled consistently cross-browser (this is WHY dropdown
// option spacing looked inconsistent site-wide: every "fix" attempted
// on a native <option> element is a no-op in at least one browser).
// A real listbox, following the exact WAI-ARIA combobox/listbox
// pattern already established by src/components/forms/PlaceOfBirthField.tsx
// (role="listbox"/"option", aria-activedescendant, mousedown-not-click
// so a click doesn't fire the outside-click/blur handler first,
// pointerdown-based outside-click close) — same panel chrome (rounded-xl
// border-nav-lavender-line bg-nav-pearl shadow-[0_12px_32px_rgba(80,50,130,0.14)]),
// same option hover/active color (bg-nav-lavender-soft text-nav-violet).
// Trigger reuses the shared fieldInputClass/fieldLabelClass/
// fieldInputErrorClass/fieldErrorTextClass/fieldHintTextClass from
// field-styles.ts so a Select looks identical to every text/date/time
// field already on the page.
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
  fieldHintTextClass,
} from "@/components/forms/field-styles";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  /** Secondary text shown right-aligned in the option row (e.g. a
   * price, a status count) — optional, matches PlaceOfBirthField's
   * suggestion-state secondary-text treatment. */
  secondaryLabel?: string;
  disabled?: boolean;
};

type SelectProps<T extends string> = {
  id?: string;
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  "aria-label"?: string;
};

// One canonical option-row size for the entire site — this IS the fix
// for "inconsistent spacing between options": every Select, on every
// page, uses exactly this row height/padding, not whatever a
// particular browser happens to render a native <option> as. min-h-11
// keeps every row a real 44px touch target regardless of label length.
const OPTION_ROW_CLASS =
  "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150";

export function Select<T extends string = string>({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
  disabled,
  error,
  hint,
  className = "",
  ...rest
}: SelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Close on outside click — mousedown/pointerdown, same as
  // PlaceOfBirthField, so a click ON an option (handled via
  // onMouseDown there too) still fires before this would close it.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function openList() {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      setActiveIndex(-1);
    } else {
      openList();
    }
  }

  function selectOption(option: SelectOption<T>) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    setActiveIndex(-1);
  }

  function moveActive(nextIndex: number) {
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        let next = activeIndex;
        do {
          next = (next + 1) % options.length;
        } while (options[next]?.disabled && next !== activeIndex);
        moveActive(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        let next = activeIndex;
        do {
          next = next <= 0 ? options.length - 1 : next - 1;
        } while (options[next]?.disabled && next !== activeIndex);
        moveActive(next);
        break;
      }
      case "Home":
        e.preventDefault();
        moveActive(0);
        break;
      case "End":
        e.preventDefault();
        moveActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) selectOption(options[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  const activeDescendantId =
    open && activeIndex >= 0 && activeIndex < options.length ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={triggerId} className={fieldLabelClass}>
          {label} {required && <span className="text-nav-amethyst-deep">*</span>}
        </label>
      )}

      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${triggerId}-error` : hint ? `${triggerId}-hint` : undefined}
        {...rest}
        className={`${label ? "mt-1.5 " : ""}flex items-center justify-between gap-2 text-left ${fieldInputClass} ${error ? fieldInputErrorClass : ""} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className={`truncate ${selected ? "text-nav-plum" : "text-nav-plum/40"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-nav-plum/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && (
        <p id={`${triggerId}-error`} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${triggerId}-hint`} className={fieldHintTextClass}>
          {hint}
        </p>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label ?? rest["aria-label"]}
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-64 overflow-y-auto rounded-xl border border-nav-lavender-line bg-nav-pearl p-1.5 shadow-[0_12px_32px_rgba(80,50,130,0.14)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onMouseDown={(e) => {
                  // mousedown, not click — fires before the trigger's
                  // blur/outside-click handler would close the list.
                  e.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                className={`${OPTION_ROW_CLASS} ${
                  option.disabled
                    ? "cursor-not-allowed text-nav-plum/35"
                    : isActive || isSelected
                      ? "bg-nav-lavender-soft text-nav-violet"
                      : "text-nav-plum hover:bg-nav-lavender-soft hover:text-nav-violet"
                }`}
              >
                <span className="truncate font-medium">{option.label}</span>
                {option.secondaryLabel && (
                  <span className="shrink-0 text-xs text-nav-plum/60">{option.secondaryLabel}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
