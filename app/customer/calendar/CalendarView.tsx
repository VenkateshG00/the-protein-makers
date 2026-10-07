'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Utensils } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore } from 'date-fns';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { SubscriptionCalendar, Subscription, Meal } from '@/types/database';

const statusColors: Record<string, string> = {
  scheduled: 'bg-green-100 border-green-300 text-green-800',
  paused: 'bg-gray-100 border-gray-300 text-gray-500',
  delivered: 'bg-blue-100 border-blue-300 text-blue-800',
  prepared: 'bg-orange-100 border-orange-300 text-orange-800',
  out_for_delivery: 'bg-purple-100 border-purple-300 text-purple-800',
  cancelled: 'bg-red-100 border-red-300 text-red-500',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [calendarEntries, setCalendarEntries] = useState<SubscriptionCalendar[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!currentMonth) setCurrentMonth(new Date()); }, [currentMonth]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pauseMode, setPauseMode] = useState(false);
  const [detailModal, setDetailModal] = useState<SubscriptionCalendar | null>(null);
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const [subRes, mealsRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/meals'),
      ]);
      const subs = await subRes.json();
      const mealsData = await mealsRes.json();
      setMeals(Array.isArray(mealsData) ? mealsData.filter((m: Meal) => m.is_available !== false) : []);

      const allSubs = Array.isArray(subs) ? subs : [];
      const sub = allSubs.find((s: Subscription) => s.status === 'active')
        || allSubs.find((s: Subscription) => s.status === 'pending')
        || allSubs[0] || null;

      if (sub) {
        setSubscription(sub);
        const calRes = await fetch(`/api/calendar?subscription_id=${sub.id}`);
        const calData = await calRes.json();
        setCalendarEntries(Array.isArray(calData) ? calData : []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const calendarMap = useMemo(() => {
    const map: Record<string, SubscriptionCalendar> = {};
    calendarEntries.forEach(entry => {
      map[entry.date] = entry;
    });
    return map;
  }, [calendarEntries]);

  function getCalendarDays() {
    const monthStart = startOfMonth(currentMonth!);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }

  function toggleDateSelection(dateStr: string) {
    if (!pauseMode) return;
    const entry = calendarMap[dateStr];
    if (!entry || entry.status !== 'scheduled') return;

    const date = new Date(dateStr);
    if (isBefore(date, new Date())) return;

    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  }

  function areSelectedConsecutive(): boolean {
    if (selectedDates.length < 5) return false;
    const sorted = [...selectedDates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff !== 1) return false;
    }
    return true;
  }

  async function handlePause() {
    if (!subscription || !areSelectedConsecutive()) {
      showToast('Select at least 5 consecutive future days', 'error');
      return;
    }

    setProcessing(true);
    const res = await fetch('/api/calendar/pause', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscription.id,
        dates: selectedDates.sort(),
      }),
    });

    if (res.ok) {
      showToast('Days paused successfully');
      const calRes = await fetch(`/api/calendar?subscription_id=${subscription.id}`);
      setCalendarEntries(await calRes.json());
      setSelectedDates([]);
      setPauseMode(false);
    } else {
      const err = await res.json();
      showToast(err.error, 'error');
    }
    setProcessing(false);
  }

  async function handleUnpause(pauseGroupId: string) {
    if (!subscription) return;
    setProcessing(true);

    const res = await fetch('/api/calendar/unpause', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscription.id,
        pause_group_id: pauseGroupId,
      }),
    });

    if (res.ok) {
      showToast('Days un-paused successfully');
      const calRes = await fetch(`/api/calendar?subscription_id=${subscription.id}`);
      setCalendarEntries(await calRes.json());
      setDetailModal(null);
    } else {
      const err = await res.json();
      showToast(err.error, 'error');
    }
    setProcessing(false);
  }

  if (loading || !currentMonth) return <PageLoader />;

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
        <p className="text-gray-600 mb-4">Subscribe to a meal plan to see your calendar.</p>
        <Button onClick={() => window.location.href = '/customer/plans'}>Browse Plans</Button>
      </div>
    );
  }

  const days = getCalendarDays();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {subscription.meal_plan?.name} — {format(new Date(subscription.start_date), 'dd MMM')} to {format(new Date(subscription.end_date), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {pauseMode ? (
            <>
              <Button variant="ghost" onClick={() => { setPauseMode(false); setSelectedDates([]); }}>Cancel</Button>
              <Button
                onClick={handlePause}
                disabled={!areSelectedConsecutive() || processing}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause {selectedDates.length} Days
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setPauseMode(true)}>
              <Pause className="w-4 h-4 mr-1" /> Pause Days
            </Button>
          )}
        </div>
      </div>

      {pauseMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Select at least <strong>5 consecutive</strong> future days to pause. Click on green (scheduled) days to select them.
          {selectedDates.length > 0 && selectedDates.length < 5 && (
            <span className="ml-2 text-red-600">
              ({5 - selectedDates.length} more needed)
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Scheduled</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-400" /> Paused</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" /> Delivered</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 border border-orange-400" /> Preparing</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-400" /> Cancelled</span>
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-brand-green text-white">
          <button onClick={() => setCurrentMonth(m => subMonths(m!, 1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(m => addMonths(m!, 1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {dayNames.map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = calendarMap[dateStr];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDates.includes(dateStr);
            const isPast = isBefore(day, new Date()) && !isToday;

            return (
              <div
                key={i}
                onClick={() => {
                  if (pauseMode) toggleDateSelection(dateStr);
                  else if (entry) setDetailModal(entry);
                }}
                className={`min-h-[80px] p-2 border-b border-r relative ${
                  !isCurrentMonth ? 'bg-gray-50/50' : ''
                } ${isSelected ? 'ring-2 ring-brand-green ring-inset bg-brand-green/10' : ''} ${
                  entry && !pauseMode ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${pauseMode && entry?.status === 'scheduled' && !isPast ? 'cursor-pointer' : ''}`}
              >
                <span className={`text-sm ${
                  isToday ? 'w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center' :
                  !isCurrentMonth ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
                {entry && isCurrentMonth && (
                  <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusColors[entry.status] || 'bg-gray-100'}`}>
                    {entry.status.replace('_', ' ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal ? format(new Date(detailModal.date), 'EEEE, dd MMMM yyyy') : ''}
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge status={detailModal.status} />
              {detailModal.status === 'scheduled' && (
                <span className="text-xs text-gray-500">Delivery scheduled</span>
              )}
            </div>

            {detailModal.status !== 'cancelled' && meals.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Meals for this day</p>
                <div className="space-y-2">
                  {meals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 bg-brand-gold-light rounded-lg flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4 text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
                          <Badge status={meal.dietary_tag} />
                        </div>
                        <p className="text-xs text-gray-500">{meal.protein_grams}g protein · {meal.calories} kcal</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-green shrink-0">{formatCurrency(meal.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailModal.status === 'paused' && detailModal.pause_group_id && (
              <Button
                variant="outline"
                onClick={() => handleUnpause(detailModal.pause_group_id!)}
                disabled={processing}
              >
                <Play className="w-4 h-4 mr-1" />
                Un-pause this block
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
