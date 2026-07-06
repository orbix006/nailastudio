import { getPdfTemplatesAction } from '@/lib/pdf-actions';
import { PdfGeneratorClient } from './PdfGeneratorClient';

export const dynamic = 'force-dynamic';

export default async function AdminPdfPage() {
  const templates = await getPdfTemplatesAction();
  return <PdfGeneratorClient initialTemplates={templates} />;
}
