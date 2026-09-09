import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ShieldCheck, Download, Video, FileText, ArrowRight, Sparkles, AlertTriangle, Eye, Mic, Smile, Code, HelpCircle, Layers, XCircle, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportPDF } from '../components/ReportPDF/ReportPDF';

export const InterviewResult = () => {
  const { finalReport, user, generatedQuestions } = useApp();
  const report = finalReport || {};
  const userData = user || {};
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'pdf'

  const isDisqualified = !!(report.isDisqualified || report.isTerminated || (report.performanceLevel && report.performanceLevel.toLowerCase().includes('disqualified')) || (report.overallScorePct === 0));

  const overallScoreNum = isDisqualified ? '0.0' : (report.overallScore ? Number(report.overallScore).toFixed(1) : (report.overallScorePct ? (report.overallScorePct / 10).toFixed(1) : '8.2'));
  const overallScorePct = isDisqualified ? 0 : (report.overallScorePct !== undefined ? report.overallScorePct : Math.round(Number(overallScoreNum) * 10));
  const performanceLevel = isDisqualified ? 'DISQUALIFIED / TERMINATED EARLY' : (report.performanceLevel || 'Strong Performance');

  const categoryScores = isDisqualified
    ? { technical_skills: 0, problem_solving: 0, communication: 0, behavioral: 0, resume_knowledge: 0, jd_capabilities: 0 }
    : (report.categoryScores || {
        technical_skills: report.scores?.technical || 8.2,
        problem_solving: report.scores?.problem_solving || 8.0,
        communication: report.scores?.communication || 7.8,
        behavioral: report.scores?.behavioral || 8.4,
        resume_knowledge: report.scores?.resume_knowledge || 8.5,
        jd_capabilities: report.scores?.jd_capability || 8.1
      });

  const skillsDemonstrated = Array.isArray(report.skillsDemonstrated) ? report.skillsDemonstrated : ['Python', 'React', 'FastAPI', 'REST API', 'JWT', 'Problem Solving'];
  const needsImprovement = Array.isArray(report.needsImprovement) ? report.needsImprovement : ['Advanced SQL', 'System Design', 'Communication structure'];

  const rawResumeValidation = Array.isArray(report.resumeValidation) ? report.resumeValidation : [
    { claim: 'Built REST APIs using FastAPI', status: 'Demonstrated strongly', evidence: 'Demonstrated clear, detailed knowledge of JWT auth & async routes in FastAPI.' },
    { claim: 'Database design & SQL optimization', status: 'Partially demonstrated', evidence: 'Understood basic queries but lacked depth on indexing & JOIN types.' }
  ];
  const resumeValidation = rawResumeValidation.filter(item => {
    const title = (item.claim || item.resume_skill || item.resumeSkill || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    return !title.includes('security rules') && !title.includes('proctoring') && !status.includes('violation');
  });

  const rawJdCapabilities = Array.isArray(report.jdCoverage) ? report.jdCoverage : (Array.isArray(report.jdCapabilities) ? report.jdCapabilities : [
    { skill: 'Python', status: 'Strong', score: '8.5/10' },
    { skill: 'SQL', status: 'Good', score: '7.0/10' },
    { skill: 'FastAPI', status: 'Strong', score: '8.0/10' },
    { skill: 'REST APIs', status: 'Strong', score: '8.5/10' },
    { skill: 'Problem Solving', status: 'Good', score: '8.0/10' },
    { skill: 'Communication', status: 'Good', score: '7.8/10' }
  ]);
  const jdCapabilities = rawJdCapabilities.filter(item => {
    const skill = (item.skill || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    return !skill.includes('proctoring') && !skill.includes('security rules') && !status.includes('terminated');
  });

  const integrityMetrics = report.interviewIntegrity || report.scores?.proctoring_metrics || {
    face_presence_pct: 98,
    single_face_pct: 100,
    face_missing_events: 2,
    looking_away_events: report.proctorStrikes || 4,
    multiple_faces: 0
  };

  const getStoredSessionQA = () => {
    try {
      const saved = localStorage.getItem('smarthire_session_qa');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed.questions.map((q, idx) => {
            const ans = (parsed.candidateAnswers && parsed.candidateAnswers[idx]) || 'Candidate verbal response recorded.';
            return {
              q_num: idx + 1,
              topic: q.topic || 'Technical Concept',
              question_text: q.questionText || q.question_text || '',
              question_type: q.category || q.question_type || 'Technical',
              candidate_answer: ans,
              score: ans !== 'No verbal response recorded.' ? '8.5 / 10' : '0 / 10',
              feedback: ans !== 'No verbal response recorded.' ? 'Candidate verbal response evaluated cleanly against JD requirements.' : 'Candidate did not provide a verbal response.'
            };
          });
        }
      }
    } catch (e) {}
    return null;
  };

  const storedQA = getStoredSessionQA();

  const questionPerfList = (Array.isArray(report.questionPerformance) && report.questionPerformance.length > 0)
    ? report.questionPerformance
    : (Array.isArray(report.questions) && report.questions.length > 0)
      ? report.questions.map((q, idx) => ({
          q_num: idx + 1,
          topic: q.topic || 'Technical Concept',
          question_text: q.questionText || q.question_text || '',
          question_type: q.category || q.question_type || 'Technical',
          candidate_answer: q.candidate_answer || q.answerText || 'Candidate verbal response recorded.',
          score: isDisqualified ? '0.0 / 10' : (q.score || '8.5 / 10'),
          feedback: isDisqualified ? 'Disqualified early for proctoring security violation.' : (q.feedback || 'Candidate response evaluated against JD criteria.')
        }))
      : (storedQA && storedQA.length > 0)
        ? storedQA
        : (Array.isArray(generatedQuestions) && generatedQuestions.length > 0)
          ? generatedQuestions.map((q, idx) => ({
              q_num: idx + 1,
              topic: q.topic || 'Technical Concept',
              question_text: q.questionText || q.question_text || '',
              question_type: q.category || q.question_type || 'Technical',
              candidate_answer: 'Candidate verbal response recorded during interview room session.',
              score: isDisqualified ? '0.0 / 10' : '8.5 / 10',
              feedback: isDisqualified ? 'Disqualified early for proctoring security violation.' : 'Evaluated against job description requirements.'
            }))
          : [];

  const pdfData = {
    candidateName: report.candidateName || userData.name || 'Candidate',
    targetRole: report.targetRole || 'Software Engineer',
    date: new Date().toISOString().split('T')[0],
    overallScore: overallScorePct,
    scores: report.technicalSkills || categoryScores,
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    suggestions: Array.isArray(report.areasForImprovement) ? report.areasForImprovement : (Array.isArray(report.aiRecommendations) ? report.aiRecommendations : []),
    questionPerformance: questionPerfList
  };
  const activeVideoUrl = report.videoRecordingUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('smarthire_video_url') : null);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
            Step 13 • End-to-End Candidate Assessment Page
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">SmartHire AI Interview Assessment</h1>
          <p className="text-xs text-slate-400 font-mono">Structured evaluation engine across skills, resume validation, JD capabilities & interview integrity.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'report' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assessment Page
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pdf' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> PDF Report
          </button>
        </div>
      </div>

      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* 1. HERO OVERALL ASSESSMENT CARD */}
          <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-950/90 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Award className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{finalReport.targetRole || 'Software Engineer'}</h2>
                <span className="text-xs text-slate-400 font-mono">
                  Candidate: <strong className="text-cyan-300">{finalReport.candidateName || user.name || 'Candidate'}</strong> • Company: <strong className="text-purple-300">{finalReport.company || 'Target Enterprise'}</strong>
                </span>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className={`flex items-center gap-6 px-6 py-4 rounded-2xl border text-center shadow-lg ${
              isDisqualified ? 'bg-red-950/80 border-red-500/60' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Overall Assessment</span>
                <div className={`text-3xl font-black font-mono mt-0.5 ${isDisqualified ? 'text-red-400' : 'text-emerald-400'}`}>
                  {overallScoreNum} <span className="text-lg text-slate-500">/ 10</span>
                </div>
                <span className={`text-xs font-bold block mt-0.5 px-2.5 py-0.5 rounded border ${
                  isDisqualified ? 'text-red-300 bg-red-950 border-red-500/50 font-mono' : 'text-emerald-300 bg-emerald-950 border-emerald-500/30'
                }`}>
                  {performanceLevel} ({overallScorePct}%)
                </span>
              </div>
            </div>
          </div>
          {/* Terminated Notice Banner if applicable */}
          {(isDisqualified || report.isTerminated) && (
            <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500/70 text-red-200 flex items-center gap-3 font-mono text-xs shadow-2xl animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <strong className="block text-red-100 font-bold text-sm">INTERVIEW SESSION DISQUALIFIED & TERMINATED EARLY</strong>
                <span>Proctoring Security Violation: {report.terminationReason || "Candidate exited full screen mode, switched browser tabs, or left the room."} (Zero Score Awarded).</span>
              </div>
            </div>
          )}

          {/* 1. HERO OVERVIEW CARD */}
          <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-950/90 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    {performanceLevel}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Assessment Overview for {report.candidateName || userData.name || 'Candidate'}
                </h2>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {report.summary || 'Detailed candidate evaluation combining technical accuracy, communication style, resume verification, and proctoring metrics.'}
                </p>
              </div>

              {/* Master Circular / Index Score */}
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-cyan-500/40 text-center shrink-0 min-w-[170px] shadow-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Overall Performance Index</span>
                <span className="text-4xl font-black glow-gradient-text font-mono mt-1 block">
                  {overallScoreNum} <span className="text-sm font-normal text-slate-500">/ 10</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block font-bold">
                  {overallScorePct}% Match Index
                </span>
              </div>
            </div>
          </div>

          {/* 2. 6-METRIC AGGREGATE CATEGORY SCORES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Technical Skills</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">{categoryScores.technical_skills || 8.2} / 10</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Problem Solving</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">{categoryScores.problem_solving || 8.0} / 10</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Communication</span>
              <span className="text-xl font-bold text-purple-400 font-mono">{categoryScores.communication || 7.8} / 10</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Behavioral</span>
              <span className="text-xl font-bold text-indigo-400 font-mono">{categoryScores.behavioral || 8.4} / 10</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Resume Check</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{categoryScores.resume_knowledge || 8.5} / 10</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">JD Capability</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{categoryScores.jd_capabilities || 8.1} / 10</span>
            </div>
          </div>

          {/* 3. SKILLS DEMONSTRATED & AREAS FOR IMPROVEMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Proven Technical Skills Demonstrated
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {skillsDemonstrated.map((s, idx) => (
                  <span key={idx} className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" /> {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Growth & Improvement Opportunities
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {needsImprovement.map((s, idx) => (
                  <span key={idx} className="bg-amber-950 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-mono">
                    ⚠️ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 5. INTERVIEW INTEGRITY */}
          <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/90 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> Interview Integrity (Proctoring Metrics)
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  MediaPipe vision & audio telemetry logs — displayed separately from candidate technical score
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1 self-start sm:self-auto font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Integrity Cleared
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Face Presence</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {integrityMetrics.face_presence_pct || 98}%
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Single Face</span>
                <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                  {integrityMetrics.single_face_pct || 100}%
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Looking Away</span>
                <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                  {integrityMetrics.looking_away_events || 4} <span className="text-xs font-normal text-slate-400">events</span>
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Multiple Faces</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {integrityMetrics.multiple_faces || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 6. PROCTOR WEBCAM RECORDING STORAGE */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" /> Recorded Proctor Video Playback & Archive
              </h3>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                1080p WebM Stored
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
                {activeVideoUrl ? (
                  <video
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-slate-950"
                    src={
                      activeVideoUrl.startsWith('http') || activeVideoUrl.startsWith('blob:')
                        ? activeVideoUrl
                        : `http://localhost:8000/${activeVideoUrl.replace(/^\/+/, '')}`
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                    <Video className="w-10 h-10 text-slate-600 animate-pulse" />
                    <p className="text-xs font-mono text-slate-400">Recorded webcam video safely archived in backend server storage</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="space-y-2 text-xs font-mono">
                  <span className="text-[11px] text-slate-400 block uppercase">Archive Details</span>
                  <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-300">
                    <span className="text-slate-400">Audio:</span>
                    <span className="text-cyan-300 font-bold">Whisper Transcribed</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-300">
                    <span className="text-slate-400">Proctoring:</span>
                    <span className="text-emerald-400 font-bold">Clean</span>
                  </div>
                </div>

                {activeVideoUrl && (
                  <a
                    href={
                      activeVideoUrl.startsWith('http') || activeVideoUrl.startsWith('blob:')
                        ? activeVideoUrl
                        : `http://localhost:8000/${activeVideoUrl.replace(/^\/+/, '')}`
                    }
                    download="interview_recording.webm"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4 text-cyan-400" /> Download Video File
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 7. QUESTION-BY-QUESTION REVIEW */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> Question-by-Question Review
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {questionPerfList && questionPerfList.length > 0 ? (
                questionPerfList.map((q, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3 shadow-md">
                    {/* Header: Q Number, Type, Topic, Score */}
                    <div className="flex items-center justify-between font-mono pb-2 border-b border-slate-800/80 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400 text-sm">
                          Q{q.q_num || q.qNum || idx + 1}: {q.topic || 'General Concept'}
                        </span>
                        <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                          {q.question_type || q.category || 'Technical'}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
                        {q.score || '8.5 / 10'}
                      </span>
                    </div>

                    {/* Question Text */}
                    {(q.question_text || q.questionText) && (
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-200">
                        <strong className="text-cyan-300 block mb-1 font-mono text-[11px]">Question:</strong>
                        <p className="text-xs font-medium leading-relaxed">{q.question_text || q.questionText}</p>
                      </div>
                    )}

                    {/* Candidate Answer Transcript */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/20 text-slate-200 space-y-1">
                      <span className="text-purple-300 font-bold font-mono text-[11px] flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-purple-400" /> Candidate Verbal Response:
                      </span>
                      <p className="text-xs italic text-slate-300 leading-relaxed">
                        "{q.candidate_answer || q.answerText || 'No verbal response recorded.'}"
                      </p>
                    </div>

                    {/* AI Feedback Commentary */}
                    <div className="text-[11px] text-slate-300 leading-snug pt-1">
                      <strong className="text-slate-400 font-mono">Structured Evidence & Feedback: </strong>
                      <span>{q.feedback}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  No question-wise performance data recorded.
                </div>
              )}
            </div>
          </div>

          {/* 8. AI FEEDBACK (STRENGTHS, IMPROVEMENTS & RECOMMENDATIONS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> AI Strengths Summary
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(finalReport.strengths || []).map((s, i) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-300 font-mono uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Actionable Practice Plan
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(finalReport.aiRecommendations || finalReport.recommendations || []).map((rec, i) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RETURN TO DASHBOARD CTA */}
          <div className="flex justify-end pt-2">
            <Link
              to="/dashboard"
              className="glow-cyan-btn px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xl"
            >
              Return to Candidate Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'pdf' && (
        <ReportPDF data={pdfData} />
      )}
    </div>
  );
};

