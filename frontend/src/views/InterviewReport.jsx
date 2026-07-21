import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Award, CheckCircle, HelpCircle, ArrowRight, Download, BookOpen, AlertTriangle, Play, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

export default function InterviewReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedAnswerId, setExpandedAnswerId] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/api/interviews/session/${sessionId}`);
        setSession(response.data);
      } catch (err) {
        setErrorMsg('Failed to load assessment report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const getRubric = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    if (score >= 75) return { label: 'Good', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 60) return { label: 'Average', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (score >= 40) return { label: 'Needs Improvement', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Poor', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 text-sm font-medium">Generating Performance Analytics...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white">Error Loading Report</h2>
        <p className="text-sm text-gray-500 mt-1">{errorMsg || 'Could not fetch session details'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">Go to Dashboard</button>
      </div>
    );
  }

  // Prep Recharts data
  const radarData = [
    { subject: 'Communication', A: session.communication_score, fullMark: 100 },
    { subject: 'Confidence', A: session.confidence_score, fullMark: 100 },
    { subject: 'Technical', A: session.technical_score, fullMark: 100 },
    { subject: 'Professionalism', A: session.professionalism_score, fullMark: 100 },
  ];

  const answersData = session.answers || [];
  const questionsData = session.questions || [];
  
  // Match questions and answers
  const reportQAs = questionsData.map((q) => {
    const ans = answersData.find((a) => a.question_id === q.id);
    return {
      id: q.id,
      question: q.question_text,
      category: q.category,
      answer: ans ? ans.answer_text : 'No response recorded.',
      score: ans ? ans.score : 0,
      feedback: ans ? ans.feedback_text : 'Not evaluated.',
      wpm: ans ? ans.wpm : 0,
      fillerCount: ans ? ans.filler_word_count : 0,
      duration: ans ? ans.duration_seconds : 0,
      audioPath: ans ? ans.audio_path : null
    };
  });

  const rubric = getRubric(session.total_score);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Assessment Complete</span>
          <h1 className="text-2xl font-extrabold text-white">SmartHire Performance Report</h1>
          <p className="text-xs text-gray-400 mt-1">Domain: {session.domain} • Difficulty: {session.difficulty}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button 
            onClick={() => navigate('/interview-setup')}
            className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            New Interview
          </button>
        </div>
      </div>

      {/* Main Grid: Overview radial/radar & analytics (Top section) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Radial Overall Score Card (1/3) */}
        <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 self-start">Overall Evaluation</h2>
          
          <div className="my-6 relative w-40 h-40 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-white/5 fill-transparent" strokeWidth="8" />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                className="stroke-cyan-500 fill-transparent transition-all duration-1000" 
                strokeWidth="10" 
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * (session.total_score || 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{session.total_score || 0}</span>
              <span className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Score</span>
            </div>
          </div>

          <div className={`py-1.5 px-4 rounded-full border text-xs font-bold ${rubric.color}`}>
            Rating: {rubric.label}
          </div>
        </div>

        {/* Radar Dimensions Breakdown (2/3) */}
        <div className="glass-card p-6 md:col-span-2 flex flex-col justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Competency Radar</h2>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255, 255, 255, 0.15)" />
                <Radar 
                  name="Score" 
                  dataKey="A" 
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.25} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Strengths & Weaknesses Panel */}
      {session.feedback && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {session.feedback.strengths && session.feedback.strengths.map((s, idx) => (
                <li key={idx} className="text-sm text-gray-300 leading-relaxed bg-white/5 border border-white/5 p-3.5 rounded-xl">{s}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {session.feedback.weaknesses && session.feedback.weaknesses.map((w, idx) => (
                <li key={idx} className="text-sm text-gray-300 leading-relaxed bg-white/5 border border-white/5 p-3.5 rounded-xl">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Suggested learning paths */}
      {session.feedback?.resources && session.feedback.resources.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Curated Study Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {session.feedback.resources.map((r, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded block w-fit mb-2.5">{r.type}</span>
                  <h4 className="text-sm font-semibold text-white leading-snug">{r.title}</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-normal">{r.url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itemized Questions Breakdown Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Question-by-Question Breakdown</h2>
        
        <div className="space-y-4">
          {reportQAs.map((qa, index) => {
            const isExpanded = expandedAnswerId === qa.id;
            
            return (
              <div key={qa.id} className="glass-card border border-white/10 overflow-hidden">
                {/* Trigger header */}
                <div 
                  onClick={() => setExpandedAnswerId(isExpanded ? null : qa.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate max-w-lg md:max-w-2xl">{qa.question}</h4>
                      <p className="text-xs text-gray-500 mt-1 capitalize">{qa.category} • Pacing: {qa.wpm} WPM</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-white bg-white/5 px-3 py-1 rounded-lg">
                      {qa.score}/100
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-white/5 bg-black/20 space-y-4 text-sm leading-relaxed">
                    {/* Transcript */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate Response</h5>
                        {qa.audioPath && (
                          <div className="flex items-center gap-2 bg-white/5 border border-white/15 px-3 py-1 rounded-xl w-fit">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Voice Recording</span>
                            <audio 
                              controls 
                              src={`http://localhost:8000${qa.audioPath}`} 
                              className="h-7 max-w-[200px] focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300 italic bg-black/40 border border-white/5 p-4 rounded-xl">
                        "{qa.answer}"
                      </p>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase">Duration</span>
                        <span className="text-sm font-bold text-white mt-1 block">{qa.duration}s</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase">Words Spoken</span>
                        <span className="text-sm font-bold text-white mt-1 block">{qa.wpm > 0 ? Math.round(qa.wpm * (qa.duration / 60)) : 0}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase">Speaking Pace</span>
                        <span className="text-sm font-bold text-cyan-400 mt-1 block">{qa.wpm} WPM</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase">Filler Words</span>
                        <span className="text-sm font-bold text-amber-400 mt-1 block">{qa.fillerCount} found</span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="border-t border-white/5 pt-4">
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">AI Feedback & Assessment</h5>
                      <p className="text-gray-300">{qa.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
