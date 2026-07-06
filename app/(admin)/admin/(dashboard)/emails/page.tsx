import { getEmailTemplatesAction } from '@/lib/supabase/email-actions';
import { EmailTemplatesClient } from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplatesAction();

  return <EmailTemplatesClient initialTemplates={templates} />;
}
