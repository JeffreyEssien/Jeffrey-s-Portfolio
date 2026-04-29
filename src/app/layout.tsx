import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { getSite } from "../lib/content";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return { title: site.metaTitle, description: site.metaDescription };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} antialiased bg-[#fafaf9] text-neutral-900 selection:bg-neutral-900 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
