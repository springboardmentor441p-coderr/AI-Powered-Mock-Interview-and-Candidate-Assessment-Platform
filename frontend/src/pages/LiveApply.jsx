/**
 * LiveApply.jsx
 * Step 3 of the Live Simulation flow: Apply page for a specific company + role.
 * Collects LinkedIn, GitHub, LeetCode, HackerRank, DOB, certifications.
 * Stores in sessionStorage, then starts the interview session.
 */
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { COMPANIES } from '../data/companyCatalog';
import { api } from '../services/api';

const INPUT_CLS = 'w-full bg-surface-container-highest border-b border-outline-variant/30 px-4 py-4 rounded-t-lg text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30';
const LABEL_CLS = 'font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px] mb-1.5 block';

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

export default function LiveApply({ navigate }) {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('company');
  const roleId = params.get('role');

  const company = COMPANIES.find(c => c.id === companyId);
  const role = company?.roles.find(r => r.id === roleId);

  // Form state
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [leetcode, setLeetcode] = useState('');
  const [hackerrank, setHackerrank] = useState('');
  const [dob, setDob] = useState('');
  const [certs, setCerts] = useState([{ name: '', issuer: '' }]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!company || !role) {
    return (
      <Layout navigate={navigate} active="company-select">
        <div className="flex items-center justify-center h-64">
          <p className="text-on-surface-variant">
            Invalid company or role. <button onClick={() => navigate('company-select')} className="text-primary underline">Go back</button>
          </p>
        </div>
      </Layout>
    );
  }

  // Certifications helpers
  const addCert = () => setCerts(prev => [...prev, { name: '', issuer: '' }]);
  const removeCert = (i) => setCerts(prev => prev.filter((_, idx) => idx !== i));
  const updateCert = (i, field, val) => setCerts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const validate = () => {
    const e = {};
    if (!linkedin || !isValidUrl(linkedin)) e.linkedin = 'Valid LinkedIn URL required (e.g. https://linkedin.com/in/username)';
    if (!github || !isValidUrl(github)) e.github = 'Valid GitHub URL required (e.g. https://github.com/username)';
    if (leetcode && !isValidUrl(leetcode)) e.leetcode = 'Must be a valid URL if provided';
    if (hackerrank && !isValidUrl(hackerrank)) e.hackerrank = 'Must be a valid URL if provided';
    if (!dob) e.dob = 'Date of Birth is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const applyData = {
      companyId, companyName: company.name,
      roleId, roleTitle: role.title, roleDomain: role.domain,
      linkedin, github, leetcode, hackerrank, dob,
      certifications: certs.filter(c => c.name),
      submittedAt: new Date().toISOString(),
    };
    sessionStorage.setItem('nexiq_live_apply', JSON.stringify(applyData));

    setLoading(true);
    setSubmitError('');
    try {
      const res = await api.startSession({
        interview_type: role.type,
        domain: role.domain,
        difficulty: role.difficulty,
        num_questions: 5,
        company_name: company.name,
        job_title: role.title,
      });
      navigate(`live-interview?sid=${res.session_id}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to start session. Ensure the backend is running and an OpenAI key is configured.');
      setLoading(false);
    }
  };

  return (
    <Layout navigate={navigate} active="company-select">
      <div className="flex flex-col px-gutter pt-8 pb-16">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('company-select')} className="font-mono-label text-mono-label text-on-surface-variant hover:text-primary transition-colors text-[11px] uppercase">Companies</button>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px]">chevron_right</span>
          <button onClick={() => navigate(`role-select?company=${companyId}`)} className="font-mono-label text-mono-label text-on-surface-variant hover:text-primary transition-colors text-[11px] uppercase">{company.name}</button>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px]">chevron_right</span>
          <span className="font-mono-label text-mono-label text-primary text-[11px] uppercase">Apply</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-outline-variant/10" style={{ background: `${company.color}20` }}>
            {company.logo}
          </div>
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">Live Simulation · Step 3 / 3</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">{role.title}</h1>
            <p className="font-mono-label text-mono-label text-on-surface-variant text-[12px] uppercase mt-0.5">{company.name} · {role.domain}</p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-body-md text-sm">{submitError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

          {/* Professional Links */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-7 border border-outline-variant/10 space-y-6">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Professional Profiles</h2>
              <p className="font-body-md text-on-surface-variant/70 text-sm">LinkedIn and GitHub are required. LeetCode and HackerRank are optional.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn */}
              <div>
                <label className={LABEL_CLS}>LinkedIn Profile <span className="text-error">*</span></label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">link</span>
                  <input id="apply-linkedin" type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                    className={`${INPUT_CLS} flex-1`} placeholder="https://linkedin.com/in/username" />
                </div>
                {errors.linkedin && <p className="text-error text-[11px] mt-1">{errors.linkedin}</p>}
              </div>

              {/* GitHub */}
              <div>
                <label className={LABEL_CLS}>GitHub Profile <span className="text-error">*</span></label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">code</span>
                  <input id="apply-github" type="url" value={github} onChange={e => setGithub(e.target.value)}
                    className={`${INPUT_CLS} flex-1`} placeholder="https://github.com/username" />
                </div>
                {errors.github && <p className="text-error text-[11px] mt-1">{errors.github}</p>}
              </div>

              {/* LeetCode */}
              <div>
                <label className={LABEL_CLS}>LeetCode Profile <span className="text-on-surface-variant/40">(optional)</span></label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">terminal</span>
                  <input id="apply-leetcode" type="url" value={leetcode} onChange={e => setLeetcode(e.target.value)}
                    className={`${INPUT_CLS} flex-1`} placeholder="https://leetcode.com/username" />
                </div>
                {errors.leetcode && <p className="text-error text-[11px] mt-1">{errors.leetcode}</p>}
              </div>

              {/* HackerRank */}
              <div>
                <label className={LABEL_CLS}>HackerRank Profile <span className="text-on-surface-variant/40">(optional)</span></label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">military_tech</span>
                  <input id="apply-hackerrank" type="url" value={hackerrank} onChange={e => setHackerrank(e.target.value)}
                    className={`${INPUT_CLS} flex-1`} placeholder="https://hackerrank.com/username" />
                </div>
                {errors.hackerrank && <p className="text-error text-[11px] mt-1">{errors.hackerrank}</p>}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-7 border border-outline-variant/10 space-y-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Personal Information</h2>
            <div className="max-w-xs">
              <label className={LABEL_CLS}>Date of Birth <span className="text-error">*</span></label>
              <input id="apply-dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
                className={INPUT_CLS} max={new Date().toISOString().split('T')[0]} />
              {errors.dob && <p className="text-error text-[11px] mt-1">{errors.dob}</p>}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-7 border border-outline-variant/10 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Certifications</h2>
                <p className="font-body-md text-on-surface-variant/70 text-sm mt-0.5">Add any relevant certifications.</p>
              </div>
              <button type="button" onClick={addCert}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl font-mono-label text-mono-label text-[11px] uppercase hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-[16px]">add</span> Add
              </button>
            </div>

            <div className="space-y-3">
              {certs.map((cert, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    {i === 0 && <label className={LABEL_CLS}>Certification Name</label>}
                    <input
                      id={`cert-name-${i}`}
                      type="text" value={cert.name} onChange={e => updateCert(i, 'name', e.target.value)}
                      className={INPUT_CLS} placeholder="e.g. AWS Solutions Architect" />
                  </div>
                  <div className="col-span-5">
                    {i === 0 && <label className={LABEL_CLS}>Issuing Body</label>}
                    <input
                      id={`cert-issuer-${i}`}
                      type="text" value={cert.issuer} onChange={e => updateCert(i, 'issuer', e.target.value)}
                      className={INPUT_CLS} placeholder="e.g. Amazon Web Services" />
                  </div>
                  <div className={`col-span-2 flex ${i === 0 ? 'items-end pb-1' : 'items-start'}`}>
                    <button type="button" onClick={() => removeCert(i)} disabled={certs.length === 1}
                      className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              id="apply-submit-btn"
              className="w-full max-w-md py-5 bg-primary text-on-primary font-bold rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed font-headline-md"
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Starting Session…</>
              ) : (
                <><span className="material-symbols-outlined">rocket_launch</span> Submit & Start Interview</>
              )}
            </button>
            <p className="font-mono-label text-mono-label text-on-surface-variant/40 text-center text-[11px] max-w-sm uppercase">
              By submitting you confirm all information is accurate. This starts your {role.difficulty} difficulty live simulation.
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
}
