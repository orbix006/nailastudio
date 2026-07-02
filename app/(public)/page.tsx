import {
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
  getWebsiteSettings,
  getProjectTypes,
} from '@/lib/supabase/queries';
import { Hero } from '@/components/public/Hero';
import { About } from '@/components/public/About';
import { Services } from '@/components/public/Services';
import { Portfolio } from '@/components/public/Portfolio';
import { DesignProcess } from '@/components/public/DesignProcess';
import { BrandPhilosophy } from '@/components/public/BrandPhilosophy';
import { Testimonials } from '@/components/public/Testimonials';
import { Contact } from '@/components/public/Contact';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Parallel fetch operations on Server Components
  const heroSettings = await getHeroSettings();
  const aboutContent = await getAboutContent();
  const services = await getServices();
  const categories = await getPortfolioCategories();
  const projects = await getPortfolioProjects();
  const steps = await getDesignProcess();
  const whyChooseUs = await getWhyChooseUs();
  const coreValues = await getCoreValues();
  const philosophy = await getDesignPhilosophy();
  const testimonials = await getTestimonials();
  const settings = await getWebsiteSettings();
  const projectTypes = await getProjectTypes();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#111111] overflow-x-hidden">
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

      {/* 6. Selected Artistry Portfolio Showcase */}
      <Portfolio categories={categories} projects={projects} />

      {/* 7. Client Reviews Grid */}
      <Testimonials testimonials={testimonials} />

      {/* 8. Contact & Timings Map */}
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
