import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Shield, Trash2, User, Webhook } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/lead-hunter";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lead Hunter" },
      { name: "description", content: "Manage your account, delivery email, appearance and automation security settings." },
      { property: "og:title", content: "Settings — Lead Hunter" },
      { property: "og:description", content: "Manage your account, appearance and automation settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { email, theme, toggleTheme, signOut, clearLeads } = useStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Account, appearance and automation preferences.</p>
      </div>

      <section className="card-soft space-y-4 p-5">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <User className="h-5 w-5 text-brand" /> Account
        </p>
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Leads are delivered to</p>
          <p className="truncate font-semibold text-foreground">{email}</p>
        </div>
      </section>

      <section className="card-soft space-y-4 p-5">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <Moon className="h-5 w-5 text-brand" /> Appearance
        </p>
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-2xl bg-secondary p-4 text-sm font-semibold text-foreground"
        >
          Dark mode
          <span className={`relative h-7 w-12 rounded-full transition-colors ${theme === "dark" ? "bg-brand" : "bg-border"}`}>
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </section>

      <section className="card-soft space-y-2 p-5">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <Webhook className="h-5 w-5 text-brand" /> Automation security
        </p>
        <p className="text-sm text-muted-foreground">
          The automation webhook secret is stored securely on the server and attached to every generation request. No
          keys are exposed in the browser.
        </p>
      </section>

      <section className="card-soft space-y-3 p-5">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <Shield className="h-5 w-5 text-brand" /> Data
        </p>
        <button
          onClick={() => {
            clearLeads();
            toast.success("Local leads and history cleared");
          }}
          className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 text-sm font-semibold text-destructive"
        >
          <Trash2 className="h-5 w-5" /> Clear leads & history
        </button>
        <button
          onClick={() => {
            signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 text-sm font-semibold text-foreground"
        >
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </section>
    </div>
  );
}
