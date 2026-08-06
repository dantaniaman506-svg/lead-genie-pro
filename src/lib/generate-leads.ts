import { WEBHOOK_URL, type Filters, type Lead } from "./lead-hunter";

type ApiResult =
  | { status: "success"; leads: Lead[] }
  | { status: "no_results"; message: string }
  | { status: "error"; message: string };

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim() && v.toLowerCase() !== "null") return v.trim();
  }
  return null;
}

function normalize(raw: unknown, sessionId: string, filters: Filters, i: number): Lead {
  const o = (raw ?? {}) as Record<string, unknown>;
  const name = pick(o, ["name", "full_name", "fullName", "person_name"]) ?? "Unknown Lead";
  return {
    id: pick(o, ["id", "person_id", "apollo_id"]) ?? `${sessionId}-${i}`,
    name,
    title: pick(o, ["title", "job_title", "headline"]) ?? "—",
    company: pick(o, ["company", "organization", "organization_name", "company_name"]) ?? "—",
    country: pick(o, ["country", "location", "person_location"]) ?? (filters.countries[0] ?? "—"),
    email: pick(o, ["email", "personal_email", "work_email"]),
    phone: pick(o, ["phone", "phone_number", "mobile"]),
    linkedin: pick(o, ["linkedin", "linkedin_url", "linkedinUrl"]),
    instagram: pick(o, ["instagram", "instagram_url"]),
    budget: pick(o, ["budget", "budget_range"]) ?? "—",
    interest: pick(o, ["interest", "investment_interest"]) ?? (filters.interests[0] ?? "Real Estate"),
    leadType: pick(o, ["lead_type", "leadType"]) ?? filters.leadType,
    verified: o["verified"] === true || Boolean(pick(o, ["email", "personal_email", "work_email"])),
    createdAt: Date.now(),
    sessionId,
  };
}

function extractArray(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0] && typeof payload[0] === "object") {
      const inner = extractArray((payload[0] as Record<string, unknown>)["leads"]);
      if (inner) return inner;
    }
    return payload;
  }
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    for (const key of ["leads", "data", "results", "items"]) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return null;
}

export async function generateLeads(opts: {
  sessionId: string;
  ownerEmail: string;
  filters: Filters;
  secret: string;
}): Promise<ApiResult> {
  const { sessionId, ownerEmail, filters, secret } = opts;
  const body = {
    session_id: sessionId,
    owner_email: ownerEmail,
    countries: filters.countries,
    property_type: filters.propertyType,
    budget_min: filters.budgetMin,
    budget_max: filters.budgetMax,
    currency: filters.currency,
    lead_type: filters.leadType,
    investor_types: filters.investorTypes,
    investment_interests: filters.interests,
    contact_fields: filters.contactFields,
    limit: filters.limit,
    requested_at: new Date().toISOString(),
  };

  let res: Response;
  try {
    res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { status: "error", message: "Could not reach the automation service. Check your connection and try again." };
  }

  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      res.status === 401
        ? "Unauthorized — the webhook secret is missing or incorrect."
        : res.status === 429
          ? "Too many requests right now. Please wait a moment and try again."
          : `System is busy (${res.status}). Please try again shortly.`;
    return { status: "error", message: msg };
  }

  const arr = extractArray(payload);
  if (!arr || arr.length === 0) {
    return { status: "no_results", message: "No leads matched these filters. Try widening your search." };
  }

  const leads = arr.map((r, i) => normalize(r, sessionId, filters, i)).slice(0, filters.limit);
  return { status: "success", leads };
}
