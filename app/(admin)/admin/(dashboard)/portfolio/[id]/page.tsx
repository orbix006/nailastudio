import React from 'react';
import { ProjectForm } from '@/components/admin/ProjectForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectForm projectId={id} />;
}
