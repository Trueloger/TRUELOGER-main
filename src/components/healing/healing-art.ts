// Pre-designed card artwork (medallion, title, description and "Explore
// Healing" CTA already baked into each image) — cropped from the four
// supplied 1920x1080 source canvases to one shared bounding box so all
// four are pixel-identical in size (no per-card aspect-ratio drift), then
// upscaled 2x with a light sharpen pass for retina headroom.
export const HEALING_ART: Record<string, { src: string; width: number; height: number }> = {
  "chakra-healing": { src: "/healing/chakra-healing.png", width: 550, height: 808 },
  "aura-cleansing": { src: "/healing/aura-cleansing.png", width: 550, height: 808 },
  "relationship-healing": { src: "/healing/relationship-healing.png", width: 550, height: 808 },
  "money-healing": { src: "/healing/money-healing.png", width: 550, height: 808 },
};
