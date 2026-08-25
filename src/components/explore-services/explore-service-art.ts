// Pre-designed card artwork (title, description, and CTA already baked
// into each image — cropped from public/explore-section-cards/*.png,
// which ship as a huge near-empty 1920x1080 canvas). Width/height are the
// image's real cropped dimensions, used so next/image can reserve exact
// layout space (no CLS) instead of guessing a generic aspect ratio.
export const EXPLORE_SERVICE_ART: Record<string, { src: string; width: number; height: number }> = {
  "vedic-astrology": { src: "/explore-section-cards/vedic-astrology.png", width: 235, height: 399 },
  numerology: { src: "/explore-section-cards/numerology.png", width: 216, height: 403 },
  "tarot-reading": { src: "/explore-section-cards/tarot-reading.png", width: 218, height: 403 },
  vastu: { src: "/explore-section-cards/vastu.png", width: 224, height: 402 },
  "spiritual-healing": { src: "/explore-section-cards/spiritual-healing.png", width: 225, height: 403 },
  "puja-rituals": { src: "/explore-section-cards/puja-rituals.png", width: 222, height: 401 },
};
