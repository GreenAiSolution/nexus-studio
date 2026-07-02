'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Ensures every authenticated user has an organization.
 * Called on app mount to auto-create org if needed.
 */
export function OrgInit({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const [initialized, setInitialized] = useState(false);

  const getOrCreateOrg = trpc.organizations.getOrCreate.useQuery(
    undefined,
    {
      enabled: isLoaded && !!userId && !initialized,
    }
  );

  useEffect(() => {
    if (getOrCreateOrg.isSuccess) {
      setInitialized(true);
    }
  }, [getOrCreateOrg.isSuccess]);

  // Always render children, org creation is in background
  return <>{children}</>;
}
