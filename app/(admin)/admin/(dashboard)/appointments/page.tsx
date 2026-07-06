import { createClient } from '@/lib/supabase/server';
import { getBookingSettingsAction } from '@/lib/supabase/booking-actions';
import { AppointmentsClient } from './AppointmentsClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const settings = await getBookingSettingsAction();
  const supabase = await createClient();

  // Load bookings (inquiries containing scheduled dates & booking metadata notes)
  const { data: bookingsData } = await supabase
    .from('inquiries')
    .select(`
      *,
      project_types:project_type_id ( title )
    `)
    .not('follow_up_date', 'is', null)
    .is('deleted_at', null)
    .order('follow_up_date', { ascending: true });

  // Parse bookings to pass formatted array
  const formattedBookings = (bookingsData || [])
    .map(inq => {
      try {
        if (inq.internal_notes) {
          const parsed = JSON.parse(inq.internal_notes);
          if (parsed && parsed.type === 'booking') {
            return {
              id: inq.id,
              name: inq.name,
              email: inq.email,
              phone: inq.phone_number,
              date: inq.follow_up_date as string,
              time: parsed.time as string,
              duration: (parsed.duration || 60) as number,
              project_type: inq.project_types?.title || 'General Styling',
              status: inq.status,
              notes: parsed.notes || '',
            };
          }
        }
      } catch {
        // Plain inquiry note
      }
      return null;
    })
    .filter((b): b is Exclude<typeof b, null> => b !== null);

  return (
    <AppointmentsClient
      initialSettings={settings}
      bookings={formattedBookings}
    />
  );
}
