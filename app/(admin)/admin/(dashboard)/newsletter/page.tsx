import { getSubscribersAction, getCampaignsAction } from '@/lib/newsletter-actions';
import { NewsletterCmsClient } from './NewsletterCmsClient';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const [subscribers, campaigns] = await Promise.all([
    getSubscribersAction(),
    getCampaignsAction(),
  ]);

  return (
    <NewsletterCmsClient 
      initialSubscribers={subscribers} 
      initialCampaigns={campaigns} 
    />
  );
}
