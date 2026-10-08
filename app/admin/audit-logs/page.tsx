'use client';

import { ScrollText } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function AuditLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System activity and change history</p>
      </div>
      <EmptyState
        icon={ScrollText}
        title="Coming Soon"
        description="Activity logs tracking all admin actions, data changes, and system events will be available in a future update."
      />
    </div>
  );
}
