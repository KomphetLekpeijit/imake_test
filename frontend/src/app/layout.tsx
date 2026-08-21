import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { I18nProvider } from '@/lib/i18n-context';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Task Scheduler | ตัวจัดการงานอัตโนมัติ',
  description: 'Web-Based Scheduled Task Dispatcher',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            <div className="min-h-screen">
              <Navbar />
              <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
                {children}
              </main>
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
