"use client";
import { useEffect, useState } from "react";
import { useAcademicRecord } from "@/components/academic/academic-record-provider";
import { CatalogStatus } from "@/components/catalog/catalog-status";
import { AcademicEditor } from "@/components/academic/academic-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { record } = useAcademicRecord();
  const [admin, setAdmin] = useState<string | null>(null);
  const [authorizedOnce, setAuthorizedOnce] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setAdmin(data.email);
          setAuthorizedOnce(true);
        } else if (res.status !== 401) setError(data.error);
      })
      .catch(() => setError("Unable to check your session."))
      .finally(() => setChecking(false));
  }, []);
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmin(data.email);
      setAuthorizedOnce(true);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    const res = await fetch("/api/admin/session", { method: "DELETE" });
    if (res.ok) setAdmin(null);
    else setError("Unable to sign out. Please try again.");
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">
            Marley’s academic record
          </h1>
          <p className="mt-2 text-slate-600">
            Update coursework here to keep progress, requirements, and every
            plan in sync.
          </p>
        </div>
        {admin && (
          <div className="text-right text-sm">
            <p className="mb-2 text-slate-500">{admin}</p>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        )}
      </div>
      {checking ? (
        <p>Checking admin access…</p>
      ) : (
        !admin && (
          <form
            onSubmit={signIn}
            className="max-w-md space-y-4 rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Admin sign-in</h2>
            <p className="text-sm text-slate-500">
              Use your approved account. Only admins can change the academic
              record.
            </p>
            <label className="block space-y-1 text-sm font-medium">
              Email
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Password
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {admin && <CatalogStatus />}
      {authorizedOnce && record && (
        <AcademicEditor
          initialRecord={record}
          canSave={!!admin}
          onSessionExpired={() => setAdmin(null)}
        />
      )}
      {admin && !record && (
        <p>The academic record must be available before you can edit it.</p>
      )}
    </div>
  );
}
