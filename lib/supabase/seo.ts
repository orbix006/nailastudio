import { createPublicClient } from './server';

interface SeoJsonLd {
  og_title?: string;
  og_description?: string;
  keywords?: string;
  structured_data?: Record<string, unknown>;
}

export interface SeoMeta {
  title: string;
  description: string;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  structured_data: Record<string, unknown> | null;
  keywords: string | null;
}

const DEFAULT_SEO: SeoMeta = {
  title: 'The Nailaa Studio | Luxury Interior Design & Space Planning',
  description: 'Bespoke interior architectures, spatial curation, modular kitchens, and curated architectural designs for premium estates by The Nailaa Studio.',
  og_title: 'The Nailaa Studio | Luxury Interior Design & Space Planning',
  og_description: 'Bespoke interior architectures, spatial curation, modular kitchens, and curated architectural designs for premium estates by The Nailaa Studio.',
  og_image_url: null,
  twitter_title: 'The Nailaa Studio | Luxury Interior Design & Space Planning',
  twitter_description: 'Bespoke interior architectures, spatial curation, modular kitchens, and curated architectural designs for premium estates by The Nailaa Studio.',
  twitter_image_url: null,
  canonical_url: null,
  noindex: false,
  structured_data: null,
  keywords: 'Interior Design, Luxury Interiors, Home Interior Design, Commercial Interiors, Modular Kitchen, Residential Interior Designer, Interior Design Studio, space planning, custom furniture, corporate office design, villa interior styling, luxury penthouse design, The Nailaa Studio',
};

/**
 * Helper to fetch public URL of a media library image by its UUID
 */
async function getImageUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId) return null;
  try {
    const supabase = await createPublicClient();
    const { data } = await supabase
      .from('media_library')
      .select('public_url')
      .eq('id', mediaId)
      .maybeSingle();
    return data?.public_url || null;
  } catch {
    return null;
  }
}

/**
 * Fetch SEO metadata for a given page slug from the `seo_metadata` table.
 * Falls back to defaults when the row does not exist or the table is unavailable.
 */
export async function getPageSeo(pageSlug: string): Promise<SeoMeta> {
  try {
    const supabase = await createPublicClient();
    const cleanSlug = pageSlug.replace(/^\/+/, '');
    const possibleSlugs = [cleanSlug, `/${cleanSlug}`];

    // Home is traditionally mapped as 'home' or '/'
    if (cleanSlug === 'home') {
      possibleSlugs.push('/');
    } else if (cleanSlug === '') {
      possibleSlugs.push('home', '/');
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .in('page_slug', possibleSlugs)
      .maybeSingle();

    if (error || !data) return DEFAULT_SEO;

    // Resolve public image URLs from media IDs
    const ogImageUrl = await getImageUrl(data.facebook_image_id);
    const twitterImageUrl = await getImageUrl(data.twitter_image_id);

    // Unpack fields from the json_ld JSONB column
    const jsonLdData = (data.json_ld as unknown as SeoJsonLd) || {};
    const ogTitle = jsonLdData.og_title || null;
    const ogDescription = jsonLdData.og_description || null;
    const keywords = jsonLdData.keywords || null;
    const structuredData = jsonLdData.structured_data || null;

    const noindex = data.robots_directive ? data.robots_directive.includes('noindex') : false;

    return {
      title: data.title ?? DEFAULT_SEO.title,
      description: data.meta_description ?? DEFAULT_SEO.description,
      og_title: ogTitle,
      og_description: ogDescription,
      og_image_url: ogImageUrl,
      twitter_title: ogTitle,
      twitter_description: ogDescription,
      twitter_image_url: twitterImageUrl || ogImageUrl,
      canonical_url: data.canonical_url ?? null,
      noindex,
      structured_data: structuredData,
      keywords,
    };
  } catch (err) {
    console.error('Error in getPageSeo:', err);
    return DEFAULT_SEO;
  }
}

/**
 * Fetch SEO metadata for a portfolio project by its slug.
 * First checks for seo_metadata override, otherwise falls back to project defaults.
 */
export async function getPortfolioProjectSeo(slug: string): Promise<SeoMeta> {
  try {
    const supabase = await createPublicClient();

    // 1. Check if there is an explicit override in seo_metadata table
    const pageSlug = `portfolio/${slug}`;
    const possibleSlugs = [pageSlug, `/${pageSlug}`];
    
    const { data: seoOverride } = await supabase
      .from('seo_metadata')
      .select('*')
      .in('page_slug', possibleSlugs)
      .maybeSingle();

    if (seoOverride) {
      const ogImageUrl = await getImageUrl(seoOverride.facebook_image_id);
      const twitterImageUrl = await getImageUrl(seoOverride.twitter_image_id);

      const jsonLdData = (seoOverride.json_ld as unknown as SeoJsonLd) || {};
      const ogTitle = jsonLdData.og_title || null;
      const ogDescription = jsonLdData.og_description || null;
      const keywords = jsonLdData.keywords || null;
      const structuredData = jsonLdData.structured_data || null;
      const noindex = seoOverride.robots_directive ? seoOverride.robots_directive.includes('noindex') : false;

      return {
        title: seoOverride.title,
        description: seoOverride.meta_description ?? DEFAULT_SEO.description,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
        twitter_title: ogTitle,
        twitter_description: ogDescription,
        twitter_image_url: twitterImageUrl || ogImageUrl,
        canonical_url: seoOverride.canonical_url ?? null,
        noindex,
        structured_data: structuredData,
        keywords,
      };
    }

    // 2. Default fallback mapping from portfolio_projects table
    const { data: project } = await supabase
      .from('portfolio_projects')
      .select('name, description, cover_image_id, slug')
      .eq('slug', slug)
      .eq('is_published', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!project) return DEFAULT_SEO;

    const coverUrl = await getImageUrl(project.cover_image_id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thenailaastudio.com';
    const canonical = `${siteUrl}/portfolio/${project.slug}`;

    return {
      title: project.name,
      description: project.description ?? DEFAULT_SEO.description,
      og_title: project.name,
      og_description: project.description ?? null,
      og_image_url: coverUrl,
      twitter_title: project.name,
      twitter_description: project.description ?? null,
      twitter_image_url: coverUrl,
      canonical_url: canonical,
      noindex: false,
      structured_data: null,
      keywords: null,
    };
  } catch (err) {
    console.error('Error in getPortfolioProjectSeo:', err);
    return DEFAULT_SEO;
  }
}

/**
 * Fetch SEO metadata for a service by its slug.
 * First checks for seo_metadata override, otherwise falls back to service defaults.
 */
export async function getServiceSeo(slug: string): Promise<SeoMeta> {
  try {
    const supabase = await createPublicClient();

    // 1. Check if there is an explicit override in seo_metadata table
    const pageSlug = `services/${slug}`;
    const possibleSlugs = [pageSlug, `/${pageSlug}`];
    
    const { data: seoOverride } = await supabase
      .from('seo_metadata')
      .select('*')
      .in('page_slug', possibleSlugs)
      .maybeSingle();

    if (seoOverride) {
      const ogImageUrl = await getImageUrl(seoOverride.facebook_image_id);
      const twitterImageUrl = await getImageUrl(seoOverride.twitter_image_id);

      const jsonLdData = (seoOverride.json_ld as unknown as SeoJsonLd) || {};
      const ogTitle = jsonLdData.og_title || null;
      const ogDescription = jsonLdData.og_description || null;
      const keywords = jsonLdData.keywords || null;
      const structuredData = jsonLdData.structured_data || null;
      const noindex = seoOverride.robots_directive ? seoOverride.robots_directive.includes('noindex') : false;

      return {
        title: seoOverride.title,
        description: seoOverride.meta_description ?? DEFAULT_SEO.description,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
        twitter_title: ogTitle,
        twitter_description: ogDescription,
        twitter_image_url: twitterImageUrl || ogImageUrl,
        canonical_url: seoOverride.canonical_url ?? null,
        noindex,
        structured_data: structuredData,
        keywords,
      };
    }

    // 2. Default fallback mapping from services table
    const { data: service } = await supabase
      .from('services')
      .select('title, short_description, cover_image_id, slug')
      .eq('slug', slug)
      .eq('is_visible', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!service) return DEFAULT_SEO;

    const coverUrl = await getImageUrl(service.cover_image_id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thenailaastudio.com';
    const canonical = `${siteUrl}/services/${service.slug}`;

    return {
      title: service.title,
      description: service.short_description ?? DEFAULT_SEO.description,
      og_title: service.title,
      og_description: service.short_description ?? null,
      og_image_url: coverUrl,
      twitter_title: service.title,
      twitter_description: service.short_description ?? null,
      twitter_image_url: coverUrl,
      canonical_url: canonical,
      noindex: false,
      structured_data: null,
      keywords: null,
    };
  } catch (err) {
    console.error('Error in getServiceSeo:', err);
    return DEFAULT_SEO;
  }
}
