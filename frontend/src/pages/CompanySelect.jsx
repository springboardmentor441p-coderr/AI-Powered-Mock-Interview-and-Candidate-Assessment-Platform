/**
 * CompanySelect.jsx
 * Step 1 of the Live Simulation flow: choose a company.
 */
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { COMPANIES } from '../data/companyCatalog';

export default function CompanySelect({ navigate }) {
  const [hovered, setHovered] = useState(null);

  return (
    <Layout navigate={navigate} active="company-select">
      <div className="flex flex-col px-gutter pt-8 pb-12">
        {/* Header */}
        <div className="mb-12">
          <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-2">
            Live Simulation · Step 1 / 3
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">
            Choose a Company
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2 max-w-xl">
            Select the company you want to interview for. Each company has curated roles with tailored interview questions.
          </p>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {COMPANIES.map(company => (
            <button
              key={company.id}
              id={`company-card-${company.id}`}
              onClick={() => navigate(`role-select?company=${company.id}`)}
              onMouseEnter={() => setHovered(company.id)}
              onMouseLeave={() => setHovered(null)}
              className={`relative group text-left bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 flex flex-col gap-4 overflow-hidden ${
                hovered === company.id
                  ? 'border-primary/40 shadow-[0_0_30px_rgba(0,240,255,0.15)] scale-[1.02]'
                  : 'border-outline-variant/10 hover:border-primary/20'
              }`}
            >
              {/* Background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top left, ${company.color}15, transparent 70%)` }}
              />

              {/* Logo + New badge */}
              <div className="flex items-start justify-between relative z-10">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border border-outline-variant/10"
                  style={{ background: `${company.color}20` }}
                >
                  {company.logo}
                </div>
                {company.isNew && (
                  <span className="font-mono-label text-mono-label text-[10px] uppercase bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </div>

              {/* Name + HQ */}
              <div className="relative z-10">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{company.name}</h2>
                <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">{company.hq}</p>
                <p className="font-body-md text-on-surface-variant/70 text-sm mt-2 line-clamp-2">{company.description}</p>
              </div>

              {/* Role count + arrow */}
              <div className="flex items-center justify-between mt-auto relative z-10">
                <span className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">
                  {company.roles.length} roles available
                </span>
                <span className={`material-symbols-outlined text-[18px] transition-all duration-300 ${
                  hovered === company.id ? 'text-primary translate-x-1' : 'text-on-surface-variant/30'
                }`}>arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
