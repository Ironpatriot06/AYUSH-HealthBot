'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseClient';

const supabase = getBrowserSupabase();

export default function AuthConfirmPage() {
  const router = useRouter();

  const [status, setStatus] = useState<'working'|'ok'|'err'>('working');
  const [msg, setMsg] = useState('Finishing sign-in…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1️⃣ PKCE / magic link exchange
        const hasCode = !!url.searchParams.get('code');
        if (hasCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        
          if (data?.session) {
            router.replace('/admin');
          }
          return;
        }

        // 2️⃣ Hash token flow
        if (window.location.hash.startsWith('#')) {
          const h = new URLSearchParams(window.location.hash.slice(1));
          const access_token = h.get('access_token');
          const refresh_token = h.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;

            router.replace('/admin');
            return;
          }
        }

        setStatus('err');
        setMsg('No auth parameters found in URL.');
      } catch (e:any) {
        setStatus('err');
        setMsg(e?.message || 'Auth confirmation failed.');
      }
    })();
  }, [router]);

  return (
    <main style={{minHeight:'60vh',display:'grid',placeItems:'center'}}>
      <div style={{textAlign:'center',maxWidth:520}}>
        <h1 style={{fontSize:22,marginBottom:8}}>Auth Confirmation</h1>
        <p>{msg}</p>
      </div>
    </main>
  );
}