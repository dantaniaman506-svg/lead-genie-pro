import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Mail, Phone, Building2, Search, Linkedin, MoreVertical, Plus, BadgeCheck, ListFilter } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { initials, timeAgo, useStore } from "@/lib/lead-hunter";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Lead Hunter" },
      { name: "description", content: "Manage and explore every investor lead generated for your real estate pipeline." },
      { property: "og:title", content: "Leads — Lead Hunter" },
      { property: "og:description", content: "Manage and explore your generated investor leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <LeadsPage />
    </AppShell>
  ),
});

function LeadsPage() {
  const { leads } = useStore();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"new" | "old" | "name">("new");

  const stats = useMemo(
    () => ({
      total: leads.length,
      email: leads.filter((l) => l.email).length,
      phone: leads.filter((l) => l.phone).length,
      companies: new Set(leads.map((l) => l.company).filter((c) => c && c !== "—")).size,
    }),
    [leads],
  );

  const visible = useMemo(() => {
    let list = leads.filter((l) =>
      [l.name, l.company, l.title, l.email ?? ""].join(" ").toLowerCase().includes(query.toLowerCase()),
    );
    if (filter === "email") list = list.filter((l) => l.email);
    if (filter === "phone") list = list.filter((l) => l.phone);
    if (filter === "verified") list = list.filter((l) => l.verified);
    const sorted = [...list];
    if (sort === "new") sorted.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "old") sorted.sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [leads, query, filter, sort]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and explore your generated leads.</p>
        </div>
        <button
          onClick={() => setShowSearch((s) => !s)}
          aria-label="Search leads"
          className="card-soft flex h-14 w-14 items-center justify-center"
        >
          <Search className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {showSearch && (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company or title"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-brand"
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} value={stats.total} label="Total Leads" />
        <Stat icon={Mail} value={stats.email} label="Email Found" />
        <Stat icon={Phone} value={stats.phone} label="With Phone" />
        <Stat icon={Building2} value={stats.companies} label="Companies" />
      </div>

      <div className="flex gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold outline-none"
        >
          <option value="all">All Leads</option>
          <option value="email">With Email</option>
          <option value="phone">With Phone</option>
          <option value="verified">Verified Only</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold outline-none"
        >
          <option value="new">Sort: Newest First</option>
          <option value="old">Sort: Oldest First</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
        <div className="card-soft hidden h-[50px] w-[50px] items-center justify-center sm:flex">
          <ListFilter className="h-5 w-5" />
        </div>
      </div>

      <div className="card-soft divide-y divide-border overflow-hidden">
        {visible.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-semibold text-foreground">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Run a search from the dashboard to start hunting.</p>
          </div>
        )}
        {visible.map((lead) => (
          <article key={lead.id} className="relative flex gap-3 p-4">
            <span className="absolute left-0 top-4 h-10 w-1 rounded-r-full bg-brand" />
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/5 text-sm font-bold text-brand">
              {initials(lead.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-extrabold text-foreground">{lead.name}</h2>
                {lead.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand" />}
                <span className="ml-auto rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold capitalize text-accent-foreground">
                  {lead.leadType.replace("_", " ")}
                </span>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{lead.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" /> {lead.company}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Tag>{lead.country}</Tag>
                <Tag>{lead.budget}</Tag>
                <Tag>{lead.interest}</Tag>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Action href={lead.email ? `mailto:${lead.email}` : null} label="Email">
                  <Mail className="h-4 w-4" />
                </Action>
                <Action href={lead.phone ? `tel:${lead.phone}` : null} label="Phone">
                  <Phone className="h-4 w-4" />
                </Action>
                <Action href={lead.linkedin} label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Action>
                <span className="ml-auto text-xs text-muted-foreground">{timeAgo(lead.createdAt)}</span>
              </div>
              {!lead.phone && (
                <p className="mt-2 text-xs text-muted-foreground">Phone: fetching — delivered when available.</p>
              )}
            </div>
          </article>
        ))}
      </div>

      <Link
        to="/dashboard"
        className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand text-base font-bold text-brand"
      >
        <Plus className="h-5 w-5" /> Generate New Leads
      </Link>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{children}</span>;
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <div className="card-soft p-4">
      <Icon className="h-6 w-6 text-brand" />
      <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Action({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const cls = "flex h-10 w-10 items-center justify-center rounded-full border border-border";
  if (!href)
    return (
      <span aria-label={`${label} not available`} className={`${cls} text-muted-foreground/40`}>
        {children}
      </span>
    );
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={`${cls} text-foreground hover:border-brand hover:text-brand`}>
      {children}
    </a>
  );
}
