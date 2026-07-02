'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { InquiryForm } from '@/components/public/InquiryForm';
import { ProjectType, ConsultationPopupSettings } from '@/lib/supabase/queries';

interface ConsultationPopupProps {
  settings: ConsultationPopupSettings;
  projectTypes: ProjectType[];
}

export function ConsultationPopup({ settings, projectTypes }: ConsultationPopupProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // 1. Exit if popup is disabled
    if (!settings.enabled) return;

    // 2. Exit if configured for once-per-session and already shown
    if (settings.show_once_per_session) {
      const shown = sessionStorage.getItem('consultation-popup-shown');
      if (shown === 'true') return;
    }

    // 3. Set trigger timer based on delay_seconds setting
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (settings.show_once_per_session) {
        sessionStorage.setItem('consultation-popup-shown', 'true');
      }
    }, settings.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [settings]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={settings.title || 'Request Consultation'}
      size="md"
      className="border-[#C9A86A]/25 max-w-lg"
    >
      <div className="pt-2 text-center">
        {settings.subtitle && (
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
            {settings.subtitle}
          </p>
        )}
        <InquiryForm
          projectTypes={projectTypes}
          source="consultation_popup"
          onSuccess={handleClose}
        />
      </div>
    </Modal>
  );
}
