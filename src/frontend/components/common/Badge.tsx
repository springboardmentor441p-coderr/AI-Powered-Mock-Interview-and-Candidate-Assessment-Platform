import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'technical' | 'hr' | 'behavioral' | 'aptitude' | 'success' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const styles = {
    technical: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    hr: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    behavioral: 'bg-amber-50 text-amber-700 border-amber-200/80',
    aptitude: 'bg-sky-50 text-sky-700 border-sky-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span className={`inline-flex items-center rounded-lg border whitespace-nowrap ${styles[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
