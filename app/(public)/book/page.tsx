import { createClient } from '@/lib/supabase/server';
import { BookingClient } from './BookingClient';

export const dynamic = 'force-dynamic';

export default async function BookAppointmentPage() {
  const supabase = await createClient();
  const { data: projectTypes } = await supabase
    .from('project_types')
    .select('id, title')
    .is('deleted_at', null);

  return <BookingClient projectTypes={projectTypes || []} />;
}
