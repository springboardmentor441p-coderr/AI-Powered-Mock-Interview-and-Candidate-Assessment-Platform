'use client';

import React from 'react';
import { StudioSidebar } from '../../components/layout/StudioSidebar';
import { MetricsOverview } from '../../components/dashboard/MetricsOverview';
import { PerformanceCharts } from '../../components/dashboard/PerformanceCharts';
import { RecentInterviewsTable } from '../../components/dashboard/RecentInterviewsTable';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
      <div className="min-h-screen bg-slate-50 flex text-slate-900">
        
        {/* Studio Sidebar */}
        <StudioSidebar />

        {/* Main Canvas Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <MetricsOverview />
            <PerformanceCharts />
            <RecentInterviewsTable />
          </div>
        </main>

      </div>
    </ProtectedRoute>
  );
}
