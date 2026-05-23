import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { ThemeProvider } from '@/theme/ThemeContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { prisma } from '@/lib/prisma';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'WoodNest | Luxury Wilderness Cabins',
  description: "Luxury cabins and nature's perfect hideaways with immersive booking experiences.",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let initialTheme = 'woodnest';
  try {
    const themeSetting = await prisma.systemSetting.findUnique({ where: { key: 'theme' } });
    if (themeSetting?.value) {
      initialTheme = themeSetting.value;
    }
  } catch (error) {
    console.error('Error fetching theme from DB:', error);
  }

  return (
    <html lang="en" data-theme={initialTheme}>
      <body className={spaceGrotesk.variable}>
        <ThemeProvider initialTheme={initialTheme as any}>
          <LanguageProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
