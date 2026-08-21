'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">⏳</div>
        <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    </div>
  );
}
