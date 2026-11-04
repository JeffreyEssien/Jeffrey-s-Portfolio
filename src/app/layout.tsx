import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { getPublicSite } from "../lib/public-content";
import { siteUrl } from "../lib/site-url";

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
  const site = await getPublicSite();
  return {
    metadataBase: siteUrl(),
    title: site.metaTitle,
    description: site.metaDescription,
    // Child pages inherit this; every public page sets its own canonical.
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: site.brand, title: site.metaTitle, description: site.metaDescription, url: "/" },
    twitter: { card: "summary_large_image", title: site.metaTitle, description: site.metaDescription },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getPublicSite();
  // Tells search engines who the site is about (shown in name searches).
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.brand,
    jobTitle: "Software Engineer",
    url: siteUrl().toString(),
    description: site.metaDescription,
    sameAs: ["https://github.com/JeffreyEssien"],
  };
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} antialiased bg-[#fafaf9] text-neutral-900 selection:bg-neutral-900 selection:text-white`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
