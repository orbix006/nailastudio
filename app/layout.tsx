import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";

import { getWebsiteSettings, getThemeSettings } from "@/lib/supabase/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thenailaastudio.com';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.company_name,
      template: `%s | ${settings.company_name}`,
    },
    description: settings.company_description,
    applicationName: settings.company_name,
    icons: {
      icon: settings.favicon_url || '/favicon.ico',
      shortcut: settings.favicon_url || '/favicon.ico',
      apple: settings.favicon_url || '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      siteName: settings.company_name,
      title: settings.company_name,
      description: settings.company_description || '',
      url: siteUrl,
      images: settings.seo_image_url
        ? [{ url: settings.seo_image_url, width: 1200, height: 630, alt: settings.company_name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.company_name,
      description: settings.company_description || '',
      images: settings.seo_image_url ? [settings.seo_image_url] : [],
    },
    alternates: {
      canonical: siteUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeSettings = await getThemeSettings();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} antialiased`}
      >
        <Providers defaultTheme={themeSettings.default_theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
