"use client";

import { useEffect } from "react";

/**
 * Site-wide image protection: blocks the right-click context menu and
 * native drag-out on every <img> (including next/image's rendered <img>
 * tags), so "Save image as…", "Copy image", "Open image in new tab" etc.
 * never appear and images can't be dragged onto the desktop.
 *
 * Deliberately scoped to <img> elements only — right-click still works
 * everywhere else on the page (text, buttons, forms).
 *
 * Note: this is a UX deterrent, not real DRM. Anyone using devtools,
 * view-source, or the network tab can still get at the image bytes.
 */
export function ImageProtection() {
  useEffect(() => {
    const blockOnImage = (e: MouseEvent | DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockOnImage);
    document.addEventListener("dragstart", blockOnImage);

    return () => {
      document.removeEventListener("contextmenu", blockOnImage);
      document.removeEventListener("dragstart", blockOnImage);
    };
  }, []);

  return null;
}
