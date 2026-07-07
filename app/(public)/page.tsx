import type { Metadata } from 'next';
import {
  getCachedHeroSettings,
  getCachedAboutContent,
  getCachedServices,
  getCachedPortfolioCategories,
  getCachedPortfolioProjects,
  getCachedDesignProcess,
  getCachedWhyChooseUs,
  getCachedCoreValues,
  getCachedDesignPhilosophy,
  getCachedWebsiteSettings,
  getCachedProjectTypes,
  getCachedSiteCacheVersion,
} from '@/lib/supabase/cached-queries';
import { getPageSeo } from '@/lib/supabase/seo';
import { buildMetadata, buildLocalBusinessJsonLd } from '@/lib/seo';

import nextDynamic from 'next/dynamic';
import { Hero } from '@/components/public/Hero';
import { About } from '@/components/public/About';
import { DesignProcess } from '@/components/public/DesignProcess';
import { BrandPhilosophy } from '@/components/public/BrandPhilosophy';

// Dynamically import heavy interactive components to split their JS bundles
const Services = nextDynamic(
  () => import('@/components/public/Services').then((m) => ({ default: m.Services })),
  { loading: () => <div className="py-24 bg-[#141414]" /> }
);

const Portfolio = nextDynamic(
  () => import('@/components/public/Portfolio').then((m) => ({ default: m.Portfolio })),
  { loading: () => <div className="py-24 bg-[#111111]" /> }
);

const Contact = nextDynamic(
  () => import('@/components/public/Contact').then((m) => ({ default: m.Contact })),
  { loading: () => <div className="py-24 bg-[#111111]" /> }
);

const Faq = nextDynamic(
  () => import('@/components/public/Faq').then((m) => ({ default: m.Faq })),
  { loading: () => <div className="py-24 bg-[#111111]" /> }
);


export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('home');
  return buildMetadata(seo, { canonicalPath: '/' });
}

export default async function Home() {
  const version = await getCachedSiteCacheVersion();

  // Parallel fetch all data in one go — significantly reduces TTFB
  const [
    heroSettings,
    aboutContent,
    services,
    categories,
    projects,
    steps,
    whyChooseUs,
    coreValues,
    philosophy,
    settings,
    projectTypes,
    seo,
  ] = await Promise.all([
    getCachedHeroSettings(version),
    getCachedAboutContent(version),
    getCachedServices(version),
    getCachedPortfolioCategories(version),
    getCachedPortfolioProjects(version),
    getCachedDesignProcess(version),
    getCachedWhyChooseUs(version),
    getCachedCoreValues(version),
    getCachedDesignPhilosophy(version),
    getCachedWebsiteSettings(version),
    getCachedProjectTypes(version),
    getPageSeo('home'),
  ]);

  // JSON-LD Structured Data
  const localBusinessJsonLd = buildLocalBusinessJsonLd(settings);

  return (
    <div className="flex flex-col w-full min-h-screen bg-stone-50 dark:bg-[#111111] overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: localBusinessJsonLd }}
      />
      {seo.structured_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structured_data) }}
        />
      )}
      {/* 1. Hero Section */}
      <Hero settings={heroSettings} />

      {/* 2. About Story Blocks */}
      <About content={aboutContent} />

      {/* 3. Brand Philosophy, Why Choose Us, & Core Values */}
      <BrandPhilosophy
        philosophy={philosophy}
        whyChooseUs={whyChooseUs}
        coreValues={coreValues}
      />

      {/* 4. Services Grid Cards */}
      <Services services={services} />

      {/* 5. Custom Design Process Timeline */}
      <DesignProcess steps={steps} />

      {/* 6. Portfolio Showcase */}
      <Portfolio categories={categories} projects={projects} />

      {/* FAQ Accordion Section */}
      <Faq />

      {/* 7. Contact & Timings Map */}
      <Contact
        phone={settings.contact_phone}
        email={settings.contact_email}
        address={settings.business_address}
        hours={settings.business_hours_text}
        projectTypes={projectTypes}
      />
    </div>
  );
}
