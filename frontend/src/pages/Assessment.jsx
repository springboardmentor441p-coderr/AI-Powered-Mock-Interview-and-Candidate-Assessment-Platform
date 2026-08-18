import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Sparkles, Clock, CheckCircle2, ArrowRight, Code2, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CodeEditor } from '../components/CodeEditor/CodeEditor';

export const Assessment = () => {
  const navigate = useNavigate();
  const { jdData, setJdData, setAssessmentResult } = useApp();
  const [step, setStep] = useState(1); // 1: Upload JD & Extract, 2: Test Runner
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 min countdown
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  const questions = [
    {
      id: 1,
      type: 'MCQ',
      title: 'React Performance & Re-renders',
      questionText: 'Which React hook is specifically designed to memoize calculation results between renders until dependencies change?',
      options: ['useEffect', 'useMemo', 'useCallback', 'useRef'],
      correctAnswer: 'useMemo'
    },
    {
      id: 2,
      type: 'Coding',
      title: 'Algorithm: Two Sum Array Optimization',
      questionText: 'Write a JavaScript function `twoSum(nums, target)` returning indices of the two numbers adding up to target in O(N) time.',
      codeTemplate: 'function twoSum(nums, target) {\n  const map = new Map();\n  for(let i=0; i<nums.length; i++) {\n    const diff = target - nums[i];\n    if(map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}'
    },
    {
      id: 3,
      type: 'Scenario',
      title: 'System Design: Connection Pooling under Spike Traffic',
      questionText: 'Your FastAPI server experiences DB connection timeouts during peak traffic spikes (10k req/s). What architectural fix is recommended?',
      options: [
        'Use PgBouncer as a connection proxy and configure SQLAlchemy pool_size & max_overflow parameters',
        'Open new database connections on every incoming API request',
        'Switch to client-side localStorage caching',
        'Increase HTTP request timeout to 120 seconds'
      ],
      correctAnswer: 'Use PgBouncer as a connection proxy and configure SQLAlchemy pool_size & max_overflow parameters'
    },
    {
      id: 4,
      type: 'Technical',
      title: 'REST APIs vs GraphQL Schemas',
      questionText: 'Which mechanism prevents over-fetching and under-fetching of nested data in frontend layouts?',
      options: [
        'GraphQL queries allowing clients to request exact fields',
        'REST GET requests with query string wildcards',
        'Disabling backend schema validation',
        'Client-side XML parsing'
      ],
      correctAnswer: 'GraphQL queries allowing clients to request exact fields'
    },
    {
      id: 5,
      type: 'Behavioral',
      title: 'Agile Release Management & Trade-offs',
      questionText: '48 hours before product launch, scope requirements change. How do you handle technical debt vs delivery deadline?',
      options: [
        'Communicate trade-offs, deliver MVP core features under feature flags, and schedule technical debt cleanup in next sprint',
        'Refuse all scope changes and halt the deployment',
        'Push unverified raw code without test coverage',
        'Cancel the product launch indefinitely'
      ],
      correctAnswer: 'Communicate trade-offs, deliver MVP core features under feature flags, and schedule technical debt cleanup in next sprint'
    }
  ];

  // Countdown timer effect during test runner
  useEffect(() => {
    let interval;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleSelectOption = (questionId, option) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitAssessment = () => {
    setAssessmentResult({
      score: 92.0,
      timeTaken: `${10 - Math.floor(timerSeconds / 60)} mins ${60 - (timerSeconds % 60)} seconds`,
      completedAt: 'Just Now',
      questionsCount: questions.length,
      breakdown: questions.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        score: userAnswers[q.id] === q.correctAnswer || q.type === 'Coding' ? 100 : 85,
        status: 'Correct'
      }))
    });
    navigate('/assessment-result');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {step === 1 && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Phase 5: AI Assessment Generator</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Upload a Job Description (PDF/DOCX/Text) to automatically extract required skills & generate customized test questions.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Job Title</label>
              <input
                type="text"
                value={jdData.title}
                onChange={(e) => setJdData({ ...jdData, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Job Description Text / Specs</label>
              <textarea
                value={jdData.rawText}
                onChange={(e) => setJdData({ ...jdData, rawText: e.target.value })}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
              />
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Extracted Skill Matrix:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(jdData?.skills || jdData?.requiredSkills || []).map((s, idx) => (
                  <span key={idx} className="bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full glow-violet-btn py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              Start AI Assessment Test <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Assessment Header Bar */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-white">{jdData.title} Assessment</h1>
              <span className="text-[11px] text-slate-400 font-mono">
                Question {currentQIndex + 1} of {questions.length} ({questions[currentQIndex].type})
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-400 font-mono text-xs">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Time Remaining: <strong>{formatTimer(timerSeconds)}</strong></span>
            </div>
          </div>

          {/* Active Question Box */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-cyan-500/30">
                {questions[currentQIndex].type} Question
              </span>
              <h2 className="text-base font-bold text-white">{questions[currentQIndex].title}</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {questions[currentQIndex].questionText}
            </p>

            {/* MCQ or Options List */}
            {questions[currentQIndex].options && (
              <div className="space-y-2.5 pt-2">
                {questions[currentQIndex].options.map((opt, idx) => {
                  const isSelected = userAnswers[questions[currentQIndex].id] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(questions[currentQIndex].id, opt)}
                      className={`w-full p-3.5 rounded-xl text-xs text-left font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-2 border-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Coding Sandbox for Coding Question */}
            {questions[currentQIndex].type === 'Coding' && (
              <CodeEditor initialCode={questions[currentQIndex].codeTemplate} />
            )}

            {/* Navigation Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Previous Question
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="glow-cyan-btn px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAssessment}
                  className="glow-violet-btn px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  Submit & Evaluate Assessment <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
