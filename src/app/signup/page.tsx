'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page has been removed and now redirects to the homepage.
 */
export default function SignUpPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/');
  }, [router]);

  return null; // Render nothing while redirecting
}
