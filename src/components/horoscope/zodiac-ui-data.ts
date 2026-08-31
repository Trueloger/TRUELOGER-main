import type { ComponentType, SVGProps } from "react";
import { ZODIAC_ORDER, ZODIAC_META, type ZodiacSlug } from "@/lib/horoscope/zodiac";
import {
  RamIcon, BullIcon, TwinsIcon, CrabIcon, LionIcon, MaidenIcon,
  ScalesIcon, ScorpionIcon, ArcherIcon, SeaGoatIcon, WaterBearerIcon, FishIcon,
} from "./icons";

export type ZodiacCardData = {
  slug: ZodiacSlug;
  name: string;
  dateRange: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const ICON_BY_SLUG: Record<ZodiacSlug, ComponentType<SVGProps<SVGSVGElement>>> = {
  aries: RamIcon,
  taurus: BullIcon,
  gemini: TwinsIcon,
  cancer: CrabIcon,
  leo: LionIcon,
  virgo: MaidenIcon,
  libra: ScalesIcon,
  scorpio: ScorpionIcon,
  sagittarius: ArcherIcon,
  capricorn: SeaGoatIcon,
  aquarius: WaterBearerIcon,
  pisces: FishIcon,
};

export const ZODIAC_CARDS: ZodiacCardData[] = ZODIAC_ORDER.map((slug) => ({
  slug,
  name: ZODIAC_META[slug].name,
  dateRange: ZODIAC_META[slug].dateRange,
  Icon: ICON_BY_SLUG[slug],
}));

/** Same data as ZODIAC_CARDS, keyed by slug for O(1) lookup (e.g. the
 * horoscope reading page) instead of an array .find(). */
export const CARD_BY_SLUG: Record<ZodiacSlug, ZodiacCardData> = Object.fromEntries(
  ZODIAC_CARDS.map((card) => [card.slug, card])
) as Record<ZodiacSlug, ZodiacCardData>;
