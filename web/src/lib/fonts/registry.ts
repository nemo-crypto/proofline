import localFont from "next/font/local";
import { GeistPixelSquare } from "geist/font/pixel";

const geist = localFont({ src: "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2", variable: "--font-geist" });
const geistMono = localFont({ src: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2", variable: "--font-geist-mono" });

export const fontRegistry = {
  geist: { label: "Geist" },
  inter: { label: "Inter" },
  notoSans: { label: "Noto Sans" },
  nunitoSans: { label: "Nunito Sans" },
  figtree: { label: "Figtree" },
  roboto: { label: "Roboto" },
  raleway: { label: "Raleway" },
  dmSans: { label: "DM Sans" },
  publicSans: { label: "Public Sans" },
  outfit: { label: "Outfit" },
  geistMono: { label: "Geist Mono" },
  geistPixelSquare: { label: "Geist Pixel Square" },
  jetBrainsMono: { label: "JetBrains Mono" },
  notoSerif: { label: "Noto Serif" },
  robotoSlab: { label: "Roboto Slab" },
  merriweather: { label: "Merriweather" },
  lora: { label: "Lora" },
  playfairDisplay: { label: "Playfair Display" },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontVars = [geist.variable, geistMono.variable, GeistPixelSquare.variable].join(" ");

export const fontOptions = (Object.keys(fontRegistry) as FontKey[]).map((key) => ({
  key,
  label: fontRegistry[key].label,
}));
