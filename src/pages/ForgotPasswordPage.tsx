import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/validation/auth';
import { requestPasswordReset } from '@/services/auth';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), mode: 'onBlur' });
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await requestPasswordReset(values.email);
      form.clearErrors();
      form.setValue('email', values.email);
      setSubmitted(true);
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Unable to send the reset link.' });
    }
  };
  return (
    <>
      <Helmet>
        <title>Forgot Password | Big Cities Event Monitor</title>
        <meta name="description" content="Recover access to your account securely and quickly." />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter your email and we’ll help you get back into your workspace.</p>
        </div>
        {form.formState.errors.root?.message ? <Alert variant="warning">{form.formState.errors.root.message}</Alert> : null}
        {submitted ? <Alert variant="success">If an account exists for that email, a reset link has been sent.</Alert> : null}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          </FormField>
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner /> : 'Send reset link'}</Button>
        </form>
        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">Back to sign in</Link>
      </div>
    </>
  );
}

