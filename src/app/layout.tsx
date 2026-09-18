import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { AudioPlayerBar } from '@/components/media/AudioPlayerBar';
import { GalaxyBackground } from '@/components/common/GalaxyBackground';

export const metadata: Metadata = {
  title: 'Yarrowplay - Streaming, Music, Blogs & Creator Platform',
  description: 'Next-generation entertainment and publishing platform combining video series, streaming audio, creator blogs, and advertising.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full theme-bg-ambient text-white flex flex-col antialiased selection:bg-[#E000FF]/30 selection:text-white">
        <AuthProvider>
          <AudioPlayerProvider>
            <GalaxyBackground />
            <Header />
            <div className="flex flex-1 min-h-[calc(100vh-61px)]">
              <Sidebar />
              <main className="flex-1 overflow-y-auto pb-28 md:pb-24">
                {children}
              </main>
            </div>
            <AudioPlayerBar />
            <MobileNavbar />
          </AudioPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
