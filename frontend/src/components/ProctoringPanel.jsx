/**
 * ProctoringPanel.jsx
 * Admin proctoring / integrity panel for a single session.
 * Shows 9 automated check categories with pass/flag indicators.
 */
import React, { useMemo } from 'react';

const CHECK_DEFS = [
  { key: 'TAB_SWITCH',       label: 'Tab / Window Switch',         icon: 'tab',            desc: 'Candidate left the interview tab' },
  { key: 'MULTIPLE_FACES',   label: 'Multiple Faces',              icon: 'group',          desc: 'More than one face in webcam feed' },
  { key: 'NO_FACE_DETECTED', label: 'No Face / Mismatch',          icon: 'person_off',     desc: 'Face absent or possible impersonation' },
  { key: 'GAZE_AWAY',        label: 'Prolonged Gaze Away',         icon: 'visibility_off', desc: 'Eye-tracking: looking away from screen' },
  { key: 'PASTE_ATTEMPT',    label: 'Copy-Paste (Coding)',         icon: 'content_paste',  desc: 'Pasted code block vs. typed code' },
  { key: 'DEVTOOLS_OPEN',    label: 'DevTools / Console',          icon: 'code',           desc: 'Browser DevTools opened during coding' },
  { key: 'TYPING_BURST',     label: 'Unusual Typing Burst',        icon: 'keyboard_alt',   desc: 'Large code appearing instantly (AI paste?)' },
  { key: 'BACKGROUND_NOISE', label: 'Background Noise / Voice',    icon: 'hearing',        desc: 'Secondary voice detected in audio' },
  { key: 'VOICE_ANOMALY',    label: 'Voice Anomaly',               icon: 'mic_off',        desc: 'Whispered or unusually coached answers' },
];

const INTEGRITY_BADGE = {
  Clean:         { color: 'bg-primary/15 text-primary border-primary/30',             icon: 'verified_user',  label: 'Clean' },
  'Minor Flags': { color: 'bg-amber-400/15 text-amber-400 border-amber-400/30',       icon: 'warning',        label: 'Minor Flags' },
  'Review Needed': { color: 'bg-error/15 text-error border-error/30',                 icon: 'gpp_bad',        label: 'Review Needed' },
};

function integrityScore(flagsCount) {
  if (flagsCount === 0) return 'Clean';
  if (flagsCount <= 2) return 'Minor Flags';
  return 'Review Needed';
}

export default function ProctoringPanel({ events = [], candidateName, candidatePhoto }) {
  // Group events by type
  const flagsByKey = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.event_type]) map[e.event_type] = [];
      map[e.event_type].push(e);
    });
    return map;
  }, [events]);

  const flaggedKeys = Object.keys(flagsByKey);
  const score = integrityScore(flaggedKeys.length);
  const badge = INTEGRITY_BADGE[score];

  return (
    <div className="space-y-6">
      {/* Header: candidate + integrity score */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {candidatePhoto ? (
            <img src={candidatePhoto} alt={candidateName} className="w-10 h-10 rounded-full object-cover border border-outline-variant/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
              {(candidateName || 'C')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-label-md text-label-md text-on-surface font-bold">{candidateName || 'Candidate'}</p>
            <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">Proctoring Report</p>
          </div>
        </div>
        {/* Integrity Score Badge */}
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border ${badge.color}`}>
          <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
          {badge.label}
        </span>
      </div>

      {/* Advisory note */}
      <div className="px-4 py-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/10">
        <p className="font-body-md text-on-surface-variant text-sm">
          <span className="font-bold text-on-surface">Advisory only.</span> All flags require human review before any action. No candidate is automatically disqualified.
        </p>
      </div>

      {/* 9 check categories */}
      <div className="space-y-2">
        {CHECK_DEFS.map(check => {
          const flagEvents = flagsByKey[check.key] || [];
          const flagged = flagEvents.length > 0;
          return (
            <div
              key={check.key}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                flagged
                  ? 'bg-error/5 border-error/20'
                  : 'bg-surface-container-high/20 border-outline-variant/5'
              }`}
            >
              {/* Status icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                flagged ? 'bg-error/15' : 'bg-primary/10'
              }`}>
                <span className={`material-symbols-outlined text-[18px] ${flagged ? 'text-error' : 'text-primary/50'}`}>
                  {flagged ? 'flag' : 'check'}
                </span>
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/50">{check.icon}</span>
                  <p className={`font-label-md text-label-md font-bold ${flagged ? 'text-error' : 'text-on-surface-variant/60'}`}>
                    {check.label}
                  </p>
                </div>
                <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px]">{check.desc}</p>

                {/* Flag timestamps */}
                {flagged && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {flagEvents.slice(0, 4).map((ev, i) => (
                      <span key={i} className="text-[10px] font-mono bg-error/10 text-error px-2 py-0.5 rounded-md border border-error/20">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {ev.duration_seconds > 0 && ` (${ev.duration_seconds.toFixed(1)}s)`}
                      </span>
                    ))}
                    {flagEvents.length > 4 && (
                      <span className="text-[10px] font-mono bg-error/10 text-error px-2 py-0.5 rounded-md border border-error/20">
                        +{flagEvents.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pass/Flag pill */}
              <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                flagged
                  ? 'bg-error/15 text-error border-error/30'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {flagged ? `${flagEvents.length} flag${flagEvents.length > 1 ? 's' : ''}` : 'Pass'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Flags', value: flaggedKeys.length },
          { label: 'Total Events', value: events.length },
          { label: 'Categories', value: `${flaggedKeys.length} / ${CHECK_DEFS.length}` },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-high/30 rounded-xl p-3 text-center border border-outline-variant/10">
            <p className="font-mono-label text-mono-label text-on-surface-variant uppercase text-[10px] mb-1">{s.label}</p>
            <p className="font-headline-md text-headline-md text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
