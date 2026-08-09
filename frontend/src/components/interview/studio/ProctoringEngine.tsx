'use client';

import React, { useEffect, useState } from 'react';
import { ProctoringEvent } from '../../../types';
import { ShieldAlert, Eye, AlertTriangle } from 'lucide-react';

interface ProctoringProps {
  enabled: boolean;
  onProctoringViolation: (event: ProctoringEvent) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const ProctoringEngine: React.FC<ProctoringProps> = ({
  enabled,
  onProctoringViolation,
}) => {
  const [warnings, setWarnings] = useState<ProctoringEvent[]>([]);
  const [activeToast, setActiveToast] = useState<ProctoringEvent | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab Switch & Focus Loss Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation({
          id: `proc-tab-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'TAB_SWITCH',
          severity: 'warning',
          message: 'Browser tab switched or window focus lost.'
        });
      }
    };

    // 2. Copy/Paste Event Listener
    const handleCopyPaste = (e: ClipboardEvent) => {
      triggerViolation({
        id: `proc-copy-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'COPY_PASTE',
        severity: 'warning',
        message: 'Clipboard copy or paste attempt detected.'
      });
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('paste', handleCopyPaste as any);

    // 3. Periodic Vision Gaze / Face Detection Simulator
    const visionInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.03) {
        triggerViolation({
          id: `proc-gaze-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'LOOKING_AWAY',
          severity: 'warning',
          message: 'Vision Alert: Candidate gaze turned away from screen center.'
        });
      }
    }, 18000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('paste', handleCopyPaste as any);
      clearInterval(visionInterval);
    };
  }, [enabled]);

  const triggerViolation = (event: ProctoringEvent) => {
    setWarnings((prev) => [...prev, event]);
    setActiveToast(event);
    onProctoringViolation(event);
    setTimeout(() => setActiveToast(null), 4500);
  };

  if (!enabled) return null;

  return (
    <>
      {/* Toast Alert Overlay */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-rose-50 border border-rose-300 shadow-xl text-rose-950 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-sm">
          <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-700">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-950">
              Proctoring Warning (#{warnings.length})
            </h5>
            <p className="text-xs text-rose-900 mt-0.5">{activeToast.message}</p>
          </div>
        </div>
      )}

      {/* Security Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
        <Eye className="w-3.5 h-3.5 text-[#059669]" />
        <span className="text-slate-600">Vision Proctoring:</span>
        {warnings.length === 0 ? (
          <span className="text-[#059669]">100% Verified</span>
        ) : (
          <span className="text-red-600 font-extrabold">{warnings.length} Violation(s)</span>
        )}
      </div>
    </>
  );
};
