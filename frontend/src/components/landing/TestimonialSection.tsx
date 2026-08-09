'use client';

import React from 'react';
import { Star, Quote, Award, Building2 } from 'lucide-react';

export const TestimonialSection: React.FC = () => {
  const reviews = [
    {
      name: 'David K. Vance',
      role: 'Staff Systems Architect at Meta',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      text: 'The AI interviewer probed my distributed caching answer with followup edge cases that came up in my actual Meta architectural loop.',
      score: 94
    },
    {
      name: 'Priya Sharma',
      role: 'Talent Acquisition Lead at Stripe',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      text: 'InterVio reduced our technical screening time by 65%. We evaluate candidates side-by-side using the ATS pipeline and proctoring audit log.',
      score: 91
    },
    {
      name: 'Marcus Thorne',
      role: 'Engineering Director at Amazon',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      text: 'The resume parser customizes technical questions based on the candidate’s actual tech stack. Having printable radar scorecards gives team alignment.',
      score: 88
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-[#059669]" />
            <span>Trusted Enterprise Results</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Used by Candidates & Enterprise Engineering Teams
          </h2>
          <p className="text-slate-600 text-sm">
            Over 25,000+ candidates and top hiring teams rely on InterVio for unbiased screening.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Score: {rev.score}/100
                  </span>
                </div>
                <Quote className="w-6 h-6 text-slate-400" />
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{rev.name}</h4>
                  <span className="text-[11px] text-slate-500">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
