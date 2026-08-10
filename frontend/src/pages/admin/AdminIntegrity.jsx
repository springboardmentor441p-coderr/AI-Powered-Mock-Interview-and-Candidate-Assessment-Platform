import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function AdminIntegrity({ navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getAdminIntegritySessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setEventsLoading(true);
    try {
      const data = await api.getAdminIntegrityEvents(session.id);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEventsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Clean') return 'bg-primary/20 text-primary border-primary/30';
    if (status === 'Flagged') return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-error/20 text-error border-error/30';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface">Integrity & Proctoring</h1>
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
                      <th className="pb-3 px-2">Session ID</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Flags</th>
                      <th className="pb-3 px-2">Integrity Status</th>
                      <th className="pb-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                        <td className="py-4 px-2 font-mono text-sm">#{s.id}</td>
                        <td className="py-4 px-2 font-body-md text-on-surface">{new Date(s.started_at).toLocaleDateString()}</td>
                        <td className="py-4 px-2 font-body-md text-on-surface capitalize">{s.interview_type}</td>
                        <td className="py-4 px-2 font-body-md text-on-surface">{s.status}</td>
                        <td className="py-4 px-2 font-body-md text-on-surface font-bold">{s.flags_count}</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(s.integrity_status)}`}>
                            {s.integrity_status}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <button 
                            onClick={() => handleSelectSession(s)}
                            className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-label-md transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 sticky top-8 min-h-[400px]">
            {selectedSession ? (
              <>
                <h2 className="font-title-lg text-on-surface mb-2">Session #{selectedSession.id} Timeline</h2>
                <p className="font-body-md text-on-surface-variant mb-6">Reviewing integrity events in chronological order.</p>
                
                {eventsLoading ? (
                  <p className="text-on-surface-variant">Loading events...</p>
                ) : events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-primary/40 mb-4">verified_user</span>
                    <p className="font-body-lg text-on-surface">No Integrity Flags</p>
                    <p className="text-on-surface-variant mt-1">This session is perfectly clean.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/20 before:to-transparent">
                    {events.map((e, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-surface-container-highest text-on-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <span className={`material-symbols-outlined text-[20px] ${e.severity === 'high' ? 'text-error' : 'text-warning'}`}>
                            {e.event_type === 'GAZE_AWAY' ? 'visibility_off' : 
                             e.event_type === 'TAB_SWITCH' ? 'tab' : 
                             e.event_type === 'MULTIPLE_FACES' ? 'group' : 'warning'}
                          </span>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-on-surface">{e.event_type}</div>
                            <time className="font-mono text-xs text-on-surface-variant">{new Date(e.timestamp).toLocaleTimeString()}</time>
                          </div>
                          <div className="text-sm text-on-surface-variant">{e.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">search</span>
                <p className="font-body-lg text-on-surface-variant">Select a session to view its integrity timeline.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
