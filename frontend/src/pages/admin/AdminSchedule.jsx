import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminSchedule({ navigate }) {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({
    candidate_id: '',
    company_name: 'SmartHire AI',
    job_title: 'Senior Frontend Engineer',
    date: '',
    time: '',
    duration_minutes: 30
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch candidates to populate dropdown
    api.getCandidates().then(setCandidates).catch(console.error);
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    api.getAdminIntegritySessions().then(data => {
      // Filter for scheduled
      setSessions(data.filter(s => s.status === 'scheduled'));
    }).catch(console.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create local datetime and convert to UTC
      const localDate = new Date(`${form.date}T${form.time}:00`);
      const payload = {
        candidate_id: parseInt(form.candidate_id),
        company_name: form.company_name,
        job_title: form.job_title,
        scheduled_start: localDate.toISOString(),
        duration_minutes: parseInt(form.duration_minutes),
        interview_type: 'Technical',
        domain: 'Frontend',
        difficulty: 'Medium'
      };

      await fetch('http://localhost:8000/interview/admin/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexiq_token')}`
        },
        body: JSON.stringify(payload)
      });
      
      setSuccess('Interview scheduled successfully!');
      fetchSessions();
      setForm({ ...form, date: '', time: '' });
    } catch (err) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface">Schedule Interview</h1>
        <p className="font-body-lg text-on-surface-variant mt-2">
          Create a time-locked, scheduled mock interview session for a candidate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Scheduling Form */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10">
          <h2 className="font-title-lg text-on-surface mb-6">New Session</h2>
          {error && <div className="bg-error/10 text-error p-4 rounded-xl mb-6">{error}</div>}
          {success && <div className="bg-primary/10 text-primary p-4 rounded-xl mb-6">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-label-md text-on-surface-variant mb-1 block">Candidate</label>
              <select 
                required
                value={form.candidate_id}
                onChange={e => setForm({...form, candidate_id: e.target.value})}
                className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary"
              >
                <option value="">Select a Candidate...</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.user_id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label-md text-on-surface-variant mb-1 block">Company Name</label>
                <input 
                  required
                  type="text" 
                  value={form.company_name}
                  onChange={e => setForm({...form, company_name: e.target.value})}
                  className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary" 
                />
              </div>
              <div>
                <label className="font-label-md text-on-surface-variant mb-1 block">Job Title</label>
                <input 
                  required
                  type="text" 
                  value={form.job_title}
                  onChange={e => setForm({...form, job_title: e.target.value})}
                  className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="font-label-md text-on-surface-variant mb-1 block">Date (Local)</label>
                <input 
                  required
                  type="date" 
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary" 
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="col-span-1">
                <label className="font-label-md text-on-surface-variant mb-1 block">Time (Local)</label>
                <input 
                  required
                  type="time" 
                  value={form.time}
                  onChange={e => setForm({...form, time: e.target.value})}
                  className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary" 
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="col-span-1">
                <label className="font-label-md text-on-surface-variant mb-1 block">Duration</label>
                <select 
                  value={form.duration_minutes}
                  onChange={e => setForm({...form, duration_minutes: e.target.value})}
                  className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface border border-outline-variant/20 focus:border-primary"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all"
            >
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </form>
        </div>

        {/* List View */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10">
          <h2 className="font-title-lg text-on-surface mb-6">Upcoming Scheduled Sessions</h2>
          
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-50 mb-2">event_busy</span>
              <p>No upcoming scheduled sessions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(s => (
                <div key={s.id} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-on-surface">Session #{s.id}</div>
                    <div className="text-sm text-on-surface-variant">
                      {new Date(s.started_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                    {s.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
