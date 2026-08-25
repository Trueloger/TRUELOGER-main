import { storageImage } from "@/lib/storage-image";

// Slide data kept separate from rendering. Each banner is a complete,
// pre-designed artwork (logo, headline, copy, CTAs baked into the image) —
// the carousel only ever presents these images, never overlays HTML text.
export type HeroBanner = {
  id: string;
  src: string;
  alt: string;
};

// Native size of every banner asset (all 5 share identical dimensions),
// used to reserve layout space via aspect-ratio and prevent CLS.
export const HERO_BANNER_WIDTH = 1672;
export const HERO_BANNER_HEIGHT = 941;

export const HERO_BANNERS: HeroBanner[] = [
  {
    id: "banner-1",
    src: storageImage("/banner/banner-1.png"),
    alt: "TRUELOGER — Get clarity on life's biggest questions. Vedic astrology, personalized guidance.",
  },
  {
    id: "banner-2",
    src: storageImage("/banner/banner-2.png"),
    alt: "TRUELOGER — Create your free Kundli. Your birth chart holds the key to your destiny.",
  },
  {
    id: "banner-3",
    src: storageImage("/banner/banner-3.png"),
    alt: "TRUELOGER — Your chart is unique, your reading should be too. Personalized astrology reports.",
  },
  {
    id: "banner-4",
    src: storageImage("/banner/banner-4.png"),
    alt: "TRUELOGER — Guidance that begins with you. Book a private consultation.",
  },
  {
    id: "banner-5",
    src: storageImage("/banner/banner-5.png"),
    alt: "TRUELOGER — A little guidance for every day. Daily, weekly and monthly horoscope.",
  },
];
