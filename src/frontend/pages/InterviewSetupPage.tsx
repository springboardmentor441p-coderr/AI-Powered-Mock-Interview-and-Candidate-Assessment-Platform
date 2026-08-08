import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { interviewService } from '../services/interviewService';
import { InterviewType, InterviewConfig } from '../../types';
import {
  Code2,
  Users,
  Brain,
  Cpu,
  Clock,
  Sparkles,
  Play,
  CheckCircle2,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<InterviewType>('Technical');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState<'Junior' | 'Mid' | 'Senior' | 'Lead'>('Senior');
  const [questionCount, setQuestionCount] = useState(3);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(25);
  const [includeCodeSnippet, setIncludeCodeSnippet] = useState(true);
  const [customTopic, setCustomTopic] = useState('React Hooks, TypeScript Types, System Design, Express REST APIs');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let resumeSkills: string[] = [];
    const storedResume = localStorage.getItem('smarthire_parsed_resume');
    if (storedResume) {
      try {
        const parsed = JSON.parse(storedResume);
        if (parsed && Array.isArray(parsed.skills)) {
          resumeSkills = parsed.skills;
        }
      } catch (e) {
        // ignore
      }
    }

    const config: InterviewConfig = {
      type,
      targetRole,
      experienceLevel,
      questionCount,
      timeLimitMinutes,
      topics: customTopic.split(',').map(t => t.trim()).filter(Boolean),
      includeCodeSnippet,
      resumeSkills,
    };

    try {
      const res = await api.interview.setup(config);
      interviewService.startNewSession(res.config || config, res.questions || []);
      navigate('/interview');
    } catch (err) {
      console.error('Setup error:', err);
      // Fallback setup if API error occurs
      const fallbackQuestions = [
        {
          id: 'q1',
          questionNumber: 1,
          category: config.type,
          questionText: `In a high-scale ${config.targetRole} application, how do you manage state, handle async data synchronization, and prevent performance bottlenecks?`,
          hint: 'Mention client-side caching, optimistic UI updates, request deduplication, and database indexing.',
          timeAllowedSeconds: 300,
        },
        {
          id: 'q2',
          questionNumber: 2,
          category: config.type,
          questionText: 'Explain how you design RESTful APIs or GraphQL endpoints for security, rate limiting, and seamless token-based authentication.',
          hint: 'Discuss JWT validation, refresh tokens, CORS policies, and rate-limiting middleware.',
          timeAllowedSeconds: 300,
        },
        {
          id: 'q3',
          questionNumber: 3,
          category: config.type,
          questionText: 'Describe a challenging engineering bug or system incident you investigated. What diagnostic steps and tools did you use to resolve it?',
          hint: 'Structure using the STAR method: Situation, Task, Action, and Quantified Result.',
          timeAllowedSeconds: 300,
        },
      ];
      interviewService.startNewSession(config, fallbackQuestions);
      navigate('/interview');
    } finally {
      setIsLoading(false);
    }
  };

  const domainOptions = [
    { type: 'Technical' as InterviewType, label: 'Technical & Architecture', icon: Code2, desc: 'Deep dive into code, frameworks, API design and system trade-offs.' },
    { type: 'HR' as InterviewType, label: 'HR & Culture Alignment', icon: Users, desc: 'Career goals, salary alignment, team fit and workplace preferences.' },
    { type: 'Behavioral' as InterviewType, label: 'Behavioral STAR Method', icon: Brain, desc: 'Conflict resolution, leadership scenarios, and team problem solving.' },
    { type: 'Aptitude' as InterviewType, label: 'Aptitude & Logic', icon: Cpu, desc: 'Analytical reasoning, system SLA calculations, and quantitative logic.' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure AI Mock Assessment</h1>
            <p className="text-xs text-slate-500 mt-1">
              Tailor the mock interview domain, difficulty level, and topic focus for accurate assessment.
            </p>
          </div>
        </div>

        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Step 1: Select Domain */}
          <Card title="1. Select Assessment Domain" subtitle="Choose the interview category to evaluate">
            <div className="grid sm:grid-cols-2 gap-4">
              {domainOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => setType(item.type)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200/80 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 2: Role & Seniority Config */}
          <Card title="2. Candidate Profile & Seniority Level" subtitle="Set expected candidate depth">
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Target Job Title</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Senior Full Stack Engineer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Seniority Tier</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Junior">Junior (0-2 YOE)</option>
                  <option value="Mid">Mid Level (2-5 YOE)</option>
                  <option value="Senior">Senior (5-8 YOE)</option>
                  <option value="Lead">Staff / Tech Lead (8+ YOE)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Step 3: Question Parameters & Specific Topics */}
          <Card title="3. Session Duration & Custom Topics" subtitle="Fine-tune time limits and custom subjects">
            <div className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Question Count</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value={3}>3 Questions (Quick Test)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={8}>8 Questions (Deep Assessment)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Total Time Allowed</label>
                  <select
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={25}>25 Minutes</option>
                    <option value={40}>40 Minutes</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCodeSnippet}
                      onChange={(e) => setIncludeCodeSnippet(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">Provide Code Snippets</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Focus Topics / Key Keywords (comma separated)</label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </Card>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={<Play className="h-5 w-5" />}
            >
              Launch Live Interview Session
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
