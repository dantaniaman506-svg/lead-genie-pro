import { type Filters, type Lead } from "./lead-hunter";
import { generateLeadsFn, type RawLead } from "./leads.functions";

type ApiResult =
  | { status: "success"; leads: Lead[] }
  | { status: "no_results"; message: string }
  | { status: "error"; message: string };

const UNAVAILABLE = new Set(["", "null", "n/a", "na", "none", "not_available", "not available", "unknown"]);

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || UNAVAILABLE.has(t.toLowerCase())) return null;
  return t;
}

function normalize(raw: RawLead, sessionId: string, filters: Filters, i: number): Lead {
  const email = clean(raw.email);
  return {
    id: `${sessionId}-${i}`,
    name: clean(raw.name) ?? "Unknown Lead",
    title: clean(raw.title) ?? "—",
    company: clean(raw.company) ?? "—",
    country: clean(raw.country) ?? (filters.countries[0] ?? "—"),
    email,
    phone: clean(raw.phone),
    linkedin: clean(raw.linkedin),
    instagram: clean(raw.instagram),
    budget: "—",
    interest: filters.interests[0] ?? "Real Estate",
    leadType: filters.leadType,
    verified: Boolean(email),
    createdAt: Date.now(),
    sessionId,
  };
}

export async function generateLeads(opts: {
  sessionId: string;
  ownerEmail: string;
  filters: Filters;
}): Promise<ApiResult> {
  const { sessionId, ownerEmail, filters } = opts;

  let res: Awaited<ReturnType<typeof generateLeadsFn>>;
  try {
    res = await generateLeadsFn({
      data: {
        session_id: sessionId,
        owner_email: ownerEmail,
        countries: filters.countries,
        property_type: filters.propertyType,
        budget_min: filters.budgetMin,
        budget_max: filters.budgetMax,
        currency: filters.currency,
        lead_type: filters.leadType,
        contact_fields: filters.contactFields,
      },
    });
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error && e.message ? e.message : "Could not reach the lead service. Please try again.",
    };
  }

  if (res.status === "success") {
    const leads = res.leads.map((r, i) => normalize(r, sessionId, filters, i)).slice(0, filters.limit);
    if (!leads.length) return { status: "no_results", message: "No leads found — try widening your filters." };
    return { status: "success", leads };
  }
  if (res.status === "no_results") return { status: "no_results", message: res.message };
  return { status: "error", message: res.message };
}
