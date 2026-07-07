export const dynamic = 'force-dynamic';

import * as React from 'react';
import {
  getCachedWebsiteSettings,
  getCachedSocialLinks,
  getCachedProjectTypes,
  getCachedConsultationPopupSettings,
  getCachedThemeSettings,
  getCachedSiteCacheVersion,
} from '@/lib/supabase/cached-queries';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import nextDynamic from 'next/dynamic';

const FloatingControls = nextDynamic(
  () => import('@/components/public/FloatingControls').then((mod) => mod.FloatingControls)
);

const LayoutInquiryModal = nextDynamic(
  () => import('@/components/public/LayoutInquiryModal').then((mod) => mod.LayoutInquiryModal)
);

const ConsultationPopup = nextDynamic(
  () => import('@/components/public/ConsultationPopup').then((mod) => mod.ConsultationPopup)
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current cache version dynamically
  const version = await getCachedSiteCacheVersion();

  // Parallel fetch all layout data
  const [settings, socials, projectTypes, popupSettings, theme] = await Promise.all([
    getCachedWebsiteSettings(version),
    getCachedSocialLinks(version),
    getCachedProjectTypes(version),
    getCachedConsultationPopupSettings(version),
    getCachedThemeSettings(version),
  ]);

  const whatsappLink = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(settings.whatsapp_default_message || '')}`
    : socials.find((s) => s.platform === 'whatsapp')?.url || null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Preconnect to Font Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Dynamic Font Loader */}
      <link 
        rel="stylesheet" 
        href={`https://fonts.googleapis.com/css2?family=${theme.heading_font.replace(/ /g, '+')}:wght@300;400;500;600;700;800&family=${theme.body_font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`} 
      />

      {/* Dynamic Color/Font style overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --color-primary: ${theme.primary_color} !important;
            --color-secondary: ${theme.secondary_color} !important;
            --color-accent: ${theme.accent_color} !important;
            --primary: ${theme.primary_color} !important;
            --secondary: ${theme.secondary_color} !important;
            --accent: ${theme.accent_color} !important;
            --font-playfair: "${theme.heading_font}", serif !important;
            --font-inter: "${theme.body_font}", sans-serif !important;
            --radius-md: ${theme.button_border_radius_px}px !important;
          }
          button, .rounded-md, select, input, textarea {
            border-radius: ${theme.button_border_radius_px}px !important;
          }
        `
      }} />

      {/* Google Analytics Tag Injection */}
      {settings.google_analytics_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`} />
          <script dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.google_analytics_id}');
            `
          }} />
        </>
      )}

      {/* Facebook Pixel Tracking Injection */}
      {settings.facebook_pixel_id && (
        <script dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.facebook_pixel_id}');
            fbq('track', 'PageView');
          `
        }} />
      )}
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#C9A86A] focus:text-[#111111] focus:font-semibold focus:rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:ring-offset-2 focus:ring-offset-black"
      >
        Skip to Main Content
      </a>

      {/* Header Bar */}
      <Header
        companyName={settings.company_name}
        logoUrl={settings.logo_url}
        contactPhone={settings.contact_phone}
      />

      {/* Main Page Area */}
      <main id="main-content" tabIndex={-1} className="flex-grow pt-20 bg-white dark:bg-[#111111] transition-colors duration-300 focus:outline-none">
        {children}
      </main>

      {/* Footer Block */}
      <Footer
        companyName={settings.company_name}
        logoUrl={settings.logo_url}
        description={settings.company_description}
        address={settings.business_address}
        phone={settings.contact_phone}
        email={settings.contact_email}
        hours={settings.business_hours_text}
        socials={socials}
      />

      {/* Floating Controls (WhatsApp + Scroll to Top) */}
      <FloatingControls whatsappUrl={whatsappLink} phone={settings.contact_phone} />

      {/* Global Inquiry Modal Trigger */}
      <LayoutInquiryModal projectTypes={projectTypes} />

      {/* Database-Driven Consultation Popup */}
      <ConsultationPopup settings={popupSettings} projectTypes={projectTypes} />
    </div>
  );
}
