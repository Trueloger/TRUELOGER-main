import Image from "next/image";
import Link from "next/link";

// Cropped from public/LOGO.png (transparent bbox + small pad) so the mark
// sits flush in the nav instead of the source file's huge canvas margins.
const LOGO_SRC = "/logo-nav.png";
const LOGO_ASPECT = 1318 / 373;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="TRUELOGER — go to homepage"
      className={`flex shrink-0 items-center ${className}`}
    >
      <Image
        src={LOGO_SRC}
        alt="TRUELOGER"
        width={Math.round(40 * LOGO_ASPECT)}
        height={40}
        priority
        className="h-8 w-auto md:h-9"
      />
    </Link>
  );
}
