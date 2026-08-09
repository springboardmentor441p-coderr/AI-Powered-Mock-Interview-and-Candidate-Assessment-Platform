'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Play
} from 'lucide-react';

export const RecentInterviewsTable: React.FC = () => {
  const { reports, user } = useApp();

  // Show user's specific interview reports if logged in, fallback to reports list
  const userReports = React.useMemo(() => {
    if (!user) return reports;
    const userSpecific = reports.filter(
      (r) => r.candidateEmail?.toLowerCase() === user.email?.toLowerCase()
    );
    return userSpecific.length > 0 ? userSpecific : reports;
  }, [reports, user]);

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Interview Sessions</h3>
          <p className="text-xs text-slate-500">Review evaluation scorecards, transcripts, and proctoring audit logs</p>
        </div>
        <Link
          href="/interview/demo"
          className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-[#059669]" />
          <span>New Practice Round</span>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-4">Interview Title & Track</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Proctoring Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {userReports.map((report) => {
              const hasWarnings = report.proctoringEvents && report.proctoringEvents.length > 0;
              return (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Title & Track */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">{report.config.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 font-medium">{report.config.track}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#059669] font-bold">Interviewer: {report.config.persona.name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 text-slate-500 font-mono">
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Difficulty */}
                  <td className="py-4 px-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {report.config.difficulty}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-[#059669]">
                        {report.overallScore}%
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        {report.readinessRating}
                      </span>
                    </div>
                  </td>

                  {/* Proctoring */}
                  <td className="py-4 px-4">
                    {hasWarnings ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{report.proctoringEvents.length} Warning(s)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Clean</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/report/${report.id}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 font-bold text-xs inline-flex items-center gap-1 transition-all"
                    >
                      <span>View Report</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
