import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, History, User, Download, Settings, Menu, Moon, Sun, LogOut, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/lead-hunter";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/history", label: "Search History", icon: History },
  { to: "/leads", label: "Leads", icon: User },
  { to: "/exports", label: "Exports", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex h-9 w-16 items-center rounded-full border border-border bg-secondary p-1 transition-colors"
    >
      <span
        className={`absolute flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 ${
          dark ? "translate-x-0" : "translate-x-7"
        }`}
      >
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span className="flex w-full justify-between px-1.5 text-muted-foreground">
        <Moon className="h-4 w-4" />
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { email, ready, signOut } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !email) navigate({ to: "/" });
  }, [ready, email, navigate]);

  useEffect(() => setOpen(false), [path]);

  if (!ready || !email) return null;

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo />
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="mt-6 truncate text-xs text-muted-foreground">Signed in as {email}</p>
            <nav className="mt-3 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                    path === item.to ? "bg-accent text-accent-foreground" : "text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive"
            >
              <LogOut className="h-5 w-5" /> Log out
            </button>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 lg:hidden">
        <div className="flex items-center justify-between rounded-3xl border border-border bg-card px-2 py-2 shadow-[var(--shadow-card)]">
          {NAV.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-semibold ${
                  active ? "text-brand" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="leading-none">{item.label.replace("Search ", "")}</span>
                <span className={`h-1 w-1 rounded-full ${active ? "bg-brand" : "bg-transparent"}`} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
