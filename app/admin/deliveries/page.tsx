'use client';

import { Truck } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function DeliveriesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">Delivery tracking and driver assignment</p>
      </div>
      <EmptyState
        icon={Truck}
        title="Coming Soon"
        description="Delivery management with driver assignment and real-time tracking will be available in a future update."
      />
    </div>
  );
}
