'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from './server';
import { sendEmailNotification } from './email-actions';

const settingsPath = path.join(process.cwd(), 'lib', 'booking-settings.json');

export interface BookingSettings {
  start_time: string;
  end_time: string;
  slot_duration: number; // in minutes
  working_days: number[]; // 0=Sunday, 1=Monday, etc.
  holidays: string[]; // YYYY-MM-DD
}

// 1. Fetch current settings
export async function getBookingSettingsAction(): Promise<BookingSettings> {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading booking settings:', err);
    throw new Error('Failed to load scheduling configuration.');
  }
}

// 2. Save settings
export async function saveBookingSettingsAction(settings: BookingSettings) {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error writing booking settings:', err);
    const msg = err instanceof Error ? err.message : 'Save failed';
    return { error: msg };
  }
}

// Helper to generate list of times based on settings
function generateTimeSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let currentMin = startH * 60 + startM;
  const targetEndMin = endH * 60 + endM;

  while (currentMin + duration <= targetEndMin) {
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMin += duration;
  }
  return slots;
}

// 3. Query available slots for a given date
export async function getAvailableSlotsAction(dateStr: string): Promise<string[]> {
  try {
    const settings = await getBookingSettingsAction();
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0-6

    // A. Check if the day is a holiday
    if (settings.holidays.includes(dateStr)) {
      return [];
    }

    // B. Check if day of week is a working day
    if (!settings.working_days.includes(dayOfWeek)) {
      return [];
    }

    // C. Generate all default slots
    const allSlots = generateTimeSlots(settings.start_time, settings.end_time, settings.slot_duration);

    // D. Fetch existing bookings from database inquiries table
    const supabase = await createClient();
    const { data: bookedItems, error } = await supabase
      .from('inquiries')
      .select('internal_notes')
      .eq('follow_up_date', dateStr)
      .is('deleted_at', null);

    if (error) {
      console.error('Database query failed for bookings check:', error);
      throw error;
    }

    // Parse bookings to identify occupied times
    const occupiedTimes: string[] = [];
    (bookedItems || []).forEach(item => {
      if (item.internal_notes) {
        try {
          const parsed = JSON.parse(item.internal_notes);
          if (parsed && parsed.type === 'booking' && parsed.time) {
            occupiedTimes.push(parsed.time);
          }
        } catch {
          // Plain text note, ignore
        }
      }
    });

    // E. Filter out booked slots
    return allSlots.filter(slot => !occupiedTimes.includes(slot));
  } catch (err) {
    console.error('Error calculating slots availability:', err);
    return [];
  }
}

export interface BookingPayload {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  message?: string;
  project_type_id?: string;
}

// 4. Create client booking session
export async function createBookingAction(payload: BookingPayload) {
  try {
    const supabase = await createClient();
    
    // A. Double-booking check validation
    const available = await getAvailableSlotsAction(payload.date);
    if (!available.includes(payload.time)) {
      return { error: 'This session time slot has already been reserved. Please select another time.' };
    }

    // B. Save booking parameters into internal_notes JSON
    const internalNotes = JSON.stringify({
      notes: payload.message || 'Consultation appointment scheduled.',
      attachments: [],
      type: 'booking',
      time: payload.time,
      duration: 60,
    });

    // C. Insert lead record
    const { error: insertErr, data: inquiry } = await supabase
      .from('inquiries')
      .insert({
        name: payload.name,
        email: payload.email,
        phone_number: payload.phone,
        source: 'consultation_popup',
        follow_up_date: payload.date,
        internal_notes: internalNotes,
        status: 'new',
        message: `Scheduled Consultation Session on ${payload.date} at ${payload.time}.`,
        project_type_id: payload.project_type_id || null,
      })
      .select('id')
      .maybeSingle();

    if (insertErr) throw insertErr;

    // D. Trigger confirmation email to client
    const emailVars = {
      CLIENT_NAME: payload.name,
      CLIENT_EMAIL: payload.email,
      MESSAGE: `<p>Your luxury interior styling session has been scheduled for <strong>${payload.date}</strong> at <strong>${payload.time}</strong>.</p>`,
    };

    sendEmailNotification('booking_confirmation', payload.email, emailVars).catch((err) =>
      console.error('Booking confirmation email fail:', err)
    );

    // D2. Trigger alert email to admin
    sendEmailNotification('admin_notification', 'admin@thenailaastudio.com', {
      CLIENT_NAME: payload.name,
      CLIENT_EMAIL: payload.email,
      MESSAGE: `New appointment booking submitted. Client scheduled styling consultation on ${payload.date} at ${payload.time}.`,
    }).catch((err) =>
      console.error('Booking admin alert email fail:', err)
    );

    return { success: true, bookingId: inquiry?.id };
  } catch (err: unknown) {
    console.error('Failed to create booking:', err);
    const msg = err instanceof Error ? err.message : 'Scheduling failed';
    return { error: msg };
  }
}
