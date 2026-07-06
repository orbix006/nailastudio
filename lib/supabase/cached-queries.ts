/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Cached wrappers for public Supabase queries.
 *
 * These use Next.js `unstable_cache` to cache results between requests,
 * dramatically reducing DB round-trips for high-traffic public pages.
 *
 * It retrieves the site cache version dynamically and appends it to cache keys.
 * Whenever the DB version is bumped, the cache keys rotate, triggering instant invalidation.
 */

import { unstable_cache } from 'next/cache';
import { createPublicClient } from './server';
import {
  getWebsiteSettings,
  getThemeSettings,
  getSocialLinks,
  getHeroSettings,
  getAboutContent,
  getServices,
  getPortfolioCategories,
  getPortfolioProjects,
  getDesignProcess,
  getWhyChooseUs,
  getCoreValues,
  getDesignPhilosophy,
  getTestimonials,
  getProjectTypes,
  getConsultationPopupSettings,
  getSiteCacheVersion,
  DEFAULT_SERVICES,
  DEFAULT_PROJECTS,
} from './queries';

const REVALIDATE_STATIC = 300;   // 5 min for settings, theme
const REVALIDATE_CONTENT = 60;   // 60s for portfolio, services

/**
 * Fetch the cache version from the DB. Cached for 10 seconds.
 */
export const getCachedSiteCacheVersion = unstable_cache(
  async () => getSiteCacheVersion(),
  ['site-cache-version'],
  { revalidate: 10, tags: ['public-content', 'cache-version'] }
);

// 1. Website Settings
const fetchWebsiteSettings = unstable_cache(
  async (_version: number) => getWebsiteSettings(),
  ['website-settings'],
  { revalidate: REVALIDATE_STATIC, tags: ['public-content', 'settings'] }
);
export const getCachedWebsiteSettings = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchWebsiteSettings(v);
};

// 2. Theme Settings
const fetchThemeSettings = unstable_cache(
  async (_version: number) => getThemeSettings(),
  ['theme-settings'],
  { revalidate: REVALIDATE_STATIC, tags: ['public-content', 'settings'] }
);
export const getCachedThemeSettings = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchThemeSettings(v);
};

// 3. Social Links
const fetchSocialLinks = unstable_cache(
  async (_version: number) => getSocialLinks(),
  ['social-links'],
  { revalidate: REVALIDATE_STATIC, tags: ['public-content', 'settings'] }
);
export const getCachedSocialLinks = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchSocialLinks(v);
};

// 4. Hero Settings
const fetchHeroSettings = unstable_cache(
  async (_version: number) => getHeroSettings(),
  ['hero-settings'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'hero'] }
);
export const getCachedHeroSettings = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchHeroSettings(v);
};

// 5. About Content
const fetchAboutContent = unstable_cache(
  async (_version: number) => getAboutContent(),
  ['about-content'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'about'] }
);
export const getCachedAboutContent = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchAboutContent(v);
};

// 6. Services
const fetchServices = unstable_cache(
  async (_version: number) => getServices(),
  ['services'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'services'] }
);
export const getCachedServices = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchServices(v);
};

// 7. Portfolio Categories
const fetchPortfolioCategories = unstable_cache(
  async (_version: number) => getPortfolioCategories(),
  ['portfolio-categories'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'portfolio'] }
);
export const getCachedPortfolioCategories = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchPortfolioCategories(v);
};

// 8. Portfolio Projects
const fetchPortfolioProjects = unstable_cache(
  async (_version: number) => getPortfolioProjects(),
  ['portfolio-projects'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'portfolio'] }
);
export const getCachedPortfolioProjects = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchPortfolioProjects(v);
};

// 9. Design Process
const fetchDesignProcess = unstable_cache(
  async (_version: number) => getDesignProcess(),
  ['design-process'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'design-process'] }
);
export const getCachedDesignProcess = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchDesignProcess(v);
};

// 10. Why Choose Us
const fetchWhyChooseUs = unstable_cache(
  async (_version: number) => getWhyChooseUs(),
  ['why-choose-us'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'why-choose-us'] }
);
export const getCachedWhyChooseUs = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchWhyChooseUs(v);
};

// 11. Core Values
const fetchCoreValues = unstable_cache(
  async (_version: number) => getCoreValues(),
  ['core-values'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'core-values'] }
);
export const getCachedCoreValues = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchCoreValues(v);
};

// 12. Design Philosophy
const fetchDesignPhilosophy = unstable_cache(
  async (_version: number) => getDesignPhilosophy(),
  ['design-philosophy'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'design-philosophy'] }
);
export const getCachedDesignPhilosophy = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchDesignPhilosophy(v);
};

// 13. Testimonials
const fetchTestimonials = unstable_cache(
  async (_version: number) => getTestimonials(),
  ['testimonials'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'testimonials'] }
);
export const getCachedTestimonials = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchTestimonials(v);
};

// 14. Project Types
const fetchProjectTypes = unstable_cache(
  async (_version: number) => getProjectTypes(),
  ['project-types'],
  { revalidate: REVALIDATE_STATIC, tags: ['public-content', 'project-types'] }
);
export const getCachedProjectTypes = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchProjectTypes(v);
};

// 15. Consultation Popup Settings
const fetchConsultationPopupSettings = unstable_cache(
  async (_version: number) => getConsultationPopupSettings(),
  ['consultation-popup-settings'],
  { revalidate: REVALIDATE_STATIC, tags: ['public-content', 'settings'] }
);
export const getCachedConsultationPopupSettings = async (version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchConsultationPopupSettings(v);
};

// 16. Service Detail by Slug
interface ServiceQueryResult {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  detailed_overview: string | null;
  design_approach: string | null;
  materials_finishes: string | null;
  cover_image_id: string | null;
}

const fetchServiceBySlug = unstable_cache(
  async (slug: string, _version: number) => {
    const supabase = await createPublicClient();
    const { data: service } = await supabase
      .from('services')
      .select(`
        id, title, slug, short_description, detailed_overview,
        design_approach, materials_finishes, cover_image_id
      `)
      .eq('slug', slug)
      .eq('is_visible', true)
      .is('deleted_at', null)
      .maybeSingle() as unknown as { data: ServiceQueryResult | null };

    if (!service) {
      const def = DEFAULT_SERVICES.find((s) => s.slug === slug);
      if (def) {
        return {
          id: def.id,
          title: def.title,
          slug: def.slug,
          short_description: def.short_description,
          detailed_overview: def.detailed_overview,
          design_approach: def.design_approach,
          materials_finishes: def.materials_finishes,
          coverUrl: def.cover_image_url || '/images/hero_background.png',
          features: def.features.map((f) => ({ feature: f })),
          galleryUrls: def.gallery_urls,
        };
      }
      return null;
    }

    // Resolve cover image
    let coverUrl = '/images/hero_background.png';
    if (service.cover_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', service.cover_image_id)
        .maybeSingle();
      if (media) coverUrl = media.public_url;
    }

    // Fetch features
    const { data: features } = await supabase
      .from('service_features')
      .select('feature')
      .eq('service_id', service.id)
      .order('display_order', { ascending: true });

    // Fetch gallery
    const { data: galleryItems } = await supabase
      .from('service_images')
      .select('media_id, display_order')
      .eq('service_id', service.id)
      .order('display_order', { ascending: true });

    const galleryUrls: string[] = [];
    if (galleryItems && galleryItems.length > 0) {
      const mediaIds = galleryItems.map((g) => g.media_id);
      const { data: mediaList } = await supabase
        .from('media_library')
        .select('id, public_url')
        .in('id', mediaIds);
      const mediaMap = new Map((mediaList ?? []).map((m) => [m.id, m.public_url]));
      galleryItems.forEach((g) => {
        const url = mediaMap.get(g.media_id);
        if (url) galleryUrls.push(url);
      });
    }

    return {
      ...service,
      coverUrl,
      features: features || [],
      galleryUrls,
    };
  },
  ['service-detail-by-slug'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'services'] }
);

export const getCachedServiceBySlug = async (slug: string, version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchServiceBySlug(slug, v);
};

// 17. Portfolio Project Detail by Slug
interface ProjectQueryResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  completion_year: number | null;
  project_type: string | null;
  cover_image_id: string | null;
  portfolio_categories: { name: string; slug: string } | null;
  portfolio_project_tags: { portfolio_tags: { name: string } }[];
  portfolio_project_images: { media_library: { public_url: string; alt_text: string | null } | null, display_order: number }[];
}

const fetchPortfolioProjectBySlug = unstable_cache(
  async (slug: string, _version: number) => {
    const supabase = await createPublicClient();
    const { data: project } = await supabase
      .from('portfolio_projects')
      .select(`
        id, name, slug, description, location, completion_year,
        cover_image_id, project_type,
        portfolio_categories(name, slug),
        portfolio_project_tags(portfolio_tags(name)),
        portfolio_project_images(media_library(public_url, alt_text), display_order)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .is('deleted_at', null)
      .maybeSingle() as unknown as { data: ProjectQueryResult | null };

    if (!project) {
      const def = DEFAULT_PROJECTS.find((p) => p.slug === slug);
      if (def) {
        return {
          id: def.id,
          name: def.name,
          slug: def.slug,
          description: def.description,
          location: def.location,
          completion_year: def.completion_year,
          project_type: def.category_name,
          coverUrl: def.cover_image_url || '/images/hero_background.png',
          category: { name: def.category_name, slug: def.category_slug },
          tags: def.tags,
          galleryImages: def.gallery_urls.map((url) => ({ url, alt: def.name })),
        };
      }
      return null;
    }

    // Resolve cover image
    let coverUrl = '/images/hero_background.png';
    if (project.cover_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', project.cover_image_id)
        .maybeSingle();
      if (media) coverUrl = media.public_url;
    }

    // Map relationships
    const category = project.portfolio_categories;
    const tags: string[] = project.portfolio_project_tags?.map((t) => t.portfolio_tags?.name).filter(Boolean) ?? [];
    const galleryImages: { url: string; alt: string }[] = (project.portfolio_project_images ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => ({
        url: img.media_library?.public_url ?? '',
        alt: img.media_library?.alt_text ?? project.name,
      }))
      .filter((img) => img.url);

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      location: project.location,
      completion_year: project.completion_year,
      project_type: project.project_type,
      coverUrl,
      category,
      tags,
      galleryImages,
    };
  },
  ['portfolio-project-detail-by-slug'],
  { revalidate: REVALIDATE_CONTENT, tags: ['public-content', 'portfolio'] }
);

export const getCachedPortfolioProjectBySlug = async (slug: string, version?: number) => {
  const v = version !== undefined ? version : await getCachedSiteCacheVersion();
  return fetchPortfolioProjectBySlug(slug, v);
};
