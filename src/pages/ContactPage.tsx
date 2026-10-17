import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 1800);
  };

  return (
    <>
      <Helmet>
        <title>Contact | Big Cities Event Monitor</title>
        <meta name="description" content="Contact the team for product questions, partnerships, or support." />
      </Helmet>
      <div className="space-y-8">
        <Card className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Contact us</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">We’re building a premium experience for event discovery, and we’d love to hear from you.</p>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="contact-name">
                Name
                <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" aria-label="Name" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="contact-email">
                Email
                <Input id="contact-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" aria-label="Email" />
              </label>
            </div>
            <label className="space-y-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="contact-message">
              Message
              <textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-32 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="How can we help?" aria-label="Message" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!name.trim() || !email.trim() || !message.trim()}>{submitted ? 'Inquiry sent' : 'Send inquiry'}</Button>
              <p className="text-sm text-slate-500">Responses are prepared for future backend handoff.</p>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

