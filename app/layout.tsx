import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'ShulePulse', template: '%s | ShulePulse' },
  description: 'Mawasiliano ya shule kwa wakati halisi kwa walimu, wazazi na shule za Tanzania.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'ShulePulse', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
