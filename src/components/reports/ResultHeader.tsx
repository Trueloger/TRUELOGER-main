import type { ComponentType, SVGProps } from "react";
import { LotusIcon } from "@/components/quick-services/icons";

type ResultHeaderProps = {
  title: string;
  subtitle?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Top-of-report block — icon/ornament + <h1> heading + short
 * subheading. Mirrors HoroscopeReading's top block so every wave-2 tool
 * page's result screen opens the same way. Falls back to LotusIcon when
 * no tool-specific Icon is supplied. */
export function ResultHeader({ title, subtitle, Icon }: ResultHeaderProps) {
  const OrnamentIcon = Icon ?? LotusIcon;

  return (
    <div className="text-center">
      <OrnamentIcon
        aria-hidden="true"
        strokeWidth={1.3}
        className="mx-auto h-12 w-12 text-nav-amethyst-deep"
      />
      <h1 className="mt-3 font-serif text-3xl text-nav-plum sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-nav-plum/60">{subtitle}</p>}
    </div>
  );
}
