import { createClient } from './server';

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
}

const DEFAULT_SEO: SeoMeta = {
  title: 'The Nailaa Studio',
  description: 'Luxury nail styling and care by The Nailaa Studio.',
  og_title: null,
  og_description: null,
  og_image_url: null,
  twitter_title: null,
  twitter_description: null,
  twitter_image_url: null,
  canonical_url: null,
  noindex: false,
  structured_data: null,
};

/**
 * Fetch SEO metadata for a given page slug from the `seo_metadata` table.
 * Falls back to defaults when the row does not exist or the table is unavailable.
 */
export async function getPageSeo(pageSlug: string): Promise<SeoMeta> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_slug', pageSlug)
      .maybeSingle();

    if (error || !data) return DEFAULT_SEO;

    // If an og_image_id is stored, resolve the public URL from media_library
    let ogImageUrl: string | null = data.og_image_url ?? null;
    if (!ogImageUrl && data.og_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', data.og_image_id)
        .maybeSingle();
      if (media) ogImageUrl = media.public_url;
    }

    return {
      title: data.title ?? DEFAULT_SEO.title,
      description: data.description ?? DEFAULT_SEO.description,
      og_title: data.og_title ?? null,
      og_description: data.og_description ?? null,
      og_image_url: ogImageUrl,
      twitter_title: data.twitter_title ?? null,
      twitter_description: data.twitter_description ?? null,
      twitter_image_url: data.twitter_image_url ?? null,
      canonical_url: data.canonical_url ?? null,
      noindex: data.noindex ?? false,
      structured_data: data.structured_data ?? null,
    };
  } catch {
    return DEFAULT_SEO;
  }
}

/**
 * Fetch SEO metadata for a portfolio project by its slug.
 * Falls back to generic defaults.
 */
export async function getPortfolioProjectSeo(slug: string): Promise<SeoMeta> {
  try {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from('portfolio_projects')
      .select('name, description, cover_image_id, slug')
      .eq('slug', slug)
      .eq('is_published', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!project) return DEFAULT_SEO;

    let coverUrl: string | null = null;
    if (project.cover_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', project.cover_image_id)
        .maybeSingle();
      if (media) coverUrl = media.public_url;
    }

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
    };
  } catch {
    return DEFAULT_SEO;
  }
}

/**
 * Fetch SEO metadata for a service by its slug.
 */
export async function getServiceSeo(slug: string): Promise<SeoMeta> {
  try {
    const supabase = await createClient();
    const { data: service } = await supabase
      .from('services')
      .select('title, short_description, cover_image_id, slug')
      .eq('slug', slug)
      .eq('is_visible', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!service) return DEFAULT_SEO;

    let coverUrl: string | null = null;
    if (service.cover_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', service.cover_image_id)
        .maybeSingle();
      if (media) coverUrl = media.public_url;
    }

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
    };
  } catch {
    return DEFAULT_SEO;
  }
}
