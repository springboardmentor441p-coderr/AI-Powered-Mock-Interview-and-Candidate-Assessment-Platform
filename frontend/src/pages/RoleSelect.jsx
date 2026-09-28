/**
 * RoleSelect.jsx
 * Step 2 of the Live Simulation flow: choose a role within a company.
 */
import React from 'react';
import Layout from '../components/Layout';
import { COMPANIES } from '../data/companyCatalog';

const DIFF_COLOR = {
  Easy:   'bg-primary/10 text-primary border-primary/20',
  Medium: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  Hard:   'bg-error/15 text-error border-error/30',
};

const TYPE_ICON = {
  Technical:      'code',
  Behavioral:     'psychology',
  'System Design': 'hub',
  HR:             'handshake',
};

export default function RoleSelect({ navigate }) {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('company');
  const company = COMPANIES.find(c => c.id === companyId);

  if (!company) {
    return (
      <Layout navigate={navigate} active="company-select">
        <div className="flex items-center justify-center h-64">
          <p className="text-on-surface-variant">Company not found. <button onClick={() => navigate('company-select')} className="text-primary underline">Go back</button></p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navigate={navigate} active="company-select">
      <div className="flex flex-col px-gutter pt-8 pb-12">
        {/* Header */}
        <div className="mb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate('company-select')} className="font-mono-label text-mono-label text-on-surface-variant hover:text-primary transition-colors text-[11px] uppercase">
              Companies
            </button>
            <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px]">chevron_right</span>
            <span className="font-mono-label text-mono-label text-primary text-[11px] uppercase">{company.name}</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-outline-variant/10"
              style={{ background: `${company.color}20` }}
            >
              {company.logo}
            </div>
            <div>
              <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">
                Live Simulation · Step 2 / 3
              </span>
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">
                {company.name} — Open Roles
              </h1>
            </div>
          </div>
          <p className="font-body-md text-on-surface-variant max-w-xl">{company.description}</p>
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {company.roles.map(role => (
            <button
              key={role.id}
              id={`role-card-${role.id}`}
              onClick={() => navigate(`live-apply?company=${company.id}&role=${role.id}`)}
              className="group text-left bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-7 border border-outline-variant/10 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.1)] hover:scale-[1.01] transition-all duration-300 flex flex-col gap-5 relative overflow-hidden"
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

              {/* Icon + New badge */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">{TYPE_ICON[role.type] || 'work'}</span>
                </div>
                <div className="flex gap-2">
                  {role.isNew && (
                    <span className="font-mono-label text-mono-label text-[10px] uppercase bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  <span className={`font-mono-label text-mono-label text-[10px] uppercase px-2 py-0.5 rounded-full border ${DIFF_COLOR[role.difficulty]}`}>
                    {role.difficulty}
                  </span>
                </div>
              </div>

              {/* Title + domain */}
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1 group-hover:text-primary transition-colors">{role.title}</h2>
                <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">{role.domain}</p>
              </div>

              {/* Type + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="font-mono-label text-mono-label text-on-surface-variant/50 text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">{TYPE_ICON[role.type] || 'work'}</span>
                  {role.type} Interview
                </span>
                <span className="font-mono-label text-mono-label text-primary text-[11px] uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Apply Now <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
