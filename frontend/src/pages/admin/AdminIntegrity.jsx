import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ProctoringPanel from '../../components/ProctoringPanel';

export default function AdminIntegrity({ navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getAdminIntegritySessions();
      setSessions(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setEventsLoading(true);
    try {
      const data = await api.getAdminIntegrityEvents(session.id);
      setEvents(data);
    } catch (err) { console.error(err); }
    finally { setEventsLoading(false); }
  };

  /** Derive integrity status label from flags_count */
  const getIntegrityStatus = (s) => {
    if (s.integrity_status) return s.integrity_status;
    const flags = s.flags_count ?? 0;
    if (flags === 0) return 'Clean';
    if (flags <= 2)  return 'Minor Flags';
    return 'Review Needed';
  };

  const getStatusBadge = (label) => {
    if (label === 'Clean')         return 'bg-primary/15 text-primary border-primary/30';
    if (label === 'Minor Flags')   return 'bg-amber-400/15 text-amber-400 border-amber-400/30';
    return 'bg-error/15 text-error border-error/30';
  };

  /** Candidate display name from session */
  const getCandidateName = (s) => {
    if (s.candidate_name) return s.candidate_name;
    if (s.candidate_email) {
      const local = s.candidate_email.split('@')[0];
      return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Candidate';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface">Integrity &amp; Proctoring</h1>
        <p className="font-body-lg text-on-surface-variant mt-2">
          Monitor candidate behavior and AI usage during live interview sessions.
          <strong className="text-error ml-2">Note: Flags require human review and are not automatic disqualifications.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sessions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10">
            <h2 className="font-title-lg text-on-surface mb-4">Interview Sessions</h2>

            {loading ? (
              <p className="text-on-surface-variant">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-on-surface-variant">No sessions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-mono-label text-sm uppercase">
                      <th className="pb-3 px-2">Candidate</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Flags</th>
                      <th className="pb-3 px-2">Integrity</th>
                      <th className="pb-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => {
                      const intStatus = getIntegrityStatus(s);
                      const displayName = getCandidateName(s);
                      const initials = (displayName)[0].toUpperCase();
                      const photoUrl = s.candidate_photo_url || null;

                      return (
                        <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                          {/* Candidate column — name + photo */}
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2">
                              {photoUrl ? (
                                <img src={photoUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-outline-variant/20 flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs flex-shrink-0">
                                  {initials}
                                </div>
                              )}
                              <span className="font-body-md text-on-surface truncate max-w-[120px]">{displayName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 font-body-md text-on-surface">{new Date(s.started_at).toLocaleDateString()}</td>
                          <td className="py-4 px-2 font-body-md text-on-surface capitalize">{s.interview_type}</td>
                          <td className="py-4 px-2 font-body-md text-on-surface">{s.status}</td>
                          <td className="py-4 px-2 font-body-md text-on-surface font-bold">{s.flags_count ?? 0}</td>
                          <td className="py-4 px-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(intStatus)}`}>
                              {intStatus}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <button
                              onClick={() => handleSelectSession(s)}
                              className={`px-3 py-1 rounded-lg text-sm font-label-md transition-colors ${
                                selectedSession?.id === s.id
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Proctoring Detail Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 sticky top-8 min-h-[400px]">
            {selectedSession ? (
              eventsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <ProctoringPanel
                  events={events}
                  candidateName={getCandidateName(selectedSession)}
                  candidatePhoto={selectedSession.candidate_photo_url || null}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">search</span>
                <p className="font-body-lg text-on-surface-variant">Select a session to view its proctoring report.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
