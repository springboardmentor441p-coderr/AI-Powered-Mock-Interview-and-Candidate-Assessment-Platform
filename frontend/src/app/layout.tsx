import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AuthModal } from '../components/auth/AuthModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InterVio AI - Enterprise AI Interview & Screening Platform',
  description: 'Automate technical screenings and deliver unbiased AI video interviews with real-time speech evaluation, vision malpractice proctoring, side-by-side applicant ranking, and downloadable candidate scorecards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-white text-slate-900 min-h-screen antialiased flex flex-col`}>
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <AuthModal />
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
