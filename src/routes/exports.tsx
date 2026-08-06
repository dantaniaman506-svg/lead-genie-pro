import { createFileRoute } from "@tanstack/react-router";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore, type Lead } from "@/lib/lead-hunter";

export const Route = createFileRoute("/exports")({
  head: () => ({
    meta: [
      { title: "Exports — Lead Hunter" },
      { name: "description", content: "Download your generated investor leads as CSV or JSON for your CRM and outreach tools." },
      { property: "og:title", content: "Exports — Lead Hunter" },
      { property: "og:description", content: "Download your investor leads as CSV or JSON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ExportsPage />
    </AppShell>
  ),
});

const COLUMNS: (keyof Lead)[] = [
  "name",
  "title",
  "company",
  "country",
  "email",
  "phone",
  "linkedin",
  "instagram",
  "leadType",
  "sessionId",
];

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportsPage() {
  const { leads } = useStore();

  const exportCsv = () => {
    if (!leads.length) {
      toast.error("No leads to export yet.");
      return;
    }
    const rows = [
      COLUMNS.join(","),
      ...leads.map((l) =>
        COLUMNS.map((c) => `"${String(l[c] ?? "Not available").replace(/"/g, '""')}"`).join(","),
      ),
    ];
    download(`lead-hunter-${Date.now()}.csv`, rows.join("\n"), "text/csv");
    toast.success("CSV downloaded");
  };

  const exportJson = () => {
    if (!leads.length) {
      toast.error("No leads to export yet.");
      return;
    }
    download(`lead-hunter-${Date.now()}.json`, JSON.stringify(leads, null, 2), "application/json");
    toast.success("JSON downloaded");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Exports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Take your leads anywhere — CRM, outreach or spreadsheets.</p>
      </div>

      <div className="card-soft flex items-center justify-between p-6">
        <div>
          <p className="text-3xl font-extrabold text-foreground">{leads.length}</p>
          <p className="text-sm text-muted-foreground">leads ready to export</p>
        </div>
        <Download className="h-8 w-8 text-brand" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={exportCsv} className="card-soft flex items-center gap-4 p-5 text-left">
          <FileSpreadsheet className="h-8 w-8 text-brand" />
          <div>
            <p className="font-bold text-foreground">Export CSV</p>
            <p className="text-sm text-muted-foreground">Excel & Google Sheets ready</p>
          </div>
        </button>
        <button onClick={exportJson} className="card-soft flex items-center gap-4 p-5 text-left">
          <FileJson className="h-8 w-8 text-brand" />
          <div>
            <p className="font-bold text-foreground">Export JSON</p>
            <p className="text-sm text-muted-foreground">For automations & APIs</p>
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Fields with no data are exported as "Not available" — no placeholder or invented values are ever added.
      </p>
    </div>
  );
}
