import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const TITLE = 'TokensDrift — Design System Drift Scanner & Score for Your Codebase';
const DESCRIPTION =
  'Scan your codebase for hardcoded colors, off-scale spacing, and low design token adoption. Get a shareable Drift Score in 60 seconds with one command: npx tokensdrift. Free, local, zero dependencies.';

export const metadata: Metadata = {
  metadataBase: new URL('https://tokensdrift.com'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'design system drift',
    'design token adoption',
    'detect hardcoded colors',
    'design system audit tool',
    'tailwind arbitrary values lint',
    'design tokens',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'TokensDrift',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    google: 'Tc0erjPjfcD4JYNA65oo665r0mkXYWErP8zw-Hd7Er8',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
