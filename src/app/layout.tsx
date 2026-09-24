import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { AudioPlayerBar } from '@/components/media/AudioPlayerBar';
import { GalaxyBackground } from '@/components/common/GalaxyBackground';

import { SidebarProvider } from '@/context/SidebarContext';
import { SITE_CONFIG, generateWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: 'Lighthouse Reels - Premium Streaming, Short Reels & Creator Platform',
    template: '%s | Lighthouse Reels',
  },
  description: SITE_CONFIG.description,
  keywords: [
    'Lighthouse Reels',
    'short reels',
    'streaming video',
    'web series',
    'creator blogs',
    'short drama',
    'indie filmmaking',
    'cinematic entertainment',
    'audio streaming',
  ],
  authors: [{ name: 'Lighthouse Reels' }],
  creator: 'Lighthouse Reels',
  publisher: 'Lighthouse Reels Entertainment',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_CONFIG.url,
    siteName: 'Lighthouse Reels',
    title: 'Lighthouse Reels - Premium Streaming, Short Reels & Creator Platform',
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Lighthouse Reels - Premium Streaming Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lighthouse Reels - Premium Streaming, Short Reels & Creator Platform',
    description: SITE_CONFIG.description,
    creator: SITE_CONFIG.twitterHandle,
    images: ['/logo.png'],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    types: {
      'application/rss+xml': `${SITE_CONFIG.url}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = generateWebsiteJsonLd();
  return (
    <html lang="en" className="dark min-h-screen">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[var(--lr-bg-primary)] text-[var(--lr-text-primary)] flex flex-col antialiased selection:bg-[#F4C95D]/25 selection:text-[#F5F1E8]">
        <AuthProvider>
          <SidebarProvider>
            <AudioPlayerProvider>
              <GalaxyBackground />
              <Header />
              <div className="flex flex-1 min-h-[calc(100vh-61px)]">
                <Sidebar />
                <main className="flex-1 overflow-y-auto pb-28 md:pb-24 bg-transparent min-w-0">
                  {children}
                </main>
              </div>
              <AudioPlayerBar />
              <MobileNavbar />
            </AudioPlayerProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
