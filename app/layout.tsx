import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora, DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-baskerville",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Deep Cut",
  description: "Point your phone at a song. Read its story.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deep Cut",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0C0C0C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lora.variable} ${dmSans.variable} ${dmSerifDisplay.variable}`}
    >
      <body className="bg-void text-cream antialiased">{children}</body>
    </html>
  );
}
