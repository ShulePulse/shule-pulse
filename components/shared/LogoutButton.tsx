'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function LogoutButton({ label = 'Toka' }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} loading={loading}>
      <LogOut className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
