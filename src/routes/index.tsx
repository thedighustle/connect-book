import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contact Us" },
      { name: "description", content: "Send us a message — we'll get back to you soon." },
      { property: "og:title", content: "Contact Us" },
      { property: "og:description", content: "Send us a message — we'll get back to you soon." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  phone: z.string().trim().min(5, "Please enter a valid number").max(30).regex(/^[0-9+()\-\s.]+$/, "Please enter a valid number"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase.from("contact_submissions").insert(r.data);
    setSending(false);
    if (error) return toast.error("Something went wrong. Please try again.");
    setSent(true);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto grid max-w-5xl gap-12 px-6 pb-20 pt-8 md:grid-cols-[1fr_1.2fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Contact</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight text-foreground">Let's talk.</h1>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Have a question or an idea? Drop us a note and we'll be in touch shortly.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-8 shadow-sm">
          {sent ? (
            <div className="py-12 text-center">
              <h2 className="text-3xl font-semibold text-primary">Thank you!</h2>
              <p className="mt-2 text-muted-foreground">Your message has been received.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", message: "" }); }}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <Field id="name" label="Name" error={errors.name}>
                <Input id="name" value={form.name} onChange={set("name")} maxLength={100} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="phone" label="Phone number" error={errors.phone}>
                  <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} />
                </Field>
                <Field id="email" label="Email" error={errors.email}>
                  <Input id="email" type="email" value={form.email} onChange={set("email")} maxLength={255} />
                </Field>
              </div>
              <Field id="message" label="Message" error={errors.message}>
                <Textarea id="message" rows={5} value={form.message} onChange={set("message")} maxLength={2000} />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={sending}>
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
