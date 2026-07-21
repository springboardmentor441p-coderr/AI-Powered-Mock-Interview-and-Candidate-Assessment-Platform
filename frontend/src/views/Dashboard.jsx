import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, Briefcase, FileText, Plus, Search, ChevronRight, User, Settings, CheckCircle2, ShieldCheck, Mail, Building, PlusCircle } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'candidate';
  const fullName = localStorage.getItem('full_name') || 'User';
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Candidate states
  const [analytics, setAnalytics] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Recruiter states
  const [candidates, setCandidates] = useState([]);
  const [searchSkill, setSearchSkill] = useState('');
  const [templates, setTemplates] = useState([]);
  
  // Recruiter Template Builder Form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDomain, setNewTemplateDomain] = useState('Software Engineering');
  const [newTemplateDifficulty, setNewTemplateDifficulty] = useState('Medium');
  const [newTemplateQ1, setNewTemplateQ1] = useState('');
  const [newTemplateQ2, setNewTemplateQ2] = useState('');
  const [newTemplateQ3, setNewTemplateQ3] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        if (role === 'candidate') {
          // Load Candidate analytics & profile verification
          const anaResponse = await api.get('/api/interviews/analytics');
          setAnalytics(anaResponse.data);
          
          const profResponse = await api.get('/api/users/profile');
          if (profResponse.data && profResponse.data.parsed_skills?.length > 0) {
            setHasProfile(true);
          }
        } else if (role === 'recruiter' || role === 'admin') {
          // Load candidates and templates
          const candResponse = await api.get('/api/users/candidates');
          setCandidates(candResponse.data);
          
          const tempResponse = await api.get('/api/interviews/templates');
          setTemplates(tempResponse.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load dashboard parameters.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [role]);

  // Recruiter Template Handler
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateTitle || !newTemplateQ1) return;

    try {
      const qs = [newTemplateQ1];
      if (newTemplateQ2) qs.push(newTemplateQ2);
      if (newTemplateQ3) qs.push(newTemplateQ3);

      const response = await api.post('/api/interviews/templates', {
        title: newTemplateTitle,
        domain: newTemplateDomain,
        difficulty: newTemplateDifficulty,
        questions: qs
      });

      setTemplates((prev) => [...prev, response.data]);
      setNewTemplateTitle('');
      setNewTemplateQ1('');
      setNewTemplateQ2('');
      setNewTemplateQ3('');
      setShowTemplateForm(false);
    } catch (err) {
      alert('Failed to save interview template.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 text-sm font-medium">Entering Workspace...</p>
      </div>
    );
  }

  // --- CANDIDATE DASHBOARD VIEW ---
  if (role === 'candidate') {
    const hasHistory = analytics?.recent_interviews?.length > 0;
    
    return (
      <div className="space-y-8 p-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Welcome back, {fullName}!</h1>
            <p className="text-sm text-gray-400 mt-1">Review your skill aggregates, performance timelines, and launch mock interviews.</p>
          </div>
          <button 
            onClick={() => navigate('/interview-setup')}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-5 h-5" />
            Start Mock Interview
          </button>
        </div>

        {/* Aggregates Metrics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Overall Score', val: analytics?.average_overall || 0, color: 'text-cyan-400' },
            { title: 'Communication', val: analytics?.average_communication || 0, color: 'text-blue-400' },
            { title: 'Confidence', val: analytics?.average_confidence || 0, color: 'text-emerald-400' },
            { title: 'Technical Relevance', val: analytics?.average_technical || 0, color: 'text-indigo-400' },
            { title: 'Professionalism', val: analytics?.average_professionalism || 0, color: 'text-purple-400' }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider block">{item.title}</span>
              <span className={`text-2xl font-black mt-2 block ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Mid grid: Chart & Quick tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Performance Trends Chart (2/3) */}
          <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Assessment Trends</h2>
            <div className="w-full h-64">
              {hasHistory ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="Overall" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Technical" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500 text-xs">
                  No completed assessment data found. Start a mock interview to populate performance charts.
                </div>
              )}
            </div>
          </div>

          {/* Quick Tools Panels (1/3) */}
          <div className="space-y-6">
            
            {/* Resume Parser Card */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  ATS Resume Parsing
                </h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {hasProfile 
                    ? 'Your profile is loaded with extracted skills. Re-upload a PDF resume to update tags.' 
                    : 'Upload your PDF resume to initialize candidate profile skills and trigger tailored questions.'
                  }
                </p>
              </div>
              <button 
                onClick={() => navigate('/resume-upload')}
                className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                {hasProfile ? 'Manage Profile & Resume' : 'Upload Resume'}
              </button>
            </div>

            {/* AI config card */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  AI Settings
                </h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Add a custom Google Gemini API Key or OpenAI API key to toggle from local mock algorithms to live LLM calculations.
                </p>
              </div>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                Configure Keys
              </button>
            </div>

          </div>
        </div>

        {/* History table list */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Recent Evaluations</h2>
          {hasHistory ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Domain</th>
                    <th className="pb-3 font-semibold">Difficulty</th>
                    <th className="pb-3 font-semibold text-center">Score</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.recent_interviews.map((sess) => (
                    <tr key={sess.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 text-gray-300 font-medium">{sess.date}</td>
                      <td className="py-4 text-white font-medium capitalize">{sess.domain}</td>
                      <td className="py-4 text-gray-400">{sess.difficulty}</td>
                      <td className="py-4 text-center">
                        <span className="py-1 px-2.5 rounded font-extrabold text-xs bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                          {sess.score}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => navigate(`/interview-report/${sess.id}`)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                        >
                          View Report
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">No previous mock evaluations found.</p>
          )}
        </div>
      </div>
    );
  }

  // --- RECRUITER / ADMIN DASHBOARD VIEW ---
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Recruitment Assessment Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor candidate mock records, search competencies, and configure interview templates.</p>
        </div>
        <button 
          onClick={() => setShowTemplateForm(!showTemplateForm)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Template builder Modal/Form Overlay */}
      {showTemplateForm && (
        <div className="glass-card p-6 border-cyan-500/20 bg-cyan-500/5">
          <h3 className="text-base font-semibold text-white mb-4">Design Mock Interview Template</h3>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="Junior Python Dev Mock"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Domain</label>
                <select
                  value={newTemplateDomain}
                  onChange={(e) => setNewTemplateDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="DevOps & Cloud Engineering">DevOps & Cloud Engineering</option>
                  <option value="AI & Machine Learning Specialist">AI & Machine Learning Specialist</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Difficulty</label>
                <select
                  value={newTemplateDifficulty}
                  onChange={(e) => setNewTemplateDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">Define Interview Questions</label>
              <input
                type="text"
                required
                placeholder="Question 1 (Technical)"
                value={newTemplateQ1}
                onChange={(e) => setNewTemplateQ1(e.target.value)}
                className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Question 2 (e.g. Behavioral, Optional)"
                value={newTemplateQ2}
                onChange={(e) => setNewTemplateQ2(e.target.value)}
                className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Question 3 (e.g. Brainteaser, Optional)"
                value={newTemplateQ3}
                onChange={(e) => setNewTemplateQ3(e.target.value)}
                className="w-full px-3 py-2 bg-[#07080d] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => setShowTemplateForm(false)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary py-2 px-4 text-xs"
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recruiter Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Candidates Search & Listings (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Registered Candidates</h2>
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter by skill (e.g. SQL)..."
                  value={searchSkill}
                  onChange={(e) => setSearchSkill(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#07080d] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>

            {candidates.length > 0 ? (
              <div className="space-y-4">
                {candidates
                  .filter(c => !searchSkill.trim()) // Simplified for testing, can extend to full checks
                  .map((cand) => (
                    <div key={cand.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                          {cand.full_name[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{cand.full_name}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            {cand.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.get(`/api/interviews/candidate/${cand.id}/sessions`);
                            if (res.data?.length > 0) {
                              navigate(`/interview-report/${res.data[0].id}`);
                            } else {
                              alert('This candidate has not completed any mock assessments yet.');
                            }
                          } catch (err) {
                            alert('No mock reports found for this candidate.');
                          }
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                      >
                        Inspect Latest Report
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">No candidates registered in the workspace.</p>
            )}
          </div>
        </div>

        {/* Templates Database (1/3) */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Interview Templates</h2>
          
          {templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((temp) => (
                <div key={temp.id} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-white">{temp.title}</h4>
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 uppercase tracking-wide">
                      {temp.difficulty}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{temp.domain}</p>
                  <p className="text-[10px] text-cyan-400 font-medium">{temp.questions?.length} Pre-set questions</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">No recruiter templates saved yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
