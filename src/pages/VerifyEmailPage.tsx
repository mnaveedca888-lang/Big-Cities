import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { verifyEmail } from '@/services/auth';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address…');
  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); setMessage('This verification link is missing its token.'); return; }
    verifyEmail(token).then(() => { setState('success'); setMessage('Your email has been verified. You can now sign in.'); }).catch(() => { setState('error'); setMessage('This verification link is invalid or expired.'); });
  }, [params]);
  return <><Helmet><title>Verify Email | Big Cities Event Monitor</title></Helmet><div className="space-y-4"><h1 className="text-2xl font-semibold">Email verification</h1>{state === 'loading' ? <div className="flex items-center gap-3 text-sm text-slate-600"><Spinner />{message}</div> : <Alert variant={state === 'success' ? 'success' : 'warning'}>{message}</Alert>}<Link to="/login" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Return to sign in</Link></div></>;
}

