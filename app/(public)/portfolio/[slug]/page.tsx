import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPortfolioProjectSeo } from '@/lib/supabase/seo';
import { buildMetadata, buildPortfolioJsonLd } from '@/lib/seo';
import { getCachedPortfolioProjectBySlug, getCachedSiteCacheVersion } from '@/lib/supabase/cached-queries';
import Image from 'next/image';

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
  const project = await getCachedPortfolioProjectBySlug(slug, version);

  if (!project) notFound();

  const coverUrl = project.coverUrl;
  const category = project.category;
  const tags = project.tags;
  const galleryImages = project.galleryImages;

  const jsonLd = buildPortfolioJsonLd({
    name: project.name,
    description: project.description ?? null,
    cover_image_url: coverUrl,
    slug: project.slug,
  });

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Hero cover */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <Image
          src={coverUrl}
          alt={project.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-10 left-0 right-0 px-8 md:px-16">
          {category?.name && (
            <span className="inline-block text-xs uppercase tracking-widest text-[#C9A86A] mb-3 font-medium">
              {category.name}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-playfair font-light leading-tight">{project.name}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/60">
            {project.location && <span>📍 {project.location}</span>}
            {project.completion_year && <span>🗓 {project.completion_year}</span>}
            {project.project_type && <span>🏷 {project.project_type}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16">
        {project.description && (
          <div className="mb-12">
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-4">Overview</h2>
            <p className="text-white/80 text-lg leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-12 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs border border-[#C9A86A]/40 text-[#C9A86A] rounded-full uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-6">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryImages.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
