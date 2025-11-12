'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// make Next treat this as static-friendly
export const dynamic = 'force-static';

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<'working'|'ok'|'err'>('working');
  const [msg, setMsg] = useState('Finishing sign-in…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) Try PKCE / magic link exchange (?code=...)
        const hasCode = !!url.searchParams.get('code');
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          setStatus('ok'); setMsg('Signed in! You can close this tab or go back.');
          return;
        }

        // 2) Try hash tokens (#access_token=...)
        if (window.location.hash.startsWith('#')) {
          const h = new URLSearchParams(window.location.hash.slice(1));
          const access_token = h.get('access_token');
          const refresh_token = h.get('refresh_token');
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            setStatus('ok'); setMsg('Signed in! You can close this tab or go back.');
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
  }, []);

  return (
    <main style={{minHeight:'60vh',display:'grid',placeItems:'center',fontFamily:'ui-sans-serif'}}>
      <div style={{textAlign:'center',maxWidth:520}}>
        <h1 style={{fontSize:22,marginBottom:8}}>Auth Confirmation</h1>
        <p>{msg}</p>
        {status==='ok' && (
          <a href="/" style={{display:'inline-block',marginTop:16,textDecoration:'underline'}}>Go to Home</a>
        )}
      </div>
    </main>
  );
}
