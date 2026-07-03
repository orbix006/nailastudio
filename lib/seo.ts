import type { Metadata } from 'next';
import type { SeoMeta } from '@/lib/supabase/seo';
import { getWebsiteSettings } from '@/lib/supabase/queries';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thenailaastudio.com';
const SITE_NAME = 'The Nailaa Studio';

/**
 * Convert a raw SeoMeta row + optional overrides into a Next.js Metadata object.
 * Automatically fills title template, canonical URL, Open Graph, and Twitter cards.
 */
export async function buildMetadata(
  seo: SeoMeta,
  overrides: {
    canonicalPath?: string;
    pageTitle?: string;
  } = {}
): Promise<Metadata> {
  // Pull the global SEO image as default OG image if page has none
  let fallbackOgImage: string | null = null;
  try {
    const settings = await getWebsiteSettings();
    fallbackOgImage = settings.seo_image_url;
  } catch {
    // ignore - fallback is null
  }

  const canonical = seo.canonical_url
    ? seo.canonical_url
    : overrides.canonicalPath
    ? `${SITE_URL}${overrides.canonicalPath}`
    : SITE_URL;

  const pageTitle = overrides.pageTitle ?? seo.title;
  const ogTitle = seo.og_title ?? pageTitle;
  const ogDesc = seo.og_description ?? seo.description;
  const ogImage = seo.og_image_url ?? fallbackOgImage;
  const twitterTitle = seo.twitter_title ?? ogTitle;
  const twitterDesc = seo.twitter_description ?? ogDesc;
  const twitterImage = seo.twitter_image_url ?? ogImage;

  return {
    title: pageTitle,
    description: seo.description,
    robots: seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: ogTitle,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDesc,
      images: twitterImage ? [twitterImage] : [],
    },
  };
}

/**
 * Build JSON-LD structured data script tag for a local business.
 */
export function buildLocalBusinessJsonLd(settings: {
  company_name: string;
  company_description: string | null;
  contact_phone: string;
  contact_email: string;
  business_address: string | null;
  seo_image_url: string | null;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.company_name,
    description: settings.company_description ?? '',
    telephone: settings.contact_phone,
    email: settings.contact_email,
    address: settings.business_address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.business_address,
        }
      : undefined,
    url: SITE_URL,
    image: settings.seo_image_url ?? undefined,
  };
  return JSON.stringify(schema);
}

/**
 * Build JSON-LD for a creative work / portfolio item.
 */
export function buildPortfolioJsonLd(project: {
  name: string;
  description: string | null;
  cover_image_url: string;
  slug: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name,
    description: project.description ?? '',
    image: project.cover_image_url,
    url: `${SITE_URL}/portfolio/${project.slug}`,
  };
  return JSON.stringify(schema);
}

/**
 * Build JSON-LD for a service offering.
 */
export function buildServiceJsonLd(service: {
  title: string;
  short_description: string;
  slug: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.short_description,
    provider: {
      '@type': 'LocalBusiness',
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/services/${service.slug}`,
  };
  return JSON.stringify(schema);
}
