"use client";
import { useCallback, useEffect, useState } from "react";
import type { CatalogState } from "@/lib/catalog/types";
import { Button } from "@/components/ui/button";
type Status = Omit<CatalogState, "job"> & {
  cronConfigured: boolean;
  job?: {
    year: string;
    startedAt: string;
    pages: number;
    pendingPages: number;
    discovered: number;
    imported: number;
  };
};
export function CatalogStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/catalog", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setStatus(data);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load catalog status.",
      );
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function action(name: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await refresh();
      window.dispatchEvent(new Event("catalog-updated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Catalog action failed.");
    } finally {
      setBusy(false);
    }
  }
  const date = (value?: string) =>
    value ? new Date(value).toLocaleString() : "Not yet";
  return (
    <section
      className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
      aria-label="Catalog automation"
    >
      <h2 className="text-lg font-semibold">Automatic catalog updates</h2>
      <p className="text-sm text-slate-600">
        Checks for a complete undergraduate catalog weekly. Unfinished checks
        retry daily. Assigned degree requirements stay on the reviewed 2026–2027
        planning catalog.
      </p>
      {status && (
        <>
          <p className="font-medium">
            {status.paused
              ? "Paused"
              : status.error ||
                  status.requirementsError ||
                  status.requirements?.changed ||
                  (status.lastSuccess &&
                    Date.now() - Date.parse(status.lastSuccess) > 9 * 86400000)
                ? "Needs attention — automatic retries enabled"
                : status.job
                  ? "Import in progress"
                  : status.activeVersion
                    ? "Up to date"
                    : "Waiting for the first complete import"}
          </p>
          {!status.cronConfigured && (
            <p role="alert" className="text-amber-800">
              Scheduled checks are not configured yet.
            </p>
          )}
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Published catalog</dt>
              <dd>{status.source?.year ?? "Built-in curated course list"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Verified coverage</dt>
              <dd>
                {status.courseCount
                  ? `${status.courseCount} courses / ${status.departmentCount} departments`
                  : "Full catalog not imported yet"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last successful import</dt>
              <dd>{date(status.lastSuccess)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last attempt</dt>
              <dd>{date(status.lastAttempt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Next full check due</dt>
              <dd>
                {status.nextCheck
                  ? date(status.nextCheck)
                  : "Next scheduled run"}
              </dd>
            </div>
          </dl>
          {status.job && (
            <p className="text-sm">
              {status.job.year}: {status.job.pages} listing pages checked;{" "}
              {status.job.imported} of {status.job.discovered} discovered
              courses verified.
            </p>
          )}
          {status.error && (
            <p
              role="alert"
              className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              {status.error}
            </p>
          )}
          {status.requirementsError && (
            <p role="alert" className="text-sm text-amber-900">
              Requirement checks need attention: {status.requirementsError}
            </p>
          )}
          {status.requirements && (
            <details
              className="rounded-lg border p-3 text-sm"
              open={status.requirements.changed}
            >
              <summary className="cursor-pointer font-medium">
                {status.requirements.changed
                  ? "Requirement changes need review"
                  : "Degree requirement source checks"}
              </summary>
              <p className="my-2">{status.requirements.message}</p>
              <p>Checked: {date(status.requirements.checkedAt)}</p>
              {status.requirements.previousDocuments && (
                <details>
                  <summary>Previously checked requirements</summary>
                  {status.requirements.previousDocuments.map((doc) => (
                    <p key={doc.url} className="mt-2 max-h-48 overflow-auto">
                      {doc.text}
                    </p>
                  ))}
                </details>
              )}
              {status.requirements.documents.map((doc) => (
                <details key={doc.url} className="mt-2">
                  <summary>{doc.title}</summary>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    Official source
                  </a>
                  <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
                    {doc.text}
                  </p>
                </details>
              ))}
            </details>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || status.paused}
              onClick={() => void action("retry")}
            >
              {busy ? "Working…" : "Check now"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void action(status.paused ? "resume" : "pause")}
            >
              {status.paused
                ? "Resume automatic checks"
                : "Pause automatic checks"}
            </Button>
            {status.previousVersion && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void action("rollback")}
              >
                Restore previous catalog and pause
              </Button>
            )}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
