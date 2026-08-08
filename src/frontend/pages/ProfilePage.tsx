import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { User, CheckCircle2, Save, Sparkles, Code2, ShieldCheck, ArrowLeft } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'Senior');
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      targetRole,
      experienceLevel,
      skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Profile & Target Preferences</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure your technical domain background and target job position to customize AI interview question complexity.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Profile and target job configuration updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Main Account Settings */}
          <Card title="Candidate Details" subtitle="Primary account information">
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'alex.morgan@example.com'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Target Role & Seniority */}
          <Card title="Target Role Parameters" subtitle="Defines question difficulty tier and domain expectations">
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Target Job Title</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Experience Tier</label>
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

          {/* Primary Skills Tag Manager */}
          <Card title="Core Technical Competencies" subtitle="Comma separated skill tags">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Primary Skills List</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="React, TypeScript, Node.js, Express, System Design"
                />
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-2">Active Parsed Badges:</div>
                <div className="flex flex-wrap gap-2">
                  {skillsText.split(',').map(s => s.trim()).filter(Boolean).map((sk, idx) => (
                    <Badge key={idx} variant="technical">
                      {sk}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Save className="h-4 w-4" />}
            >
              Save Profile Settings
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
