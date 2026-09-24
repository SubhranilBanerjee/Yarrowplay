import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Creator Blogs & Editorial Stories | Lighthouse Reels',
  description:
    'Explore behind-the-scenes essays, director commentaries, film analysis, and deep dives published by the Lighthouse Reels creator community.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/blogs`,
  },
  openGraph: {
    title: 'Creator Blogs & Editorial Stories | Lighthouse Reels',
    description:
      'Explore behind-the-scenes essays, director commentaries, film analysis, and deep dives published by the Lighthouse Reels creator community.',
    url: `${SITE_CONFIG.url}/blogs`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/icon.png`,
        width: 512,
        height: 512,
        alt: 'Lighthouse Reels Blogs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creator Blogs & Editorial Stories | Lighthouse Reels',
    description:
      'Explore behind-the-scenes essays, director commentaries, film analysis, and deep dives published by the Lighthouse Reels creator community.',
    creator: SITE_CONFIG.twitterHandle,
  },
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
