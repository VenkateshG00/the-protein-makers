'use client';

import { Settings } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Application configuration</p>
      </div>
      <EmptyState
        icon={Settings}
        title="Coming Soon"
        description="System settings like business hours, notification preferences, and app configuration will be available in a future update."
      />
    </div>
  );
}
