'use client';

import * as React from 'react';
import { Clock, Sliders, CalendarDays, Trash2, CheckCircle2, Mail, Phone } from 'lucide-react';
import { BookingSettings, saveBookingSettingsAction } from '@/lib/supabase/booking-actions';
import { Button } from '@/components/ui/Button';

interface BookedSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  project_type: string;
  status: string;
  notes: string;
}

interface AppointmentsClientProps {
  initialSettings: BookingSettings;
  bookings: BookedSession[];
}

export function AppointmentsClient({ initialSettings, bookings }: AppointmentsClientProps) {
  const [settings, setSettings] = React.useState<BookingSettings>(initialSettings);
  const [activeDayStr, setActiveDayStr] = React.useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default to tomorrow
  );

  // Settings State Form
  const [startTime, setStartTime] = React.useState(settings.start_time);
  const [endTime, setEndTime] = React.useState(settings.end_time);
  const [slotDuration, setSlotDuration] = React.useState(settings.slot_duration);
  const [workingDays, setWorkingDays] = React.useState<number[]>(settings.working_days);
  const [holidays, setHolidays] = React.useState<string[]>(settings.holidays);
  const [newHoliday, setNewHoliday] = React.useState('');

  const [savingSettings, setSavingSettings] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Calculate appointments for chosen day
  const dailyBookings = React.useMemo(() => {
    return bookings.filter(b => b.date === activeDayStr);
  }, [bookings, activeDayStr]);

  // Checkbox toggles for working days
  const handleWorkingDayToggle = (day: number) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  // Add a holiday date blackout
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday || holidays.includes(newHoliday)) return;
    setHolidays(prev => [...prev, newHoliday].sort());
    setNewHoliday('');
  };

  // Remove a holiday
  const handleRemoveHoliday = (holidayDate: string) => {
    setHolidays(prev => prev.filter(d => d !== holidayDate));
  };

  // Save changes
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveSuccess(false);

    const updated = {
      start_time: startTime,
      end_time: endTime,
      slot_duration: slotDuration,
      working_days: workingDays,
      holidays,
    };

    const result = await saveBookingSettingsAction(updated);
    setSavingSettings(false);

    if (result.success) {
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(result.error || 'Failed to save configurations.');
    }
  };

  // Compile map of dates with bookings
  const bookedDates = React.useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(b => dates.add(b.date));
    return dates;
  }, [bookings]);

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* Title Header */}
      <div className="border-b border-[#C9A86A]/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-light text-white tracking-wide">
            Appointment Scheduling Curator
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure consultation operating hours, specify holidays, and review calendar reservations.
          </p>
        </div>
        
        <div className="flex gap-2">
          <a
            href="/book"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border border-gray-800 bg-[#1A1A1A] hover:border-[#C9A86A]/30 text-[#C9A86A] transition-all"
          >
            Go to Booking Page
          </a>
        </div>
      </div>

      {/* Grid workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column Left/Center: Booking Calendar Overview */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
            
            {/* Calendar Input Panel */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-800 pb-2.5 flex items-center gap-1.5">
                <CalendarDays className="h-4.5 w-4.5" /> Date Selection
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                  Choose Calendar Date
                </label>
                <input
                  type="date"
                  value={activeDayStr}
                  onChange={(e) => setActiveDayStr(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A] transition-all"
                />
              </div>

              {/* Booking Quick metrics details */}
              <div className="p-3 bg-[#111111] border border-gray-850 rounded text-xs space-y-2">
                <p className="text-gray-400">Total Calendar Bookings: <span className="text-white font-bold">{bookings.length}</span></p>
                <p className="text-gray-400">Selected Date: <span className="text-[#C9A86A] font-bold">{activeDayStr}</span></p>
                <p className="text-gray-400">Status: {bookedDates.has(activeDayStr) ? (
                  <span className="text-emerald-400 font-bold">● Has Sessions Scheduled</span>
                ) : (
                  <span className="text-gray-500 font-medium">No Sessions Scheduled</span>
                )}</p>
              </div>

            </div>

            {/* Daily Sessions list view */}
            <div className="space-y-4 md:border-l md:border-gray-800 md:pl-6">
              <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-800 pb-2.5 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5" /> Daily Sessions ({dailyBookings.length})
              </h3>

              {dailyBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-550 italic">
                  No consultation appointments scheduled for this date.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {dailyBookings.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg border border-gray-850 bg-[#111111] space-y-2.5 animate-fade-in"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] tracking-wider text-[#C9A86A] font-bold uppercase block">{session.time}</span>
                          <h4 className="text-xs font-semibold text-white mt-0.5">{session.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold bg-[#C9A86A]/10 text-[#C9A86A] border border-[#C9A86A]/15">
                          {session.project_type}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-[10px] text-gray-400 border-t border-gray-850 pt-2">
                        <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-650" /> {session.email}</p>
                        <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-650" /> {session.phone}</p>
                      </div>

                      {session.notes && (
                        <p className="text-[9px] text-gray-500 border-t border-gray-850/60 pt-2 italic">
                          &ldquo;{session.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Bookings timeline/log view */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-800 pb-2.5 mb-4">
              All Scheduled Sessions
            </h3>

            {bookings.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-6 text-center">No reservations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                      <th className="p-3">Client</th>
                      <th className="p-3">Styling Date</th>
                      <th className="p-3">Time Slot</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-850 hover:bg-gray-900/20">
                        <td className="p-3 font-semibold text-white">{b.name}</td>
                        <td className="p-3 text-gray-300 font-mono">{b.date}</td>
                        <td className="p-3 text-[#C9A86A] font-mono">{b.time}</td>
                        <td className="p-3 text-gray-400">{b.project_type}</td>
                        <td className="p-3 text-gray-400">{b.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Column Right: Settings Manager Panel */}
        <div className="lg:col-span-4 bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 space-y-6">
          
          <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] flex items-center gap-1.5">
              <Sliders className="h-4.5 w-4.5" /> Scheduler Settings
            </h3>
            {saveSuccess && (
              <span className="text-[10px] text-green-400 font-medium flex items-center gap-0.5 animate-pulse">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <div className="space-y-4">
            
            {/* Operating hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                  Start Operating
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                  End Operating
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                />
              </div>
            </div>

            {/* Slot duration select */}
            <div>
              <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                Meeting slot duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>

            {/* Working days checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 block">
                Working Days
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => (
                  <label key={idx} className="flex items-center space-x-2 p-1.5 rounded border border-gray-850 hover:border-gray-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workingDays.includes(idx)}
                      onChange={() => handleWorkingDayToggle(idx)}
                      className="accent-[#C9A86A]"
                    />
                    <span className="text-[11px] text-gray-300">{dayName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Holiday blackout dates list */}
            <div className="space-y-2 pt-4 border-t border-gray-800/80">
              <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 block">
                Holiday Date Blackouts
              </label>

              <form onSubmit={handleAddHoliday} className="flex gap-2">
                <input
                  type="date"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#C9A86A] text-[#111111] hover:brightness-105 font-bold cursor-pointer text-xs uppercase"
                >
                  Add
                </button>
              </form>

              {holidays.length === 0 ? (
                <p className="text-[10px] text-gray-550 italic">No custom blackout dates configured.</p>
              ) : (
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {holidays.map((hDate) => (
                    <div key={hDate} className="flex items-center justify-between p-2 rounded bg-[#111111] border border-gray-850 text-xs">
                      <span className="font-mono text-gray-300">{hDate}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHoliday(hDate)}
                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                        title="Remove holiday blackout"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-[#C9A86A] text-[#111111] mt-4"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
            </Button>

          </div>

        </div>

      </div>
    </div>
  );
}
