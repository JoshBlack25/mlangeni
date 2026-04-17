import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

import "./globals.css";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Mlangeni Grand Hospitality",
  description: "Experience luxury with Mlangeni Grand Hospitality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
