import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ImageProtection } from "@/components/ImageProtection";
import { SiteChrome } from "@/components/layout/SiteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif used only by the Quick Services heading/card titles.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRUELOGER",
  description: "TRUELOGER — Vedic astrology, personalized guidance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ImageProtection />
        {/* reducedMotion="user" — every motion.* component site-wide
            (drawers, dropdowns, Reveal, toasts, testimonial expand,
            etc.) automatically respects prefers-reduced-motion: OS
            settings disable transform-driven animation (slides,
            scales, parallax-style movement) while keeping short
            opacity fades, matching the spec's reduced-motion guidance
            without auditing each component individually. */}
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <SiteChrome>{children}</SiteChrome>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
