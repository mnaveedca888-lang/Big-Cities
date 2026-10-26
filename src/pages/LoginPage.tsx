import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { loginSchema, type LoginFormInput, type LoginFormValues } from '@/validation/auth';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/auth';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { isApiError } from '@/types/errors';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginFormInput, any, LoginFormValues>({ resolver: zodResolver(loginSchema), mode: 'onBlur' });
  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await login(values);
      signIn(result.data.user, result.data, values.rememberMe);
    } catch (error) {
      const message = isApiError(error) ? error.message : error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      form.setError('root', { message });
      return;
    }
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';
    navigate(destination, { replace: true });
  };
  return (
    <>
      <Helmet>
        <title>Login | Big Cities Event Monitor</title>
        <meta name="description" content="Sign in to your account to access saved events and personalized monitoring." />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Access your event workspace and curated watchlist.</p>
        </div>
        {form.formState.errors.root?.message ? <Alert variant="warning">{form.formState.errors.root.message}</Alert> : null}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          </FormField>
          <FormField id="password" label="Password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" {...form.register('rememberMe')} />Remember me</label>
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner /> : 'Continue'}</Button>
        </form>
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <Link to="/forgot-password" className="hover:text-slate-950 dark:hover:text-white">Forgot password?</Link>
          <Link to="/register" className="hover:text-slate-950 dark:hover:text-white">Create account</Link>
        </div>
      </div>
    </>
  );
}

