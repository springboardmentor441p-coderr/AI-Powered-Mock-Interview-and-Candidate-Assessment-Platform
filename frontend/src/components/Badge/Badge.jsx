import React from 'react';
import './Badge.css';

export function Badge({ children, variant = 'default', size = 'md' }) {
  return <span className={`badge badge--${variant} badge--${size}`}>{children}</span>;
}

export function DifficultyBadge({ difficulty = 'Easy' }) {
  const normalized = (difficulty || 'Easy').toLowerCase();
  const variant = normalized === 'hard' ? 'danger' : normalized === 'medium' ? 'warning' : 'success';
  return <Badge variant={variant}>{difficulty}</Badge>;
}

export function RatingBadge({ rating = 'Good' }) {
  const normalized = (rating || 'Good').toLowerCase();
  let variant = 'info';
  if (normalized === 'excellent') variant = 'success';
  else if (normalized === 'good') variant = 'primary';
  else if (normalized === 'average') variant = 'warning';
  else if (normalized.includes('improvement')) variant = 'orange';
  else if (normalized === 'poor') variant = 'danger';

  return <Badge variant={variant}>{rating}</Badge>;
}

export function StageBadge({ stage = 'WARM_UP' }) {
  const formatted = stage.replace('_', ' ').toLowerCase();
  return <Badge variant="neutral">{formatted.charAt(0).toUpperCase() + formatted.slice(1)}</Badge>;
}
