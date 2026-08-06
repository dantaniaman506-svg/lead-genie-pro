import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const WEBHOOK_URL = "https://aribotics770.app.n8n.cloud/webhook/generate-leads";

export type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  country: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  instagram: string | null;
  budget: string;
  interest: string;
  leadType: string;
  verified: boolean;
  createdAt: number;
  sessionId: string;
};

export type SearchRun = {
  sessionId: string;
  createdAt: number;
  countries: string[];
  leadType: string;
  budgetMin: number;
  budgetMax: number;
  investorTypes: string[];
  interests: string[];
  count: number;
  status: "success" | "no_results" | "error";
  message?: string;
};

export type Filters = {
  countries: string[];
  propertyType: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  leadType: string;
  investorTypes: string[];
  interests: string[];
  contactFields: string[];
  limit: number;
};

type Store = {
  ready: boolean;
  email: string | null;
  name: string;
  signIn: (email: string) => void;
  signOut: () => void;
  leads: Lead[];
  history: SearchRun[];
  addRun: (run: SearchRun, leads: Lead[]) => void;
  clearLeads: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  webhookSecret: string;
  setWebhookSecret: (v: string) => void;
};

const Ctx = createContext<Store | null>(null);

const KEY = "lead-hunter-state-v1";

type Persisted = {
  email: string | null;
  leads: Lead[];
  history: SearchRun[];
  theme: "light" | "dark";
  webhookSecret: string;
};

const empty: Persisted = {
  email: null,
  leads: [],
  history: [],
  theme: "light",
  webhookSecret: "",
};

export function LeadHunterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...(JSON.parse(raw) as Persisted) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state, ready]);

  const value = useMemo<Store>(
    () => ({
      ready,
      email: state.email,
      name: state.email ? prettyName(state.email) : "there",
      signIn: (email) => setState((s) => ({ ...s, email })),
      signOut: () => setState((s) => ({ ...s, email: null })),
      leads: state.leads,
      history: state.history,
      addRun: (run, leads) =>
        setState((s) => ({
          ...s,
          history: [run, ...s.history].slice(0, 50),
          leads: [...leads, ...s.leads].slice(0, 400),
        })),
      clearLeads: () => setState((s) => ({ ...s, leads: [], history: [] })),
      theme: state.theme,
      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      webhookSecret: state.webhookSecret,
      setWebhookSecret: (v) => setState((s) => ({ ...s, webhookSecret: v })),
    }),
    [state, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside LeadHunterProvider");
  return ctx;
}

function prettyName(email: string) {
  const raw = email.split("@")[0] ?? "";
  const first = raw.split(/[._-]/)[0] ?? raw;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function formatMoney(v: number) {
  if (v >= 1_000_000) return `$${v / 1_000_000}M${v >= 10_000_000 ? "+" : ""}`;
  if (v >= 1000) return `$${v / 1000}K`;
  return `$${v}`;
}

export function timeAgo(ts: number) {
  const diff = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
  return `${Math.round(diff / 86400)} days ago`;
}
