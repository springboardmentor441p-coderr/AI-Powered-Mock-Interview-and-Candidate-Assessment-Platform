'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Code2, 
  Server, 
  Layers, 
  Users, 
  Binary, 
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const RoleMatrix: React.FC = () => {
  const tracks = [
    {
      title: 'Frontend Engineering',
      icon: Code2,
      description: 'Virtual DOM Fiber architecture, state engines, TypeScript, web vitals, state management, WebSockets.',
      badge: 'High Demand'
    },
    {
      title: 'Backend & Microservices',
      icon: Server,
      description: 'Node.js event loop, PostgreSQL sharding, Redis caching, distributed locks, gRPC services.',
      badge: 'Popular'
    },
    {
      title: 'System Design & Architecture',
      icon: Layers,
      description: 'Distributed rate limiters, load balancing, CAP theorem, CDC pipelines, Kafka queues.',
      badge: 'Senior Standard'
    },
    {
      title: 'HR & STAR Behavioral',
      icon: Users,
      description: 'Conflict resolution, leadership scenarios, outage retrospectives, cross-team collaboration.',
      badge: 'Leadership'
    },
    {
      title: 'Data Structures & Algo',
      icon: Binary,
      description: 'Dynamic programming, graph traversal, sliding window, heaps, matrix algorithms.',
      badge: 'Coding Screening'
    },
    {
      title: 'AI/ML & Data Engineering',
      icon: Brain,
      description: 'Transformer models, model inference optimization, vector DBs, RAG pipelines.',
      badge: 'Next-Gen Tech'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
            <span>Target Role & Assessment Tracks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Role-Tailored Screening Tracks
          </h2>
          <p className="text-slate-600 text-sm">
            Equipped with role-specific questions, expected answer key points, and dynamic difficulty scaling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-white transition-all group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#059669] shadow-sm group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
                      {track.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#059669] transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {track.description}
                  </p>
                </div>

                <Link
                  href={`/interview/demo?track=${encodeURIComponent(track.title)}`}
                  className="pt-4 border-t border-slate-200 text-xs font-bold text-slate-700 group-hover:text-[#059669] flex items-center justify-between"
                >
                  <span>Launch Practice Round</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
