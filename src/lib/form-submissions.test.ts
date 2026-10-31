import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingNotificationFields, postFormSubmission, submitQuote } from "./form-submissions";

afterEach(() => vi.unstubAllGlobals());

describe("Owner form delivery", () => {
  it("posts every quote field to the selected address with the required settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: "true" }) });
    vi.stubGlobal("fetch", fetchMock);
    const fields = { name: "Test Client", phone: "5551234567", email: "client@example.com", message: "Website quote" };
    await submitQuote(fields);
    expect(fetchMock).toHaveBeenCalledWith("https://formsubmit.co/ajax/rikhi.ktik@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...fields, _subject: "New Website Quote Request", _captcha: "false" }),
    });
  });

  it("includes booking date, slot, all client details and the owner as calendar attendee", () => {
    const details = { name: "Test Client", phone: "5551234567", email: "client@example.com", notes: "Discuss website" };
    const fields = bookingNotificationFields(details, "2026-11-02", "09:00", "America/Edmonton");
    expect(fields).toMatchObject({ ...details, booking_date: "2026-11-02", booking_time: "09:00", primary_attendee: "rikhi.ktik@gmail.com" });
    const link = new URL(fields.calendar_link);
    expect(link.searchParams.get("add")).toBe("rikhi.ktik@gmail.com");
    expect(link.searchParams.get("dates")).toBe("20261102T090000/20261102T100000");
    expect(link.searchParams.get("ctz")).toBe("America/Edmonton");
    expect(link.searchParams.get("details")).toContain("client@example.com");
  });

  it("rejects service errors instead of reporting success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: "false" }) }));
    await expect(postFormSubmission({ name: "Test" })).rejects.toThrow();
  });
});