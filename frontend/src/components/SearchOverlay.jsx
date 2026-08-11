/**
 * SearchOverlay.jsx
 * Full-screen search overlay triggered by the search icon in the topbar.
 * Searches companies and roles from companyCatalog.
 * Keyboard accessible: Escape to close, type to filter.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ALL_ROLES, COMPANIES } from '../data/companyCatalog';

export default function SearchOverlay({ open, onClose, navigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();

  // Filter companies
  const matchedCompanies = q
    ? COMPANIES.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      ).slice(0, 4)
    : COMPANIES.slice(0, 4);

  // Filter roles
  const matchedRoles = q
    ? ALL_ROLES.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.domain.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q)
      ).slice(0, 6)
    : ALL_ROLES.filter(r => r.isNew).slice(0, 6);

  const handleCompanyClick = (company) => {
    onClose();
    navigate(`role-select?company=${company.id}`);
  };

  const handleRoleClick = (role) => {
    onClose();
    navigate(`live-apply?company=${role.companyId}&role=${role.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[301] px-4">
        <div className="bg-surface-container-low/95 backdrop-blur-2xl rounded-3xl border border-outline-variant/15 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          
          {/* Search input */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-[22px]">search</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, roles, domains…"
              className="flex-1 bg-transparent text-on-surface font-body-md text-[17px] placeholder:text-on-surface-variant/40 focus:outline-none"
              id="search-overlay-input"
            />
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-high/40 transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
            
            {/* Companies section */}
            {matchedCompanies.length > 0 && (
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant/50 uppercase text-[10px] mb-2 px-2">
                  {q ? 'Companies' : 'All Companies'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {matchedCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanyClick(company)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/40 transition-all text-left group"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-outline-variant/10"
                        style={{ background: `${company.color}20` }}
                      >
                        {company.logo}
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors truncate">{company.name}</p>
                        <p className="font-mono-label text-mono-label text-on-surface-variant text-[10px] uppercase">{company.roles.length} roles</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Roles section */}
            {matchedRoles.length > 0 && (
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant/50 uppercase text-[10px] mb-2 px-2">
                  {q ? 'Job Roles' : 'New Opportunities'}
                </p>
                <div className="space-y-1">
                  {matchedRoles.map(role => (
                    <button
                      key={`${role.companyId}-${role.id}`}
                      onClick={() => handleRoleClick(role)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/40 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-surface-container-high/50">
                        {role.companyLogo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors truncate">{role.title}</p>
                        <p className="font-mono-label text-mono-label text-on-surface-variant text-[10px] uppercase">{role.companyName} · {role.domain}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded">{role.difficulty}</span>
                        {role.isNew && (
                          <span className="text-[10px] font-mono bg-primary/15 text-primary px-2 py-0.5 rounded">New</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q && matchedCompanies.length === 0 && matchedRoles.length === 0 && (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2 block">search_off</span>
                <p className="font-body-md text-on-surface-variant">No results for "{query}"</p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-4 px-6 py-3 border-t border-outline-variant/10">
            <span className="font-mono-label text-mono-label text-on-surface-variant/30 text-[10px] uppercase">Press ESC to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
