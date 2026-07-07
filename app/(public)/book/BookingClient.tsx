'use client';

import * as React from 'react';
import { Calendar, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { getAvailableSlotsAction, createBookingAction } from '@/lib/supabase/booking-actions';
import { Button } from '@/components/ui/Button';

interface ProjectType {
  id: string;
  title: string;
}

interface BookingClientProps {
  projectTypes: ProjectType[];
}

export function BookingClient({ projectTypes }: BookingClientProps) {
  const [step, setStep] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState('');

  // Client Details
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [projectTypeId, setProjectTypeId] = React.useState('');
  const [message, setMessage] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successBookingId, setSuccessBookingId] = React.useState('');

  // Get tomorrow's date string as minimum
  const minDate = React.useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Fetch slot options when date is changed
  React.useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime('');
      const slots = await getAvailableSlotsAction(selectedDate);
      setAvailableSlots(slots);
      setLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate]);

  // Handle scheduling submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !email || !phone) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const result = await createBookingAction({
      name,
      email,
      phone,
      date: selectedDate,
      time: selectedTime,
      message,
      project_type_id: projectTypeId || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessBookingId(result.bookingId || 'confirmed');
      setStep(3);
    } else {
      setErrorMsg(result.error || 'Failed to complete appointment booking.');
    }
  };

  return (
    <main className="min-h-screen bg-[#111111] text-white flex justify-center items-center py-20 px-4 sm:px-6">
      
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#C9A86A]/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#161616] border border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        
        {/* Banner highlight line */}
        <div className="h-1.5 bg-gradient-to-r from-[#8A7052] via-[#C9A86A] to-[#8A7052]" />

        {/* Dynamic step view */}
        <div className="p-8 sm:p-10">
          
          {/* Step 1: Choose Date & Time */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center justify-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Book Consultation
                </span>
                <h1 className="font-serif text-3xl font-light text-white mt-2">
                  Select Date & Time
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  Schedule your luxury interior design consultation session.
                </p>
              </div>

              <div className="space-y-4">
                {/* Date select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A] transition-all"
                  />
                </div>

                {/* Slots select grid */}
                {selectedDate && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-2">
                      Available Time Slots
                    </label>

                    {loadingSlots ? (
                      <div className="text-center py-6 text-xs text-gray-500 flex justify-center items-center gap-2">
                        <span className="h-4 w-4 border-2 border-[#C9A86A] border-t-transparent rounded-full animate-spin" />
                        Calculating slot availabilities...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        No available slots on this day. Please choose another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-3 px-2 rounded-lg text-xs font-semibold tracking-wider text-center border cursor-pointer transition-all ${
                              selectedTime === slot
                                ? 'bg-[#C9A86A] border-[#C9A86A] text-[#111111] font-bold shadow-[0_0_12px_rgba(201,168,106,0.25)]'
                                : 'bg-[#111111] border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedDate && selectedTime && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-[#C9A86A] text-[#111111] flex items-center justify-center gap-1.5"
                >
                  Enter Client Details <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Customer Details form */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-2 border-b border-gray-850 pb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="font-serif text-lg text-white">Client Information</h3>
                  <p className="text-[10px] text-gray-500">
                    Scheduled for {selectedDate} at {selectedTime}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-850 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. eleanor@vance.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-850 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919319441282"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-850 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                    Project Styling Category
                  </label>
                  <select
                    value={projectTypeId}
                    onChange={(e) => setProjectTypeId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-850 bg-[#111111] text-sm text-white outline-none focus:border-[#C9A86A] transition-all"
                  >
                    <option value="">General Consultation</option>
                    {projectTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                  Additional Scope / Design Vision
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your design space, colors preferences, budgets parameters..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-850 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C9A86A] text-[#111111]"
              >
                {isSubmitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
              </Button>
            </form>
          )}

          {/* Step 3: Success Confirmation Screen */}
          {step === 3 && (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold">Booking Confirmed</span>
                <h2 className="font-serif text-3xl font-light text-white mt-2">
                  You are Scheduled!
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  We look forward to partnering and designing your dream spaces.
                </p>
              </div>

              <div className="max-w-md mx-auto p-5 rounded-lg bg-[#111111] border border-gray-850 text-xs text-left space-y-3">
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Client Name:</span>
                  <span className="text-white font-semibold">{name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Scheduled Date:</span>
                  <span className="text-[#C9A86A] font-semibold">{selectedDate}</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Appointment Time:</span>
                  <span className="text-[#C9A86A] font-semibold">{selectedTime}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500">Confirmation ID:</span>
                  <span className="text-gray-400 font-mono select-all">{successBookingId.slice(0, 8)}...</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500">
                A confirmation email containing styling preparation checklists has been dispatched to {email}.
              </p>
            </div>
          )}

        </div>
      </div>

    </main>
  );
}
