import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles,
  Globe,
  User,
  Home,
  Plus,
  Search,
  ListFilter,
  Check,
  Loader2,
  Lock,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { formatMoney, useStore, type Filters } from "@/lib/lead-hunter";
import { generateLeads } from "@/lib/generate-leads";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lead Hunter" },
      {
        name: "description",
        content: "Set location, budget, investor type and interests, then generate verified investor leads instantly.",
      },
      { property: "og:title", content: "Dashboard — Lead Hunter" },
      { property: "og:description", content: "Generate verified investor leads with smart filters or AI chat search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

const COUNTRIES = ["UAE", "Saudi Arabia", "Qatar", "Kuwait", "United Kingdom", "United States", "India", "Singapore"];
const STEPS = [10_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];
const INVESTOR_TYPES = [{ label: "Investor", icon: User }];
const INTEREST_OPTIONS = ["Real Estate"];
const PROPERTY_TYPES = ["Villa", "Apartment", "Townhouse", "Commercial", "Land", "Any"];
const LOCKED_CONTACT_FIELDS = ["email", "phone", "instagram"];


function Dashboard() {
  const { name, email, addRun } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openCountries, setOpenCountries] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    countries: ["UAE"],
    propertyType: "Villa",
    budgetMin: 50_000,
    budgetMax: 10_000_000,
    currency: "USD",
    leadType: "investor",
    investorTypes: ["Investor"],
    interests: ["Real Estate"],
    contactFields: ["linkedin"],
    limit: 20,
  });

  const [range, setRange] = useState<[number, number]>([1, 5]);
  const budget = useMemo(() => [STEPS[range[0]]!, STEPS[range[1]]!] as const, [range]);

  const toggle = <K extends keyof Filters>(key: K, value: string) =>
    setFilters((f) => {
      const list = f[key] as unknown as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next.length ? next : list };
    });

  async function run() {
    if (!email) return;
    if (!filters.countries.length) {
      toast.error("Select at least one country.");
      return;
    }
    setLoading(true);
    const sessionId = crypto.randomUUID();
    const payload: Filters = { ...filters, budgetMin: budget[0], budgetMax: budget[1] };
    const res = await generateLeads({
      sessionId,
      ownerEmail: email,
      filters: payload,
    });

    setLoading(false);

    const base = {
      sessionId,
      createdAt: Date.now(),
      countries: payload.countries,
      leadType: payload.leadType,
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      investorTypes: payload.investorTypes,
      interests: payload.interests,
    };

    if (res.status === "success") {
      addRun({ ...base, count: res.leads.length, status: "success" }, res.leads);
      toast.success(`${res.leads.length} leads generated — a copy was sent to ${email}`);
      navigate({ to: "/leads" });
      return;
    }
    addRun({ ...base, count: 0, status: res.status, message: res.message }, []);
    if (res.status === "no_results") toast.warning(res.message);
    else toast.error(res.message);
  }

  return (
    <div className="space-y-5">
      <section className="card-soft overflow-hidden p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Hey {name}! 👋</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Find verified investors for your next real estate opportunity.
            </p>
          </div>
          <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center sm:flex">
            <div className="absolute inset-0 rounded-full bg-brand/15 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-8 border-brand/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-brand bg-brand/20" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-brand" />
          Smart Search
        </div>
      </section>



      <section className="card-soft space-y-7 p-6">
        <h2 className="text-xl font-extrabold text-foreground">Find Investors</h2>

        <div className="space-y-3">
          <StepLabel n={1} text="Select Location" />
          <button
            onClick={() => setOpenCountries((o) => !o)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left"
          >
            <Globe className="h-5 w-5 text-brand" />
            <span className={`flex-1 text-sm ${filters.countries.length ? "text-foreground" : "text-muted-foreground"}`}>
              {filters.countries.length ? filters.countries.join(", ") : "Select countries or regions"}
            </span>
            <span className="text-muted-foreground">▾</span>
          </button>
          {openCountries && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary p-3">
              {COUNTRIES.map((c) => {
                const on = filters.countries.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggle("countries", c)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${
                      on ? "bg-brand/15 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {c} {on && <Check className="h-4 w-4 text-brand" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <StepLabel n={2} text="Set Budget Range" muted="(USD)" />
          <div className="flex items-center justify-between">
            <span className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-brand">
              {formatMoney(budget[0])}
            </span>
            <span className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-brand">
              {formatMoney(budget[1])}
            </span>
          </div>
          <Slider
            value={range}
            min={0}
            max={STEPS.length - 1}
            step={1}
            onValueChange={(v) => setRange([v[0] ?? 0, v[1] ?? STEPS.length - 1])}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            {STEPS.map((s) => (
              <span key={s}>{formatMoney(s)}</span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <StepLabel n={3} text="Investor Type" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {INVESTOR_TYPES.map((t) => {
              const on = filters.investorTypes.includes(t.label);
              return (
                <button
                  key={t.label}
                  onClick={() => toggle("investorTypes", t.label)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center text-xs font-semibold transition-colors ${
                    on ? "border-brand bg-brand/10 text-foreground" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {on && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <t.icon className={`h-6 w-6 ${on ? "text-brand" : ""}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <StepLabel n={4} text="Investment Interests" />
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((i) => {
              const on = filters.interests.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle("interests", i)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold ${
                    on ? "border-brand bg-brand/10 text-foreground" : "border-dashed border-border text-muted-foreground"
                  }`}
                >
                  {on ? <Home className="h-4 w-4 text-brand" /> : <Plus className="h-4 w-4" />}
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <StepLabel n={5} text="Additional Filters" muted="(Optional)" />
          <button
            onClick={() => setOpenFilters((o) => !o)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left"
          >
            <ListFilter className="h-5 w-5 text-brand" />
            <span className="flex-1 text-sm text-muted-foreground">Add more filters</span>
            <span className="text-muted-foreground">▾</span>
          </button>
          {openFilters && (
            <div className="space-y-5 rounded-2xl border border-border bg-secondary p-4">
              <Field label="Property Type">
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((p) => (
                    <Chip key={p} on={filters.propertyType === p} onClick={() => setFilters((f) => ({ ...f, propertyType: p }))}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Contact Fields">
                <div className="flex flex-wrap gap-2">
                  <Chip on onClick={() => {}}>
                    linkedin
                  </Chip>
                  {LOCKED_CONTACT_FIELDS.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        toast.info("This is a demo — email and phone stay locked until the developer grants full access.")
                      }
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-3.5 py-2 text-xs font-semibold capitalize text-muted-foreground/70"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {c}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Demo access returns LinkedIn profiles only. Email and phone enrichment unlocks with full developer access.
                </p>
              </Field>

              <Field label={`Leads per generation: ${filters.limit}`}>
                <Slider
                  value={[filters.limit]}
                  min={5}
                  max={20}
                  step={5}
                  onValueChange={(v) => setFilters((f) => ({ ...f, limit: v[0] ?? 20 }))}
                />
              </Field>
            </div>
          )}
        </div>

        <button
          disabled={loading}
          onClick={() => run()}
          className="brand-gradient glow-brand flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
          {loading ? "Generating Leads..." : "Generate Leads"}
        </button>
      </section>
    </div>
  );
}

function StepLabel({ n, text, muted }: { n: number; text: string; muted?: string }) {
  return (
    <p className="flex items-center gap-2 text-base font-bold text-foreground">
      <span className="text-brand">{n}.</span> {text}
      {muted && <span className="font-medium text-muted-foreground">{muted}</span>}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-semibold capitalize ${
        on ? "border-brand bg-brand/15 text-foreground" : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
