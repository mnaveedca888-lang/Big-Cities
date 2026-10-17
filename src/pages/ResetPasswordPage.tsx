import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/validation/auth';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const form = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token: params.get('token') ?? '' }, mode: 'onBlur' });
  return <><Helmet><title>Reset Password | Big Cities Event Monitor</title></Helmet><div className="space-y-6"><div><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-slate-600">Use a strong password to secure your workspace.</p></div><form className="space-y-4" onSubmit={form.handleSubmit(() => undefined)} noValidate><FormField id="password" label="New password" error={form.formState.errors.password?.message}><Input id="password" type="password" autoComplete="new-password" {...form.register('password')} /></FormField><FormField id="confirmPassword" label="Confirm password" error={form.formState.errors.confirmPassword?.message}><Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} /></FormField><input type="hidden" {...form.register('token')} /><Button className="w-full" type="submit">Update password</Button></form><Link to="/login" className="text-sm text-slate-600">Back to sign in</Link></div></>;
}

