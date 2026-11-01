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
      body: JSON.stringify({
        "Full Name": "Test Client",
        "Phone Number": "5551234567",
        "Email Address": "client@example.com",
        "Project Details": "Website quote",
        _template: "table",
        _subject: "New Lead Quote Request - Test Client",
        _captcha: "false",
      }),
    });
  });

  it("sends capitalized booking fields, table template, reply-to and a service-named subject", () => {
    const details = { name: "Test Client", phone: "5551234567", email: "client@example.com", notes: "Discuss website", service: "Website Design" };
    const fields = bookingNotificationFields(details, "2026-11-02", "09:00", "America/Edmonton");
    expect(fields).toMatchObject({
      "Customer Name": "Test Client",
      "Email Address": "client@example.com",
      "Phone Number": "5551234567",
      "Service Booked": "Website Design",
      "Appointment Date": "2026-11-02",
      "Appointment Time": "09:00",
      "Additional Notes": "Discuss website",
      _subject: "New Appointment Booking: Website Design - Test Client",
      _template: "table",
      _replyto: "client@example.com",
    });
    const link = new URL(fields["Add to Calendar"]);
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