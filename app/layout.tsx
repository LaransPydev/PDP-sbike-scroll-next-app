// app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const soehne = localFont({
  src: [
    {
      path: "../public/fonts/sohne-buch.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sohne-kraftig.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/sohne-halbfett.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/sohne-fett.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-soehne",
  display: "swap",
});

const CDN_BASE_URL = "https://do55ukdqgl59f.cloudfront.net";

export const metadata: Metadata = {
  title: "sBike",
  description: "Sportstech sBike 21.5\" Display",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {[1, 2, 3, 4, 5].map((i) => (
          <link
            key={i}
            rel="preload"
            as="image"
            type="image/webp"
            href={`${CDN_BASE_URL}/frames/${i}.webp`}
          />
        ))}
      </head>
      <body className={`${outfit.variable} ${soehne.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}