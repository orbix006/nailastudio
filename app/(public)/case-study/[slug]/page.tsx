import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPortfolioProjectSeo } from '@/lib/supabase/seo';
import { buildMetadata, buildPortfolioJsonLd } from '@/lib/seo';
import {
  getCachedPortfolioProjectBySlug,
  getCachedPortfolioProjects,
  getCachedSiteCacheVersion,
} from '@/lib/supabase/cached-queries';
import { CaseStudyClient } from './CaseStudyClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getPortfolioProjectSeo(slug);
  return buildMetadata(
    {
      ...seo,
      title: seo.title ? `Case Study — ${seo.title}` : 'Case Study',
    },
    { canonicalPath: `/case-study/${slug}` }
  );
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const version = await getCachedSiteCacheVersion();

  const [project, seo, allProjects] = await Promise.all([
    getCachedPortfolioProjectBySlug(slug, version),
    getPortfolioProjectSeo(slug),
    getCachedPortfolioProjects(version),
  ]);

  if (!project) notFound();

  // Build JSON-LD
  const jsonLd = buildPortfolioJsonLd({
    name: project.name,
    description: project.description ?? null,
    cover_image_url: project.coverUrl,
    slug: project.slug,
  });

  // Related projects — same category, exclude self, max 3
  const relatedProjects = (allProjects || [])
    .filter(p => p.id !== project.id && p.category_id === (project.category as { slug: string } | null)?.slug)
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      coverUrl: p.cover_image_url,
      category: p.category_name ? { name: p.category_name } : null,
    }));

  // If not enough same-category, backfill with other projects
  if (relatedProjects.length < 3) {
    const others = (allProjects || [])
      .filter(p => p.id !== project.id && !relatedProjects.find(r => r.id === p.id))
      .slice(0, 3 - relatedProjects.length)
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        coverUrl: p.cover_image_url,
        category: p.category_name ? { name: p.category_name } : null,
      }));
    relatedProjects.push(...others);
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {seo.structured_data && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structured_data) }} />
      )}
      <CaseStudyClient
        project={project as unknown as Parameters<typeof CaseStudyClient>[0]['project']}
        relatedProjects={relatedProjects}
      />
    </>
  );
}
