'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ExploreRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      router.replace(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.replace('/home');
    }
  }, [searchParams, router]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#ECC979] border-t-transparent animate-spin mb-3" />
      <p className="text-sm text-[var(--lr-text-secondary,#9AA7B4)]">Redirecting...</p>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreRedirect />
    </Suspense>
  );
}
