import { getMarketingDataAction } from '@/lib/marketing-actions';
import { MarketingCmsClient } from './MarketingCmsClient';

export const dynamic = 'force-dynamic';

export default async function AdminMarketingPage() {
  const marketingData = await getMarketingDataAction();
  return <MarketingCmsClient initialData={marketingData} />;
}
