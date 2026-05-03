import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OfferTCG",
  description: "Pokemon card deal calculator for vendor buy offers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
