// src/components/consult/ConsultServiceIcon.tsx
// Maps a ConsultationService's `icon` string field (see
// src/lib/consultation/types.ts) to a real lucide-react icon component.
// The catalogue has no photography assets, so every service card/badge
// on /consult and /consult/[slug] is represented by one of these icons
// (same visual language QuickServices already uses on the homepage).
// Any icon string that doesn't match a known name falls back to
// HelpCircle rather than crashing — the data file is owned by a
// parallel agent, so this stays defensive against a typo/unexpected
// value there.
import {
  Moon,
  Sparkles,
  Hash,
  Compass,
  HeartHandshake,
  Hand,
  BookOpenText,
  Target,
  ScrollText,
  Heart,
  Briefcase,
  Users,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_REGISTRY: Record<string, LucideIcon> = {
  Moon,
  Sparkles,
  Hash,
  Compass,
  HeartHandshake,
  Hand,
  BookOpenText,
  Target,
  ScrollText,
  Heart,
  Briefcase,
  Users,
  HelpCircle,
};

export function getConsultServiceIcon(icon: string | undefined): LucideIcon {
  if (!icon) return HelpCircle;
  return ICON_REGISTRY[icon] ?? HelpCircle;
}

export function ConsultServiceIcon({
  icon,
  className,
}: {
  icon: string | undefined;
  className?: string;
}) {
  const Icon = (icon ? ICON_REGISTRY[icon] : undefined) ?? HelpCircle;
  return <Icon className={className} aria-hidden="true" />;
}
