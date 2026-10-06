'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfileRootPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const target = profile?.username || user.id;
        router.replace(`/profile/${target}`);
      } else {
        router.replace('/login?redirect=/profile');
      }
    }
  }, [user, profile, isLoading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#ECC979] border-t-transparent animate-spin" />
    </div>
  );
}
