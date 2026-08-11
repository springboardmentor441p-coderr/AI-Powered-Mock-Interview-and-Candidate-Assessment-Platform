import React, { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

export default function Onboarding({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1
  const [file, setFile] = useState(null);
  
  // Step 2
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');
  const [cgpa, setCgpa] = useState('');

  const raw = localStorage.getItem('nexiq_user');
  const user = raw ? JSON.parse(raw) : {};

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (file) {
        await api.uploadResume(user.email, file);
      }
      if (college) {
        await api.updateEducation({ email: user.email, college_name: college, degree, graduation_year: year, cgpa });
      }
      setSuccess('TRANSMISSION COMPLETE');
      setTimeout(() => navigate('dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Transmission failed.');
    } finally { setLoading(false); }
  };

  return (
    <Layout navigate={navigate} active="onboarding">
      <div className="flex flex-col w-full px-gutter pt-8 pb-12">
        {/* Header */}
        <div className="px-gutter mb-12 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] mb-2">Application Portal</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">Profile Configuration</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className={`w-8 h-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />)}
            </div>
            <span className="font-mono-label text-mono-label text-on-surface-variant">STEP 01 / 03</span>
          </div>
        </div>

        {error && (
          <div className="mx-gutter mb-6 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-body-md text-sm">{error}</div>
        )}
        {success && (
          <div className="mx-gutter mb-6 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-body-md text-sm">{success}</div>
        )}

        <form onSubmit={submit} className="px-gutter space-y-gutter">
          {/* Identity */}
          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-12 lg:col-span-4">
              <div className="sticky top-24">
                <h2 className="font-headline-md text-headline-md text-primary mb-2">Academic Profile</h2>
                <p className="font-body-md text-on-surface-variant/70">Ensure your data is accurate. This information helps our AI personalize your interviews.</p>
                <div className="mt-8 p-6 bg-surface-container-low rounded-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <span className="material-symbols-outlined text-primary mb-4 block">hub</span>
                  <div className="font-label-md text-label-md text-on-surface">Live Network Status</div>
                  <div className="font-mono-label text-mono-label text-primary-fixed-dim mt-1">LATENCY: 12ms (OPTIMAL)</div>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono-label text-mono-label text-on-surface-variant uppercase">College / University</label>
                    <input type="text" value={college} onChange={e => setCollege(e.target.value)} required
                      className="bg-surface-container-highest border-b border-outline-variant/30 px-4 py-4 rounded-t-lg text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30"
                      placeholder="e.g. Stanford University" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono-label text-mono-label text-on-surface-variant uppercase">Degree</label>
                    <input type="text" value={degree} onChange={e => setDegree(e.target.value)} required
                      className="bg-surface-container-highest border-b border-outline-variant/30 px-4 py-4 rounded-t-lg text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30"
                      placeholder="e.g. BS Computer Science" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono-label text-mono-label text-on-surface-variant uppercase">Graduation Year</label>
                    <input type="text" value={year} onChange={e => setYear(e.target.value)} required
                      className="bg-surface-container-highest border-b border-outline-variant/30 px-4 py-4 rounded-t-lg text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30"
                      placeholder="e.g. 2024" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono-label text-mono-label text-on-surface-variant uppercase">CGPA / Grade</label>
                    <input type="text" value={cgpa} onChange={e => setCgpa(e.target.value)}
                      className="bg-surface-container-highest border-b border-outline-variant/30 px-4 py-4 rounded-t-lg text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30"
                      placeholder="e.g. 3.8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="grid grid-cols-12 gap-gutter mt-8">
            <div className="col-span-12 lg:col-span-4">
              <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-2">Artifact Upload</h2>
              <p className="font-body-md text-on-surface-variant/70">Our AI parses your experience into actionable data points. Upload your latest resume.</p>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <label 
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className="relative group cursor-pointer block"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <div className={`relative bg-surface-container-low border-2 border-dashed ${file ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/20'} rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all group-hover:border-primary/40 group-hover:bg-surface-container-high`}>
                  <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <span className={`material-symbols-outlined text-4xl ${file ? 'text-primary' : 'text-on-surface-variant'} ${loading ? 'animate-pulse' : ''}`}>
                      {file ? 'task' : 'cloud_upload'}
                    </span>
                  </div>
                  <h3 className={`font-headline-md text-headline-md ${file ? 'text-primary' : 'text-on-surface'} mb-2`}>
                    {file ? file.name : 'Transmit Resume'}
                  </h3>
                  <p className="font-body-md text-on-surface-variant max-w-sm">
                    {file ? 'File ready for transmission' : <>Drag and drop your file here, or <span className="text-primary font-bold">browse neural storage</span></>}
                  </p>
                  <div className="mt-8 flex gap-4">
                    <span className="px-4 py-1 bg-surface-container-lowest rounded-full text-mono-label font-mono-label text-on-surface-variant">PDF</span>
                    <span className="px-4 py-1 bg-surface-container-lowest rounded-full text-mono-label font-mono-label text-on-surface-variant">DOCX</span>
                    <span className="px-4 py-1 bg-surface-container-lowest rounded-full text-mono-label font-mono-label text-on-surface-variant">MAX 10MB</span>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                </div>
              </label>
            </div>
          </div>

          {/* Final Submit */}
          <div className="pt-12 pb-20 flex flex-col items-center justify-center">
            <div className="flex items-center gap-4 mb-8 text-on-surface-variant/50">
              <div className="h-[1px] w-32 bg-outline-variant/20" />
              <span className="font-mono-label text-mono-label uppercase">Finalize Protocol</span>
              <div className="h-[1px] w-32 bg-outline-variant/20" />
            </div>
            <button disabled={loading} type="submit" className="group relative px-12 py-5 bg-primary text-on-primary font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] active:scale-95 disabled:opacity-70">
              <span className="relative z-10 flex items-center gap-3 text-headline-md">
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">refresh</span> PROCESSING...</>
                ) : success ? (
                  <><span className="material-symbols-outlined">check_circle</span> SUCCESS</>
                ) : (
                  <>
                    SUBMIT PROFILE
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-pulse" />
            </button>
            <p className="mt-6 font-mono-label text-mono-label text-on-surface-variant/40 max-w-xs text-center">
              By submitting, you agree to the Neural Data Governance Agreement (v4.2.0)
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
}
