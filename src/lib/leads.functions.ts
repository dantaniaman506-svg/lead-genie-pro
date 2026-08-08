import { createServerFn } from "@tanstack/react-start";

const WEBHOOK_URL = "https://hook.us2.make.com/wm6cc3pf7qo515ydmf89ci6enwccxi8q";

export type RawLead = {
  name?: string | null;
  email?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  country?: string | null;
};

export type WebhookResult =
  | { status: "success"; lead_count: number; leads: RawLead[]; message?: string }
  | { status: "no_results"; lead_count: number; message: string }
  | { status: "error"; message: string };

type Payload = {
  session_id: string;
  owner_email: string;
  countries: string[];
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  lead_type?: string;
  contact_fields?: string[];
};

export const generateLeadsFn = createServerFn({ method: "POST" })
  .inputValidator((data: Payload) => {
    if (!Array.isArray(data.countries) || data.countries.length === 0) {
      throw new Error("Select at least one country.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.owner_email ?? ""))) {
      throw new Error("A valid email is required.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<WebhookResult> => {
    const secret = process.env["N8N_WEBHOOK_SECRET"] ?? "";

    let res: Response;
    try {
      res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-webhook-secret": secret } : {}),
        },
        body: JSON.stringify(data),
      });
    } catch {
      return { status: "error", message: "Could not reach the lead service. Please try again." };
    }

    const text = await res.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    const obj = (payload ?? {}) as Record<string, unknown>;
    const status = typeof obj["status"] === "string" ? (obj["status"] as string) : null;
    const message = typeof obj["message"] === "string" ? (obj["message"] as string) : null;

    if (status === "success") {
      const leads = Array.isArray(obj["leads"]) ? (obj["leads"] as RawLead[]) : [];
      return {
        status: "success",
        lead_count: typeof obj["lead_count"] === "number" ? (obj["lead_count"] as number) : leads.length,
        leads,
        ...(message ? { message } : {}),
      };
    }
    if (status === "no_results") {
      return { status: "no_results", lead_count: 0, message: message ?? "No leads found — try widening your filters." };
    }
    if (status === "error") {
      return { status: "error", message: message ?? "The lead service returned an error." };
    }

    if (!res.ok) {
      const fallback =
        res.status === 401 || res.status === 403
          ? "Unauthorized — the webhook secret was rejected."
          : res.status === 400
            ? "Missing or invalid fields in the request."
            : res.status === 502
              ? "Lead source temporarily unavailable. Please try again shortly."
              : `System is busy (${res.status}). Please try again shortly.`;
      return { status: "error", message: message ?? fallback };
    }

    return { status: "error", message: "Unexpected response from the lead service." };
  });

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const expectedEmail = (process.env["APP_LOGIN_EMAIL"] ?? "").trim().toLowerCase();
    const expectedPassword = process.env["APP_LOGIN_PASSWORD"] ?? "";
    const email = String(data.email ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");

    if (!expectedEmail || !expectedPassword) {
      return { ok: false as const, message: "Login is not configured yet." };
    }
    if (email !== expectedEmail || password !== expectedPassword) {
      return { ok: false as const, message: "Incorrect email or password." };
    }
    return { ok: true as const, email };
  });
