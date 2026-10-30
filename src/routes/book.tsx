import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, startOfToday } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book an Appointment" },
      { name: "description", content: "Pick a date and time that works for you." },
      { property: "og:title", content: "Book an Appointment" },
      { property: "og:description", content: "Pick a date and time that works for you." },
    ],
  }),
  component: BookPage,
});

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  phone: z.string().trim().min(5, "Please enter a valid number").max(30).regex(/^[0-9+()\-\s.]+$/, "Please enter a valid number"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  notes: z.string().trim().max(2000),
});

function label12(t: string) {
  const [h] = t.split(":").map(Number);
  return `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
}

function BookPage() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [taken, setTaken] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ date: Date; time: string } | null>(null);

  const loadTaken = async (d: Date) => {
    const { data } = await supabase.rpc("get_booked_times", { _date: format(d, "yyyy-MM-dd") });
    setTaken((data as string[] | null) ?? []);
  };

  useEffect(() => {
    setTime(undefined);
    if (date) loadTaken(date);
  }, [date]);

  const now = new Date();
  const isPast = (t: string) => {
    if (!date || format(date, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd")) return false;
    return Number(t.slice(0, 2)) <= now.getHours();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Please choose a date";
    if (!time) errs.time = "Please choose a time";
    const r = schema.safeParse(form);
    if (!r.success) r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
    setErrors(errs);
    if (Object.keys(errs).length || !r.success || !date || !time) return;
    setSending(true);
    const { error } = await supabase.from("bookings").insert({
      name: r.data.name,
      phone: r.data.phone,
      email: r.data.email,
      notes: r.data.notes || null,
      booking_date: format(date, "yyyy-MM-dd"),
      booking_time: time,
    });
    setSending(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("That time was just taken — please pick another.");
        loadTaken(date);
        setTime(undefined);
      } else toast.error("Something went wrong. Please try again.");
      return;
    }
    setDone({ date, time });
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto max-w-lg px-6 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Confirmed</p>
          <h1 className="mt-3 text-4xl font-semibold text-foreground">You're booked in.</h1>
          <p className="mt-4 text-muted-foreground">
            {format(done.date, "EEEE, MMMM d, yyyy")} at {label12(done.time)}
          </p>
          <Button className="mt-8" variant="outline" onClick={() => { setDone(null); setDate(undefined); setForm({ name: "", phone: "", email: "", notes: "" }); }}>
            Book another
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Booking</p>
        <h1 className="mt-3 text-5xl font-semibold text-foreground">Pick a time.</h1>
        <form onSubmit={submit} noValidate className="mt-10 grid gap-8 md:grid-cols-2">
          <section className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">1. Choose a date</h2>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ before: startOfToday() }}
                className="pointer-events-auto mt-3 p-0"
              />
              {errors["date"] && <p className="text-sm text-destructive">{errors["date"]}</p>}
            </div>
            <div>
              <h2 className="text-xl font-semibold">2. Choose a time</h2>
              {!date ? (
                <p className="mt-3 text-sm text-muted-foreground">Select a date to see open times.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {TIMES.map((t) => {
                    const off = taken.includes(t) || isPast(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        disabled={off}
                        onClick={() => setTime(t)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                          time === t ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary",
                          off && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                        )}
                      >
                        {label12(t)}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors["time"] && <p className="mt-2 text-sm text-destructive">{errors["time"]}</p>}
            </div>
          </section>
          <section className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3. Your details</h2>
            <F id="b-name" label="Name" error={errors["name"]}><Input id="b-name" value={form.name} onChange={set("name")} maxLength={100} /></F>
            <F id="b-phone" label="Phone number" error={errors["phone"]}><Input id="b-phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} /></F>
            <F id="b-email" label="Email" error={errors["email"]}><Input id="b-email" type="email" value={form.email} onChange={set("email")} maxLength={255} /></F>
            <F id="b-notes" label="Notes (optional)" error={errors["notes"]}><Textarea id="b-notes" rows={3} value={form.notes} onChange={set("notes")} maxLength={2000} /></F>
            {date && time && (
              <p className="rounded-lg bg-secondary px-4 py-3 text-sm">
                {format(date, "EEE, MMM d")} at <strong>{label12(time)}</strong>
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={sending}>
              {sending ? "Booking…" : "Confirm booking"}
            </Button>
          </section>
        </form>
      </main>
    </div>
  );
}

function F({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
