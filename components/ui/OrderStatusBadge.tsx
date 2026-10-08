'use client';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse ${className}`}>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Pending
        </span>
      );

    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A4828]/10 text-[#0A4828] border border-[#0A4828]/30 ${className}`}>
          <svg className="w-4 h-4 text-[#0A4828]" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
          </svg>
          Confirmed
        </span>
      );

    case 'preparing':
      return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#0A4828] border border-[#E3BA82] ${className}`}>
          <svg className="w-4 h-4 text-[#0A4828]" viewBox="0 0 24 24" fill="none">
            <path d="M8 6v2" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" className="steam-a" />
            <path d="M12 5v3" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" className="steam-b" />
            <path d="M16 6v2" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" className="steam-c" />
            <path d="M4 11h16a1 1 0 011 1 8 8 0 01-16 0 1 1 0 011-1z" fill="#0A4828" />
          </svg>
          Preparing
        </span>
      );

    case 'ready':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0A4828] border border-emerald-400 shadow-[0_0_14px_rgba(10,72,40,0.22)] ${className}`}>
          <svg className="w-4 h-4 text-[#0A4828] bell-ring" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
          </svg>
          Ready
        </span>
      );

    case 'out_for_delivery':
      return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#0A4828] text-[#E3BA82] border border-[#E3BA82]/50 ${className}`}>
          <svg className="w-5 h-4" viewBox="0 0 28 20" fill="none">
            <line x1="2" y1="18" x2="26" y2="18" stroke="#E3BA82" strokeWidth="2" className="road-move" />
            <g className="scooter-move">
              <circle cx="8" cy="14" r="3" fill="#E3BA82" />
              <circle cx="20" cy="14" r="3" fill="#E3BA82" />
              <path d="M8 14h8l3-6h-4l-2 4H9l-1-4H5" stroke="#E3BA82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          Out for Delivery
        </span>
      );

    case 'delivered':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A4828] text-[#E3BA82] ring-2 ring-[#E3BA82]/60 shadow-sm ${className}`}>
          <svg className="w-4 h-4 text-[#E3BA82]" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
          </svg>
          Delivered
        </span>
      );

    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 ${className}`}>
          <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Cancelled
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
          {status.replace(/_/g, ' ')}
        </span>
      );
  }
}
