// app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
      <body className={outfit.variable}>
        {children}
      </body>
    </html>
  );
}