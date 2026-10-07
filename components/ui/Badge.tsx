const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
  delivered: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  paused: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-800',
  successful: 'bg-green-100 text-green-800',
  refunded: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-blue-100 text-blue-800',
  veg: 'bg-green-100 text-green-800 border border-green-300',
  non_veg: 'bg-red-100 text-red-800 border border-red-300',
  egg: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
};

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-800';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color} ${className}`}>
      {label}
    </span>
  );
}
