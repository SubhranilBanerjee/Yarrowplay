import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { AppShell } from '@/components/layout/AppShell';
import { GalaxyBackground } from '@/components/common/GalaxyBackground';

import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { WalletProvider } from '@/context/WalletContext';
import { SiteTextProvider } from '@/context/SiteTextContext';
import CoinStoreModal from '@/components/wallet/CoinStoreModal';
import DailyRewardsModal from '@/components/wallet/DailyRewardsModal';
import RewardedAdModal from '@/components/wallet/RewardedAdModal';
import EpisodeUnlockModal from '@/components/wallet/EpisodeUnlockModal';
import { SubscriptionModalContainer } from '@/components/wallet/SubscriptionModalContainer';
import Script from 'next/script';
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
    icon: '/branding/lighthouse-reels-logo.png',
    apple: '/branding/lighthouse-reels-logo.png',
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
    <html lang="en" className="dark min-h-screen" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lighthouse_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');}}else{document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[var(--lr-bg-primary)] text-[var(--lr-text-primary)] flex flex-col antialiased selection:bg-[#F4C95D]/25 selection:text-[#F5F1E8]">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <ThemeProvider>
          <AuthProvider>
            <SiteTextProvider>
              <SidebarProvider>
                <WalletProvider>
                  <AudioPlayerProvider>
                    <GalaxyBackground />
                    <AppShell>{children}</AppShell>

                    {/* DramaBox Monetization Modals */}
                    <CoinStoreModal />
                    <DailyRewardsModal />
                    <RewardedAdModal />
                    <EpisodeUnlockModal />
                    <SubscriptionModalContainer />
                  </AudioPlayerProvider>
                </WalletProvider>
              </SidebarProvider>
            </SiteTextProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
