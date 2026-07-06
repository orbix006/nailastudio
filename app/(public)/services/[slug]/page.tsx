import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceSeo } from '@/lib/supabase/seo';
import { buildMetadata, buildServiceJsonLd } from '@/lib/seo';
import { getCachedServiceBySlug, getCachedSiteCacheVersion } from '@/lib/supabase/cached-queries';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getServiceSeo(slug);
  return buildMetadata(seo, { canonicalPath: `/services/${slug}` });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const version = await getCachedSiteCacheVersion();
  const [service, seo] = await Promise.all([
    getCachedServiceBySlug(slug, version),
    getServiceSeo(slug),
  ]);

  if (!service) notFound();

  const coverUrl = service.coverUrl;
  const features = service.features;
  const galleryUrls = service.galleryUrls;

  const jsonLd = buildServiceJsonLd({
    title: service.title,
    short_description: service.short_description ?? '',
    slug: service.slug,
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

      {/* Hero cover */}
      <div className="relative w-full h-[55vh] overflow-hidden">
        <Image
          src={coverUrl}
          alt={service.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-10 left-0 right-0 px-8 md:px-16">
          <span className="inline-block text-xs uppercase tracking-widest text-[#C9A86A] mb-3">Service</span>
          <h1 className="text-3xl md:text-5xl font-playfair font-light">{service.title}</h1>
          {service.short_description && (
            <p className="mt-3 text-white/70 text-lg max-w-2xl">{service.short_description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 space-y-14">
        {service.detailed_overview && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-4">Overview</h2>
            <p className="text-white/80 leading-relaxed text-lg">{service.detailed_overview}</p>
          </section>
        )}

        {service.design_approach && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-4">Design Approach</h2>
            <p className="text-white/80 leading-relaxed">{service.design_approach}</p>
          </section>
        )}

        {service.materials_finishes && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-4">Materials & Finishes</h2>
            <p className="text-white/80 leading-relaxed">{service.materials_finishes}</p>
          </section>
        )}

        {features && features.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-4">What&apos;s Included</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A86A] flex-shrink-0" />
                  {f.feature}
                </li>
              ))}
            </ul>
          </section>
        )}

        {galleryUrls.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#C9A86A] mb-6">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryUrls.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={url}
                    alt={`${service.title} gallery image ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
