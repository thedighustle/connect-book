export const OWNER_EMAIL = "rikhi.ktik@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${OWNER_EMAIL}`;

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

export async function postFormSubmission(fields: Record<string, string>) {
  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...fields, _captcha: "false" }),
  });
  if (!response.ok) throw new Error(`Form submission failed (${response.status})`);
  const result: { success?: boolean | string; message?: string } = await response.json();
  if (result.success !== true && result.success !== "true") {
    throw new Error(result.message || "The form service did not accept the submission.");
  }
}

export function submitQuote(fields: ContactDetails & { message: string }) {
  return postFormSubmission({
    "Full Name": fields.name,
    "Phone Number": fields.phone,
    "Email Address": fields.email,
    "Project Details": fields.message,
    _template: "table",
    _subject: `New Lead Quote Request - ${fields.name}`,
  });
}

export function bookingNotificationFields(
  details: ContactDetails & { notes: string },
  date: string,
  time: string,
  timeZone: string,
) {
  const start = `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
  const endTime = `${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}${time.slice(3)}`;
  const end = `${date.replaceAll("-", "")}T${endTime}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `The Digital Hustle — Booking with ${details.name}`,
    dates: `${start}/${end}`,
    ctz: timeZone,
    details: `Client: ${details.name}\nPhone: ${details.phone}\nEmail: ${details.email}\nNotes: ${details.notes || "None"}`,
    add: OWNER_EMAIL,
  });
  return {
    ...details,
    booking_date: date,
    booking_time: time,
    time_zone: timeZone,
    primary_attendee: OWNER_EMAIL,
    calendar_link: `https://calendar.google.com/calendar/render?${params}`,
    _subject: "New Website Booking",
  };
}