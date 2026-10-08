'use client';

import { useEffect, useRef } from 'react';

const STEPS = [
  { key: 'pending', label: 'Order Placed', subtitle: 'Awaiting kitchen confirmation' },
  { key: 'confirmed', label: 'Confirmed', subtitle: 'Macros verified & queued' },
  { key: 'preparing', label: 'Preparing', subtitle: 'Chefs cooking & weighing' },
  { key: 'ready', label: 'Ready', subtitle: 'Packed & sealed fresh' },
  { key: 'out_for_delivery', label: 'On the Way', subtitle: 'Rider out for delivery' },
  { key: 'delivered', label: 'Delivered', subtitle: 'Enjoy your protein meal!' },
];

interface MealItem {
  meal_time: string;
  status?: string;
  meal?: { name?: string; dietary_tag?: string };
}

interface OrderProgressStepperProps {
  status: string;
  orderId: string;
  items?: MealItem[];
}

const MEAL_ORDER: Record<string, number> = { morning: 0, afternoon: 1, dinner: 2 };
const MEAL_ICONS: Record<string, string> = { morning: '🌅', afternoon: '☀️', dinner: '🌙' };
const MEAL_LABELS: Record<string, string> = { morning: 'Breakfast', afternoon: 'Lunch', dinner: 'Dinner' };

const STATUS_ICONS: Record<string, string> = {
  delivered: '✓',
  out_for_delivery: '🚚',
  ready: '📦',
  preparing: '🍳',
  confirmed: '✓',
  pending: '⏳',
  cancelled: '✗',
};

function StepIcon({ stepKey, isCurrent }: { stepKey: string; isCurrent: boolean }) {
  if (stepKey === 'pending' && isCurrent) {
    return <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping" />;
  }
  if (stepKey === 'confirmed' || stepKey === 'delivered') {
    return (
      <svg className="w-5 h-5 text-[#E3BA82]" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
      </svg>
    );
  }
  if (stepKey === 'preparing') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M8 5v2.5" stroke="#E3BA82" strokeWidth="2" strokeLinecap="round" className="steam-a" />
        <path d="M12 4v3" stroke="#E3BA82" strokeWidth="2" strokeLinecap="round" className="steam-b" />
        <path d="M16 5v2.5" stroke="#E3BA82" strokeWidth="2" strokeLinecap="round" className="steam-c" />
        <path d="M4 11h16a1 1 0 011 1 8 8 0 01-16 0 1 1 0 011-1z" fill="#E3BA82" />
      </svg>
    );
  }
  if (stepKey === 'ready') {
    return (
      <svg className="w-5 h-5 text-[#E3BA82] bell-ring" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (stepKey === 'out_for_delivery') {
    return (
      <svg className="w-6 h-5" viewBox="0 0 28 22" fill="none">
        <line x1="2" y1="19" x2="26" y2="19" stroke="#E3BA82" strokeWidth="2" className="road-move" />
        <g className="scooter-move">
          <circle cx="8" cy="14" r="3" fill="#E3BA82" />
          <circle cx="20" cy="14" r="3" fill="#E3BA82" />
          <path d="M8 14h8l3-6h-4l-2 4H9l-1-4H5" stroke="#E3BA82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }
  return null;
}

export default function OrderProgressStepper({ status, orderId, items }: OrderProgressStepperProps) {
  const confettiFired = useRef(false);

  const sortedItems = items
    ? [...items].sort((a, b) => (MEAL_ORDER[a.meal_time] ?? 9) - (MEAL_ORDER[b.meal_time] ?? 9))
    : [];
  const hasItems = sortedItems.length > 0;

  const activeMeal = hasItems
    ? sortedItems.find(i => (i.status || 'pending') !== 'delivered') || sortedItems[sortedItems.length - 1]
    : null;
  const activeMealStatus = activeMeal ? (activeMeal.status || 'pending') : status;
  const allDelivered = hasItems && sortedItems.every(i => (i.status || 'pending') === 'delivered');
  const effectiveStatus = hasItems ? (allDelivered ? 'delivered' : activeMealStatus) : status;

  useEffect(() => {
    if (effectiveStatus === 'delivered' && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(mod => {
        const confetti = mod.default;
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#0A4828', '#E3BA82', '#145934', '#FFF8E1'],
        });
      }).catch(() => {});
    }
  }, [effectiveStatus]);

  if (effectiveStatus === 'cancelled') {
    return (
      <div className="bg-red-50/90 border border-red-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-red-600 font-bold">Order {orderId}</span>
          <h3 className="text-lg font-extrabold text-red-900 mt-0.5">This meal order was cancelled</h3>
          <p className="text-xs text-red-700 mt-0.5">Any deducted meal credits or payments are automatically refunded.</p>
        </div>
      </div>
    );
  }

  const activeIndex = STEPS.findIndex(s => s.key === effectiveStatus);
  const idx = activeIndex === -1 ? 0 : activeIndex;
  const progressPercent = idx <= 0 ? 0 : Math.round((idx / (STEPS.length - 1)) * 100);

  return (
    <div className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Meal summary line */}
      {hasItems && (
        <div className="flex items-center gap-3 sm:gap-4 pb-4 mb-4 border-b border-[#E6DEC8]/40">
          {sortedItems.map(item => {
            const itemStatus = item.status || 'pending';
            const isDelivered = itemStatus === 'delivered';
            const isActive = item === activeMeal && !allDelivered;
            return (
              <div
                key={item.meal_time}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isDelivered
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : isActive
                    ? 'bg-[#0A4828] text-[#E3BA82] shadow-sm'
                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                }`}
              >
                <span>{MEAL_ICONS[item.meal_time] || '🍽️'}</span>
                <span>{MEAL_LABELS[item.meal_time] || item.meal_time}</span>
                <span>{isDelivered ? '✓' : STATUS_ICONS[itemStatus] || '·'}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-[#E6DEC8]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#0A4828] text-[#E3BA82]">{orderId}</span>
            <span className="text-xs font-semibold text-stone-500">Live Meal Tracker</span>
          </div>
          {hasItems && activeMeal && !allDelivered ? (
            <h3 className="text-lg font-extrabold text-[#0A4828] mt-1">
              {MEAL_ICONS[activeMeal.meal_time]} {MEAL_LABELS[activeMeal.meal_time]} — {STEPS[idx].label}
              <span className="text-sm font-semibold text-stone-500 ml-1.5">({STEPS[idx].subtitle})</span>
            </h3>
          ) : (
            <h3 className="text-lg font-extrabold text-[#0A4828] mt-1">
              {STEPS[idx].label} — {STEPS[idx].subtitle}
            </h3>
          )}
        </div>
        {effectiveStatus !== 'delivered' ? (
          <div className="bg-[#F9FAF8] border border-[#E6DEC8] px-4 py-2 rounded-xl text-right">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Estimated Arrival</p>
            <p className="text-sm font-extrabold text-[#0A4828]">25–30 mins</p>
          </div>
        ) : (
          <div className="bg-[#0A4828] text-[#E3BA82] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Meals Delivered
          </div>
        )}
      </div>

      <div className="relative mt-8">
        {/* Progress track (desktop only) */}
        <div className="hidden md:block absolute top-6 left-8 right-8 h-1 bg-stone-200 rounded-full" />
        <div
          className="hidden md:block absolute top-6 left-8 h-1 bg-[#0A4828] rounded-full transition-all duration-700 ease-out"
          style={{ width: `calc(${progressPercent}% - 2rem)` }}
        />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 md:gap-2 relative z-10">
          {STEPS.map((step, index) => {
            const isCompleted = index < idx;
            const isCurrent = index === idx;

            let circleCls: string;
            if (isCompleted) {
              circleCls = 'bg-[#0A4828] text-[#E3BA82] ring-2 ring-[#E3BA82]/60 shadow-sm';
            } else if (isCurrent) {
              circleCls = step.key === 'pending'
                ? 'bg-amber-50 text-amber-700 border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] animate-pulse'
                : 'bg-[#0A4828] text-[#E3BA82] ring-4 ring-[#E3BA82]/50 shadow-[0_0_20px_rgba(10,72,40,0.28)] scale-110';
            } else {
              circleCls = 'bg-stone-100 text-stone-400 border border-stone-200';
            }

            const innerIcon = isCompleted ? (
              <svg className="w-5 h-5 text-[#E3BA82]" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : isCurrent ? (
              <StepIcon stepKey={step.key} isCurrent />
            ) : (
              <span className="text-xs font-bold">{index + 1}</span>
            );

            return (
              <div key={step.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2.5">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${circleCls}`}>
                  {innerIcon}
                </div>
                <div>
                  <p className={`text-xs font-extrabold ${isCurrent ? 'text-[#0A4828]' : isCompleted ? 'text-stone-800' : 'text-stone-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-snug ${isCurrent ? 'text-stone-600 font-medium' : 'text-stone-400'}`}>
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
