'use client';

import React from 'react';
import { Hero } from '../components/landing/Hero';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Hero />
    </div>
  );
}
