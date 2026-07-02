export const dynamic = 'force-dynamic';

import * as React from 'react';
import {
  getWebsiteSettings,
  getSocialLinks,
  getProjectTypes,
  getConsultationPopupSettings,
} from '@/lib/supabase/queries';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { FloatingControls } from '@/components/public/FloatingControls';
import { LayoutInquiryModal } from '@/components/public/LayoutInquiryModal';
import { ConsultationPopup } from '@/components/public/ConsultationPopup';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parallel fetch operations on Server Components
  const settings = await getWebsiteSettings();
  const socials = await getSocialLinks();
  const projectTypes = await getProjectTypes();
  const popupSettings = await getConsultationPopupSettings();

  const whatsappLink = socials.find((s) => s.platform === 'whatsapp')?.url || null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Bar */}
      <Header
        companyName={settings.company_name}
        logoUrl={settings.logo_url}
        contactPhone={settings.contact_phone}
      />

      {/* Main Page Area */}
      <main className="flex-grow pt-20 bg-white dark:bg-[#111111] transition-colors duration-300">
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
