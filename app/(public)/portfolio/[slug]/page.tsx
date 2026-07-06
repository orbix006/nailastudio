import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPortfolioProjectSeo } from '@/lib/supabase/seo';
import { buildMetadata, buildPortfolioJsonLd } from '@/lib/seo';
import { getCachedPortfolioProjectBySlug, getCachedSiteCacheVersion } from '@/lib/supabase/cached-queries';
import { PremiumPortfolioDetailClient } from './PremiumPortfolioDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getPortfolioProjectSeo(slug);
  return buildMetadata(seo, { canonicalPath: `/portfolio/${slug}` });
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const version = await getCachedSiteCacheVersion();
  const [project, seo] = await Promise.all([
    getCachedPortfolioProjectBySlug(slug, version),
    getPortfolioProjectSeo(slug),
  ]);

  if (!project) notFound();

  const jsonLd = buildPortfolioJsonLd({
    name: project.name,
    description: project.description ?? null,
    cover_image_url: project.coverUrl,
    slug: project.slug,
  });

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {seo.structured_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structured_data) }}
        />
      )}

      {/* Main Page Layout Wrapper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-28">
        <PremiumPortfolioDetailClient project={project as unknown as Parameters<typeof PremiumPortfolioDetailClient>[0]['project']} />
      </div>
    </div>
  );
}
