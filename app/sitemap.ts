import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thenailaastudio.com';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/#about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/#services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/#portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/#contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const supabase = await createClient();

    // Fetch published portfolio projects for dynamic URLs
    const { data: projects } = await supabase
      .from('portfolio_projects')
      .select('slug, updated_at')
      .eq('is_published', true)
      .is('deleted_at', null);

    const projectRoutes: MetadataRoute.Sitemap = (projects || []).map((p) => ({
      url: `${siteUrl}/portfolio/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // Fetch visible services
    const { data: services } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('is_visible', true)
      .is('deleted_at', null);

    const serviceRoutes: MetadataRoute.Sitemap = (services || []).map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...projectRoutes, ...serviceRoutes];
  } catch {
    // Return static routes on DB failure
    return staticRoutes;
  }
}
