'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import {
  TrendingUp,
  MousePointer,
  MessageSquare,
  Activity,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LineChart } from '@/components/admin/analytics/LineChart';
import { DonutChart } from '@/components/admin/analytics/DonutChart';
import { BarChart } from '@/components/admin/analytics/BarChart';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  page_slug: string | null;
  session_id: string | null;
  referrer: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type FilterType = 'today' | '7d' | '30d' | 'custom';

export default function AnalyticsDashboardPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [filter, setFilter] = useState<FilterType>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw database records
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  // Name lookups for relations
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [projectsMap, setProjectsMap] = useState<Record<string, string>>({});

  // Initialize custom dates with default values (last 7 days)
  useEffect(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(past.getDate() - 6);

    setCustomStartDate(past.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch Lookup Data (Services & Projects)
  const fetchLookups = useCallback(async () => {
    try {
      const [servicesRes, projectsRes] = await Promise.all([
        supabase.from('services').select('id, title'),
        supabase.from('portfolio_projects').select('id, name'),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const sMap: Record<string, string> = {};
      servicesRes.data?.forEach((s) => {
        sMap[s.id] = s.title;
      });

      const pMap: Record<string, string> = {};
      projectsRes.data?.forEach((p) => {
        pMap[p.id] = p.name;
      });

      setServicesMap(sMap);
      setProjectsMap(pMap);
      return { services: sMap, projects: pMap };
    } catch (err) {
      console.error('Failed to load lookup data:', err);
      throw new Error('Could not retrieve service and project details.');
    }
  }, [supabase]);

  // Compute time bounds for filter type
  const getDateRangeBounds = useCallback((
    filterType: FilterType,
    startStr: string,
    endStr: string
  ) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = new Date();
    if (filterType === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (filterType === '7d') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (filterType === '30d') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (filterType === 'custom') {
      if (startStr) {
        start = new Date(startStr);
        start.setHours(0, 0, 0, 0);
      }
      if (endStr) {
        const customEnd = new Date(endStr);
        customEnd.setHours(23, 59, 59, 999);
        return { start, end: customEnd };
      }
    }

    return { start, end };
  }, []);

  // Main fetch function
  const loadAnalytics = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);

      // Validate custom range if applicable
      if (filter === 'custom' && customStartDate && customEndDate) {
        if (new Date(customStartDate) > new Date(customEndDate)) {
          setError('Invalid Date Range: Start date cannot be after end date.');
          setLoading(false);
          return;
        }
      }

      // Fetch lookup maps if missing
      if (isRetry || Object.keys(servicesMap).length === 0 || Object.keys(projectsMap).length === 0) {
        await fetchLookups();
      }

      const { start, end } = getDateRangeBounds(filter, customStartDate, customEndDate);

      const { data, error: queryError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;

      setEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching analytics events:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to query analytics database records.';
      setError(errMsg);
      toast('Error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    filter,
    customStartDate,
    customEndDate,
    supabase,
    fetchLookups,
    getDateRangeBounds,
    servicesMap,
    projectsMap,
    toast,
  ]);

  // Load analytics when filter values change
  useEffect(() => {
    // Avoid running check on empty inputs when initializing
    if (filter === 'custom' && (!customStartDate || !customEndDate)) return;
    loadAnalytics();
  }, [filter, customStartDate, customEndDate, loadAnalytics]);

  // Helper helper to generate timeline data slots for the LineChart
  const generateTimeSlots = useCallback((
    filterType: FilterType,
    start: Date,
    end: Date
  ) => {
    const slots: { label: string; dateKey: string; sessions: Set<string> }[] = [];

    if (filterType === 'today') {
      // 24 Hour Slots
      for (let h = 0; h < 24; h++) {
        const label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
        slots.push({
          label,
          dateKey: String(h),
          sessions: new Set(),
        });
      }
    } else {
      // Daily Slots
      const current = new Date(start);
      const endLimit = new Date(end);
      let safetyCounter = 0;

      while (current <= endLimit && safetyCounter < 100) {
        const dateKey = current.toDateString();
        const label = current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        slots.push({
          label,
          dateKey,
          sessions: new Set(),
        });
        current.setDate(current.getDate() + 1);
        safetyCounter++;
      }
    }
    return slots;
  }, []);

  const handleRetry = () => {
    loadAnalytics(true);
  };

  // ----------------------------------------------------
  // DATA AGGREGATION & PROCESSING
  // ----------------------------------------------------
  const hasEvents = events && events.length > 0;

  // 1. Dashboard card counts
  const totalPageViews = events.filter((e) => e.event_type === 'page_view').length;
  const contactFormSubmissions = events.filter((e) => e.event_type === 'contact_form_submit').length;
  const popupSubmissions = events.filter((e) => e.event_type === 'popup_submit').length;
  const serviceViews = events.filter((e) => e.event_type === 'service_view').length;
  const portfolioViews = events.filter((e) => e.event_type === 'portfolio_view').length;
  const buttonClicks = events.filter((e) => e.event_type === 'button_click').length;

  // 2. Daily Visitors Timeline (unique session_id per day/hour)
  const bounds = getDateRangeBounds(filter, customStartDate, customEndDate);
  const timeSlots = generateTimeSlots(filter, bounds.start, bounds.end);

  events.forEach((e) => {
    const eDate = new Date(e.created_at);
    const sessionKey = e.session_id || e.ip_address || e.id;

    if (filter === 'today') {
      const hour = eDate.getHours();
      const slot = timeSlots.find((s) => s.dateKey === String(hour));
      if (slot) slot.sessions.add(sessionKey);
    } else {
      const dateStr = eDate.toDateString();
      const slot = timeSlots.find((s) => s.dateKey === dateStr);
      if (slot) slot.sessions.add(sessionKey);
    }
  });

  const dailyVisitorsData = timeSlots.map((s) => ({
    label: s.label,
    value: s.sessions.size,
  }));

  // 3. Event Type Distribution Chart
  const eventDistributionData = [
    { type: 'page_view', label: 'Page Views', value: totalPageViews },
    { type: 'contact_form_submit', label: 'Contact Submissions', value: contactFormSubmissions },
    { type: 'popup_submit', label: 'Popup Submissions', value: popupSubmissions },
    { type: 'service_view', label: 'Service Views', value: serviceViews },
    { type: 'portfolio_view', label: 'Portfolio Views', value: portfolioViews },
    { type: 'button_click', label: 'Button Clicks', value: buttonClicks },
  ];

  // 4. Most Viewed Services rankings
  const serviceCounts: Record<string, number> = {};
  events
    .filter((e) => e.event_type === 'service_view' && e.entity_id)
    .forEach((e) => {
      const id = e.entity_id!;
      serviceCounts[id] = (serviceCounts[id] || 0) + 1;
    });

  const topServicesData = Object.entries(serviceCounts)
    .map(([id, count]) => ({
      label: servicesMap[id] || 'Unknown Service',
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 5. Most Viewed Portfolio Projects rankings
  const projectCounts: Record<string, number> = {};
  events
    .filter((e) => e.event_type === 'portfolio_view' && e.entity_id)
    .forEach((e) => {
      const id = e.entity_id!;
      projectCounts[id] = (projectCounts[id] || 0) + 1;
    });

  const topProjectsData = Object.entries(projectCounts)
    .map(([id, count]) => ({
      label: projectsMap[id] || 'Unknown Project',
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-8 font-sans text-white pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-800/60 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Performance Dashboard
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">
            Studio Web Analytics
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Analyze studio engagement, click funnels, views popularity, and form conversion metrics.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex bg-[#111111] p-1 rounded-lg border border-gray-850">
            {(['today', '7d', '30d', 'custom'] as const).map((t) => {
              const labelMap: Record<FilterType, string> = {
                today: 'Today',
                '7d': '7 Days',
                '30d': '30 Days',
                custom: 'Custom',
              };
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer whitespace-nowrap ${
                    filter === t
                      ? 'bg-[#C9A86A] text-[#111111]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {labelMap[t]}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics(true)}
            className="flex items-center justify-center p-2 rounded-lg border border-gray-800 bg-[#1A1A1A] hover:bg-[#252525] text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh database records"
            aria-label="Refresh database records"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#C9A86A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {filter === 'custom' && (
        <div className="p-4 rounded-xl border border-gray-800 bg-[#1A1A1A] animate-fade-in flex flex-col sm:flex-row sm:items-end gap-4 max-w-2xl">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-gray-800 focus:border-[#C9A86A] rounded-lg text-xs font-mono text-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-gray-800 focus:border-[#C9A86A] rounded-lg text-xs font-mono text-white outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content states */}
      {loading ? (
        <div className="space-y-8">
          {/* Skeletons: Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 border border-gray-800 bg-[#1A1A1A]">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-2 w-20" />
              </Card>
            ))}
          </div>

          {/* Skeletons: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-4 w-64 mb-6" />
              <Skeleton className="h-48 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-4 w-64 mb-6" />
              <div className="flex justify-center py-6">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
            </Card>
          </div>

          {/* Skeletons: Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <Skeleton className="h-5 w-48 mb-6" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </Card>
            <Card className="p-6">
              <Skeleton className="h-5 w-48 mb-6" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </Card>
          </div>
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState
            title="Unable to Load Dashboard Data"
            message={error}
            onRetry={handleRetry}
            retryText="Retry Fetching"
          />
        </div>
      ) : !hasEvents ? (
        <div className="py-12">
          <EmptyState
            title="No analytics yet."
            description="There are no tracked analytics events registered in the database for the selected date range. Try broadening your filter parameters or exploring the public-facing pages to log some events."
          />
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Dashboard Summary Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Total Page Views */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Total Page Views
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-white">
                  {totalPageViews.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <Activity className="h-3.5 w-3.5 text-[#C9A86A]" />
                <span>Page views</span>
              </div>
            </Card>

            {/* Contact Form Submissions */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Form Submissions
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-[#C9A86A]">
                  {contactFormSubmissions.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>Contact inquiries</span>
              </div>
            </Card>

            {/* Popup Submissions */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Popup Submissions
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-white">
                  {popupSubmissions.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                <span>Consultation popups</span>
              </div>
            </Card>

            {/* Service Views */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Service Views
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-white">
                  {serviceViews.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span>Menu items</span>
              </div>
            </Card>

            {/* Portfolio Views */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Portfolio Views
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-white">
                  {portfolioViews.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <Eye className="h-3.5 w-3.5 text-orange-400" />
                <span>Project views</span>
              </div>
            </Card>

            {/* Button Clicks */}
            <Card hoverEffect className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">
                  Button Clicks
                </span>
                <p className="font-serif text-2xl font-bold mt-1 text-white">
                  {buttonClicks.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-t border-gray-800/40 pt-2 shrink-0">
                <MousePointer className="h-3.5 w-3.5 text-slate-400" />
                <span>CTA element clicks</span>
              </div>
            </Card>
          </div>

          {/* Core Visualizer Charts Grid (Line & Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LineChart
                data={dailyVisitorsData}
                title="Daily Unique Visitors"
                description={`Visualizes unique website visitor sessions over the selected range.`}
                metricLabel="Unique Visitors"
              />
            </div>
            <div>
              <DonutChart
                data={eventDistributionData}
                title="Event Type Distribution"
                description="Distribution of interaction triggers."
              />
            </div>
          </div>

          {/* Rankings Grid (Services & Projects Popularity lists) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BarChart
              data={topServicesData}
              title="Most Viewed Services"
              description="Ranked listings of specific service page click-throughs."
              unit="views"
            />
            <BarChart
              data={topProjectsData}
              title="Most Viewed Portfolio Projects"
              description="Ranked listings of design portfolio project detail views."
              unit="views"
            />
          </div>
        </div>
      )}
    </div>
  );
}
