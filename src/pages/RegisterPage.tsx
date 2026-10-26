import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { registerSchema, type RegisterFormInput, type RegisterFormValues } from '@/validation/auth';
import { useAuth } from '@/contexts/AuthContext';
import { register } from '@/services/auth';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { isApiError } from '@/types/errors';

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterFormInput, any, RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' });
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const result = await register(values);
      signIn(result.data.user, result.data, values.rememberMe);
    } catch (error) {
      const message = isApiError(error) ? error.message : error instanceof Error ? error.message : 'Unable to create your account. Please try again.';
      form.setError('root', { message });
      return;
    }
    navigate('/dashboard', { replace: true });
  };
  return (
    <>
      <Helmet>
        <title>Register | Big Cities Event Monitor</title>
        <meta name="description" content="Create an account to personalize event discovery and alerts." />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Start building your curated event network with a modern workspace.</p>
        </div>
        {form.formState.errors.root?.message ? <Alert variant="warning">{form.formState.errors.root.message}</Alert> : null}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField id="name" label="Full name" error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          </FormField>
          <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          </FormField>
          <FormField id="password" label="Password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" defaultChecked {...form.register('rememberMe')} />Remember me</label>
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner /> : 'Register'}</Button>
        </form>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Already have an account? <Link to="/login" className="font-semibold text-slate-950 dark:text-white">Sign in</Link>
        </p>
      </div>
    </>
  );
}

