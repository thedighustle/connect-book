CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  booking_date date NOT NULL,
  booking_time text NOT NULL CHECK (booking_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_date, booking_time)
);
GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can book" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (booking_date >= current_date);

CREATE OR REPLACE FUNCTION public.get_booked_times(_date date)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT booking_time FROM public.bookings WHERE booking_date = _date;
$$;
GRANT EXECUTE ON FUNCTION public.get_booked_times(date) TO anon, authenticated;