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
    <html lang="en" className="dark min-h-screen">
      <body className="min-h-screen bg-[var(--bg-primary)] bg-gradient-to-b from-[#0B0C10] via-[#0F0E17] to-[#0F0E17] bg-fixed text-[#F9FAFB] flex flex-col antialiased selection:bg-[#8B5CF6]/35 selection:text-[#F9FAFB]">
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
