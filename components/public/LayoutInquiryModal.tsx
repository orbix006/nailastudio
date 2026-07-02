'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { InquiryForm } from '@/components/public/InquiryForm';
import { ProjectType } from '@/lib/supabase/queries';

interface LayoutInquiryModalProps {
  projectTypes: ProjectType[];
}

export function LayoutInquiryModal({ projectTypes }: LayoutInquiryModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [source, setSource] = React.useState<
    'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal'
  >('header_cta');
  const [prefilledTypeId, setPrefilledTypeId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<{
        source: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal';
        prefilledProjectTypeId?: string;
      }>;
      
      if (customEvent.detail) {
        setSource(customEvent.detail.source || 'header_cta');
        setPrefilledTypeId(customEvent.detail.prefilledProjectTypeId);
        setIsOpen(true);
      }
    };

    window.addEventListener('open-inquiry-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-inquiry-modal', handleOpenModal);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Consultation"
      size="md"
      className="border-[#C9A86A]/25 max-w-lg"
    >
      <div className="pt-4">
        <InquiryForm
          projectTypes={projectTypes}
          source={source}
          prefilledProjectTypeId={prefilledTypeId}
          onSuccess={handleClose}
        />
      </div>
    </Modal>
  );
}
