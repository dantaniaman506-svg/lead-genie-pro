import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Moon, Sun, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/lead-hunter";
import { signInFn } from "@/lib/leads.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lead Hunter — AI Investor Lead Generation" },
      {
        name: "description",
        content:
          "Log in to Lead Hunter and generate verified real estate investor leads with AI-powered search and instant email delivery.",
      },
      { property: "og:title", content: "Lead Hunter — AI Investor Lead Generation" },
      {
        property: "og:description",
        content: "Generate verified real estate investor leads with AI-powered search and instant email delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, email: session, ready, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard" });
  }, [ready, session, navigate]);

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    setError("");
    setSubmitting(true);
    try {
      const res = await signInFn({ data: { email: email.trim(), password } });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      signIn(res.email);
      navigate({ to: "/dashboard" });
    } catch {
      setError("Could not sign you in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[420px] w-[620px] rounded-[50%] bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 left-0 h-[360px] w-[520px] rounded-[50%] bg-brand/15 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <Logo size="lg" />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative flex h-10 w-[74px] items-center rounded-full border border-border bg-card p-1"
        >
          <span
            className={`absolute flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 ${
              theme === "dark" ? "translate-x-0" : "translate-x-8"
            }`}
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>
          <span className="flex w-full justify-between px-2 text-muted-foreground">
            <Moon className="h-4 w-4" />
            <Sun className="h-4 w-4" />
          </span>
        </button>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <h1 className="text-center text-5xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Log in to access your <span className="font-semibold text-brand">dashboard</span>
        </p>

        <form onSubmit={submit} className="card-soft mt-8 space-y-6 p-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-foreground">
              Email Address
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4">
              <Mail className="h-5 w-5 text-brand" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                maxLength={255}
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-foreground">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4">
              <Lock className="h-5 w-5 text-brand" />
              <input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                maxLength={128}
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility">
                {show ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setRemember((r) => !r)} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${
                  remember ? "border-brand bg-brand/10 text-brand" : "border-border"
                }`}
              >
                {remember && <Check className="h-4 w-4" />}
              </span>
              <span className="text-sm text-foreground">Remember me</span>
            </button>
            <span className="text-sm font-semibold text-brand">Forgot password?</span>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            className="brand-gradient glow-brand flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold text-primary-foreground transition-transform active:scale-[0.99]"
          >
            Login <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
