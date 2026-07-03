import React from 'react';
import { ServiceForm } from '@/components/admin/ServiceForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params;
  return <ServiceForm serviceId={id} />;
}
