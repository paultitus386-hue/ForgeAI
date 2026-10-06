import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ForgeAI — Your AI developer that actually builds.',
  description:
    'ForgeAI is a personal AI coding agent. Describe what you want to build in natural language and let the AI plan, create, test, and debug your software project.',
  keywords: ['AI coding agent', 'AI developer', 'code generation', 'ForgeAI'],
  openGraph: {
    title: 'ForgeAI — Your AI developer that actually builds.',
    description: 'Describe what you want. ForgeAI plans it, builds it, tests it, and helps you ship it.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
