'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@/components/shared/Alert';

function Inner() {
  const params = useSearchParams();
  if (params.get('error') !== 'forbidden') return null;
  return (
    <Alert variant="warning" className="mb-4">
      Huna ruhusa ya kufungua ukurasa huo. Umerudishwa kwenye ukurasa wako.
    </Alert>
  );
}

/** Shows a notice when middleware bounced the user from a page they may not open. */
export function ForbiddenNotice() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
