import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatMoney, timeAgo, useStore } from "@/lib/lead-hunter";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Search History — Lead Hunter" },
      { name: "description", content: "Review every lead generation run, its filters, status and how many leads it returned." },
      { property: "og:title", content: "Search History — Lead Hunter" },
      { property: "og:description", content: "Review every lead generation run and its results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <HistoryPage />
    </AppShell>
  ),
});

function HistoryPage() {
  const { history } = useStore();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Search History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every generation run and what it returned.</p>
      </div>

      {history.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-brand" />
          <p className="mt-3 font-semibold text-foreground">No searches yet</p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm font-bold text-brand">
            Run your first search
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((run) => {
            const Icon = run.status === "success" ? CheckCircle2 : run.status === "no_results" ? AlertTriangle : XCircle;
            const tone =
              run.status === "success" ? "text-brand" : run.status === "no_results" ? "text-amber-500" : "text-destructive";
            return (
              <article key={run.sessionId} className="card-soft space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${tone}`} />
                    <p className="font-bold text-foreground">
                      {run.count} lead{run.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(run.createdAt)}</span>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {run.countries.join(", ")} · {formatMoney(run.budgetMin)} –{" "}
                  {formatMoney(run.budgetMax)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    {run.leadType.replace("_", " ")}
                  </span>
                  {run.investorTypes.map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {run.interests.map((t) => (
                    <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {t}
                    </span>
                  ))}
                </div>
                {run.message && <p className="text-xs text-muted-foreground">{run.message}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
